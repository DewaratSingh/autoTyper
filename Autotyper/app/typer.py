import time
import threading
import pyautogui
import keyboard

# ---------------- CONFIG ---------------- #

TYPING_DELAY = 0.08
LOOP_DELAY   = 0.10
SYNC_DELAY   = 0.05

pyautogui.PAUSE = 0

def set_delays(typing_delay=None, loop_delay=None, sync_delay=None):
    """Update typing speed at runtime (called from the Settings panel)."""
    global TYPING_DELAY, LOOP_DELAY, SYNC_DELAY
    if typing_delay is not None:
        TYPING_DELAY = float(typing_delay)
    if loop_delay is not None:
        LOOP_DELAY = float(loop_delay)
    if sync_delay is not None:
        SYNC_DELAY = float(sync_delay)

def get_delays():
    """Return current delay values so the UI can pre-populate the settings panel."""
    return {"typing": TYPING_DELAY, "loop": LOOP_DELAY, "sync": SYNC_DELAY}

# ---------------- STATE ---------------- #

running = False
typing_active = False
code = []
window_ref = None

lock = threading.Lock()

# Internal state
i = 0
word = 0
lines = []
next_line_idx = 0
nextprev_line_idx = 0
write_mode = True
wait = False
signal = False
move_count = 0
done = False
cursor_x = 0
waiting_for_key_release = False   # blocks next step until F8 is released after a PDF step
current_page_idx = 0              # tracks which page is currently active in VS Code


# ---------------- VS CODE FILE SWITCH ---------------- #

def _switch_vscode_file(from_page: int, to_page: int):
    """
    Switch files in VS Code using Ctrl+Alt+Right (forward) or
    Ctrl+Alt+Left (backward), pressing once per file step.
    Jump distance = abs(to_page - from_page).
    """
    global wait, current_page_idx
    wait = True
    steps = abs(to_page - from_page)
    direction = 'ctrl+alt+right' if to_page > from_page else 'ctrl+alt+left'
    for _ in range(steps):
        keyboard.send(direction)
        time.sleep(SYNC_DELAY)
    current_page_idx = to_page
    time.sleep(SYNC_DELAY * 2)   # let VS Code settle
    wait = False



# ---------------- NAVIGATION ---------------- #

def move_up():
    global wait
    wait = True
    pyautogui.press("up")
    time.sleep(SYNC_DELAY)
    wait = False

def move_down():
    global wait
    wait = True
    pyautogui.press("down")
    time.sleep(SYNC_DELAY)
    wait = False

def go_line_start():
    global wait, cursor_x
    wait = True
    cursor_x = 0
    pyautogui.press("home")
    time.sleep(SYNC_DELAY)
    wait = False

def go_line_end():
    global wait
    wait = True
    pyautogui.press("end")
    time.sleep(SYNC_DELAY)
    wait = False

def move_right():
    global wait, cursor_x
    wait = True
    cursor_x += 1
    pyautogui.press("right")
    time.sleep(SYNC_DELAY)
    wait = False

def move_left():
    global wait, cursor_x
    wait = True
    cursor_x -= 1
    pyautogui.press("left")
    time.sleep(SYNC_DELAY)
    wait = False

def backspace():
    global wait, cursor_x
    wait = True
    cursor_x -= 1
    pyautogui.press("backspace")
    time.sleep(SYNC_DELAY)
    wait = False

def sync():
    global wait
    wait = True
    time.sleep(SYNC_DELAY)
    wait = False


# ---------------- CORE LOGIC ---------------- #

def process_tick():
    global i, word, lines, next_line_idx, write_mode, nextprev_line_idx
    global wait, signal, move_count, done, cursor_x, running, waiting_for_key_release

    with lock:
        if done or not running:
            return

        if wait:
            return

        # After a PDF/image step the user must fully release the F-key before
        # the next step is allowed.  This prevents key-repeat from instantly
        # skipping past image steps while the key is still held.
        if waiting_for_key_release:
            return

        if i >= len(code):
            done = True
            running = False
            print("Typing finished")
            return

        # Find the real previous typed line number.
        # Do NOT look past a file-switch (-3) — each file has its own line context.
        prev_line_no = -1
        if i > 0:
            for k in range(i - 1, -1, -1):
                if code[k]["lineNo"] == -3:
                    break                   # stop at file boundary
                if code[k]["lineNo"] not in (-2, -1):
                    prev_line_no = code[k]["lineNo"]
                    break

        line = code[i]
        line_no = line["lineNo"]

        print(f"[TICK] i={i} line_no={line_no} prev={prev_line_no} write_mode={write_mode} word={word} lines={lines}")

        # ---------------- PDF PAGE STEP (lineNo == -2) ---------------- #
        if line_no == -2:
            page_no = line.get("pageNo")
            try:
                import ctypes
                user32   = ctypes.windll.user32
                kernel32 = ctypes.windll.kernel32
                hwnd = user32.FindWindowW(None, "AutoTyper")
                if hwnd:
                    fg_hwnd = user32.GetForegroundWindow()
                    fg_tid  = user32.GetWindowThreadProcessId(fg_hwnd, None)
                    my_tid  = kernel32.GetCurrentThreadId()
                    if fg_tid and fg_tid != my_tid:
                        user32.AttachThreadInput(fg_tid, my_tid, True)
                    user32.ShowWindow(hwnd, 9)
                    user32.BringWindowToTop(hwnd)
                    user32.SetForegroundWindow(hwnd)
                    user32.SetFocus(hwnd)
                    if fg_tid and fg_tid != my_tid:
                        user32.AttachThreadInput(fg_tid, my_tid, False)
            except Exception as e:
                print(f"[PDF step focus] {e}")
            if window_ref is not None and page_no is not None:
                try:
                    window_ref.evaluate_js(f"showPDFPage({page_no})")
                except Exception:
                    pass
            write_mode = False
            typing_active = False
            waiting_for_key_release = True
            i += 1
            word = 0
            signal = False
            return

        # ---------------- FILE SWITCH STEP (lineNo == -3) ---------------- #
        if line_no == -3:
            from_page = line.get('fromPage', current_page_idx)
            to_page   = line.get('toPage',   from_page + 1)
            print(f"[FILE SWITCH] page {from_page} → {to_page}")
            _switch_vscode_file(from_page, to_page)
            i += 1
            word = 0
            signal = False
            lines.clear()
            # Require explicit key re-press on the new file
            typing_active = False
            waiting_for_key_release = True
            print(f"[FILE SWITCH DONE] i={i} lines cleared — press F-key to continue")
            return

        # Shortcut keys
        if line_no == -1:
            keys = [k.strip().lower() for k in line["text"].split('+')]
            pyautogui.hotkey(*keys)
            time.sleep(TYPING_DELAY)
            write_mode = False
            i += 1
            word = 0
            signal = False
            return

        if line_no not in lines:
            lines.append(line_no)
            lines.sort()

        next_line_idx     = 0
        nextprev_line_idx = 0

        for j in range(len(lines)):
            if lines[j] == line_no:
                next_line_idx = j
            if lines[j] == prev_line_no:
                nextprev_line_idx = j

        print(f"[POS] next_idx={next_line_idx} prevnext_idx={nextprev_line_idx} move_count={move_count}")

        # ---------------- WRITE MODE ---------------- #

        if line["cp"] == -1 or signal:

            if write_mode:
                if word < len(line["text"]):
                    print(f"[WRITE] char '{line['text'][word]}' word={word}/{len(line['text'])}")
                    pyautogui.write(line["text"][word], interval=0)
                    cursor_x += 1
                    word += 1
                    time.sleep(TYPING_DELAY)
                else:
                    print(f"[WRITE DONE] line {line_no} complete → i={i+1}")
                    write_mode = False
                    i += 1
                    word = 0
                    signal = False

            else:
                if line_no > prev_line_no:
                    # Special case: very first line in this file context
                    # cursor is already at start — no Enter needed
                    if prev_line_no == -1:
                        go_line_start()
                        sync()
                        write_mode = True
                        print(f"[DIRECT WRITE] first line of file, line {line_no}")
                    else:
                        vertical_dist = next_line_idx - nextprev_line_idx
                        print(f"[DOWN] line_no={line_no} prev={prev_line_no} vdist={vertical_dist} move_count={move_count}")

                        if move_count < vertical_dist - 1:
                            move_down()
                            move_count += 1
                        else:
                            move_count = 0
                            go_line_end()
                            pyautogui.press("enter")
                            cursor_x = 0
                            sync()
                            write_mode = True
                            print(f"[ENTER+WRITE] starting write for line {line_no}")

                elif line_no < prev_line_no:
                    go_line_start()
                    vertical_dist = nextprev_line_idx - next_line_idx
                    print(f"[UP] line_no={line_no} prev={prev_line_no} vdist={vertical_dist} move_count={move_count}")

                    if move_count < vertical_dist - 1:
                        move_up()
                        move_count += 1
                        return
                    else:
                        move_count = 0

                    pyautogui.press("enter")
                    cursor_x = 0
                    sync()
                    move_up()
                    write_mode = True
                    print(f"[UP+ENTER+WRITE] starting write for line {line_no}")

        # ---------------- EDIT MODE ---------------- #

        else:
            if not write_mode:
                word = 0
                
                # Simple Case: Same logical line index (pure horizontal)
                if nextprev_line_idx == next_line_idx:
                    target = line["del"] + line["cp"]
                    if cursor_x < target:
                        move_right()
                        return
                    elif cursor_x > target:
                        move_left()
                        return
                    else:
                        move_count = 0
                        write_mode = True
                        sync()
                        return

                # Complex Case: Different logical line index (Vertical + Horizontal)
                # We reconstruct the original logic flow here for compatibility
                
                vertical_moves = abs(nextprev_line_idx - next_line_idx)
                
                # Determine direction first to know if we need to move up/down
                if nextprev_line_idx > next_line_idx:
                    # Need to move UP
                    if move_count < vertical_moves:
                         if move_count == 0: go_line_start()
                         move_up()
                         move_count += 1
                         return
                elif nextprev_line_idx < next_line_idx:
                    # Need to move DOWN
                    if move_count < vertical_moves:
                         if move_count == 0: go_line_start()
                         move_down()
                         move_count += 1
                         return
                
                # If we fall through here, verify if we need horizontal moves
                horizontal_target_steps = line["del"] + line["cp"]
                total_steps = vertical_moves + horizontal_target_steps
                
                if move_count < total_steps:
                    if move_count == vertical_moves:
                        go_line_start()
                    move_right()
                    move_count += 1
                    return
                else:
                    move_count = 0
                    write_mode = True
                    sync()

            else:
                if word < line["del"]:
                    backspace()
                    word += 1
                else:
                    word = 0
                    signal = True


# ---------------- LOOP ---------------- #

def typing_loop():
    global running, typing_active

    print("Typing loop started")

    while running:
        if typing_active:
            try:
                process_tick()
            except Exception as e:
                import traceback
                print(f"[process_tick ERROR] {e}")
                traceback.print_exc()
            time.sleep(LOOP_DELAY)
        else:
            time.sleep(0.05)


def on_key_event(event):
    global typing_active, waiting_for_key_release

    if event.event_type == 'down':
        # Only allow activation once the key has been fully released after
        # an image/PDF step (prevents key-repeat from skipping steps).
        if not waiting_for_key_release:
            typing_active = True
    elif event.event_type == 'up':
        typing_active = False
        waiting_for_key_release = False   # key released → gate open again


# ---------------- PUBLIC API ---------------- #

def start_typer(data, window=None):
    global code, running, typing_active, window_ref
    global i, word, lines, move_count, done, cursor_x
    global waiting_for_key_release, current_page_idx

    if running:
        print("Already running")
        return

    print("Starting typer...")

    # Reset state
    code = data
    running = True
    typing_active = False
    window_ref = window

    i = 0
    word = 0
    lines = []
    move_count = 0
    done = False
    cursor_x = 0
    waiting_for_key_release = False
    current_page_idx = 0

    # Start thread
    thread = threading.Thread(target=typing_loop, daemon=True)
    thread.start()

    # Hook keys
    for k in range(1, 13):
        keyboard.hook_key(f"f{k}", on_key_event)

    keyboard.on_press_key("esc", lambda e: stop_typer())

    print("Typer Ready (F1–F12 to type, ESC to stop)")


def stop_typer():
    global running
    running = False
    print("Typer stopped")


def is_running():
    return running


def is_next_step_image():
    """Return True if the NEXT step to be processed is also a PDF/image step.

    Used by main.py to decide whether to minimise AutoTyper after an image
    closes (only minimise when the next task is a code-writing step).
    """
    global i, code, running, done
    if not running or done:
        return False
    if i < len(code):
        return code[i].get("lineNo") == -2
    return False