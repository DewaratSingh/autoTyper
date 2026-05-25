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

running               = False
typing_active         = False
window_ref            = None
lock                  = threading.Lock()

# Series data (set by start_typer)
data                  = {}       # the full payload from JS
series                = []       # data["series"]

# Two-index pointer
series_idx            = 0        # which item in series[] we are on
step_in_series        = 0        # which index inside series[series_idx]["step"] we are on

# Per-file store — all per-file state lives here
# store[file_no] = {
#     cursor_x, cursor_y, lines,
#     write_mode, word, move_count, signal,
#     next_line_idx, nextprev_line_idx
# }
store                 = {}

# Global flags
page_no               = 0        # currently active file index
current_page_idx      = 0        # VS Code's currently open file index
wait                  = False
done                  = False
waiting_for_key_release = False


# ---------------- STORE HELPERS ---------------- #

def _make_file_state():
    """Return a fresh per-file state dict."""
    return {
        "cursor_x":          0,
        "cursor_y":          -1,   # -1 = not yet positioned on first line
        "lines":             [],   # sorted list of all lineNos visited in this file
        "write_mode":        True,
        "word":              0,
        "move_count":        0,
        "signal":            False,
        "next_line_idx":     0,
        "nextprev_line_idx": 0,
    }


# ---------------- VS CODE FILE SWITCH ---------------- #

def _switch_vscode_file(from_page: int, to_page: int):
    """
    Switch files in VS Code using Ctrl+Alt+Right (forward) or
    Ctrl+Alt+Left (backward), pressing once per file step.
    """
    global wait, current_page_idx
    wait = True
    steps     = abs(to_page - from_page)
    direction = 'ctrl+alt+right' if to_page > from_page else 'ctrl+alt+left'
    for _ in range(steps):
        keyboard.send(direction)
        time.sleep(SYNC_DELAY)
    current_page_idx = to_page
    time.sleep(SYNC_DELAY * 2)   # let VS Code settle
    wait = False


# ---------------- NAVIGATION PRIMITIVES ---------------- #

def move_up():
    global wait
    wait = True
    store[page_no]['cursor_y'] -= 1
    pyautogui.press("up")
    time.sleep(SYNC_DELAY)
    print("move_up")
    wait = False

def move_down():
    global wait
    wait = True
    store[page_no]['cursor_y'] += 1
    pyautogui.press("down")
    time.sleep(SYNC_DELAY)
    print("move_down")
    wait = False

def go_line_start():
    global wait
    wait = True
    store[page_no]['cursor_x'] = 0
    pyautogui.press("home")
    time.sleep(SYNC_DELAY)
    print("start")
    wait = False

def go_line_end():
    global wait
    wait = True
    pyautogui.press("end")
    time.sleep(SYNC_DELAY)
    print("end")
    wait = False

def move_right():
    global wait
    wait = True
    store[page_no]['cursor_x'] += 1
    pyautogui.press("right")
    time.sleep(SYNC_DELAY)
    print("right")
    wait = False

def move_left():
    global wait
    wait = True
    store[page_no]['cursor_x'] -= 1
    pyautogui.press("left")
    time.sleep(SYNC_DELAY)
    print("left")
    wait = False

def backspace():
    global wait
    wait = True
    store[page_no]['cursor_x'] -= 1
    pyautogui.press("backspace")
    time.sleep(SYNC_DELAY)
    print("space")
    wait = False

def sync():
    global wait
    wait = True
    time.sleep(SYNC_DELAY)
    print("sync")
    wait = False


# ---------------- STEP ADVANCE HELPER ---------------- #

def _advance_step():
    """Move to the next step in the series. Sets done=True when series is finished."""
    global series_idx, step_in_series, done
    item = series[series_idx]

    if "file" in item:
        step_in_series += 1
        if step_in_series >= len(item["step"]):
            step_in_series = 0
            series_idx += 1
    else:
        # PDF page steps have no sub-steps
        series_idx += 1
        step_in_series = 0

    if series_idx >= len(series):
        done = True
        print("[DONE] All series steps completed.")
        # Do NOT call stop_typer() here — if the last step was a PDF page the
        # image is still open.  process_tick() will call stop_typer() once the
        # user has acknowledged the image (waiting_for_key_release goes False).

# ---------------- CORE TICK LOGIC ---------------- #

def process_tick():
    global wait, done, running, typing_active, waiting_for_key_release
    global series_idx, step_in_series, page_no, current_page_idx

    with lock:
        if not running:
            return
        if done:
            # All steps finished — but wait until the user has released the
            # key so any final PDF image is acknowledged before we stop.
            if not waiting_for_key_release:
                stop_typer()
            return
        if wait:
            return
        if waiting_for_key_release:
            return
        if series_idx >= len(series):
            done = True
            stop_typer()
            return

        item = series[series_idx]
        
        # ============================================================
        # CASE 1: PDF PAGE STEP
        # ============================================================
        if "pdfPage" in item:
            pdf_page = item["pdfPage"]

            # Bring AutoTyper window to front
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

            if window_ref is not None:
                try:
                    window_ref.evaluate_js(f"showPDFPage({pdf_page})")
                except Exception:
                    pass

            typing_active = False
            waiting_for_key_release = True
            _advance_step()
            return

        # ============================================================
        # CASE 2: FILE STEP
        # ============================================================
        target_file = int(item["file"])
        step_list   = item["step"]

        # ── File switch (if needed) ──────────────────────────────────
        if target_file != current_page_idx:
            _switch_vscode_file(current_page_idx, target_file)
            page_no = target_file
            current_page_idx = target_file
            typing_active = False
            waiting_for_key_release = True
            return   # wait for key press before executing next step on new file

        # ── Update page_no in case it drifted ──────────────────────
        page_no = target_file

        # ── Fetch current step object ───────────────────────────────
        actual_step_idx = step_list[step_in_series]
        st = data[item["file"]][actual_step_idx]
        s  = store[page_no]   # shorthand — all per-file state

        line_no      = st["lineNo"]
        prev_line_no = s["cursor_y"]   # -1 means we haven't typed anything yet in this file


        # ── Shortcut key (lineNo == -1) ─────────────────────────────
        if line_no == -1:
            keys = [k.strip().lower() for k in st["text"].split('+')]
            pyautogui.hotkey(*keys)
            time.sleep(TYPING_DELAY)
            s["write_mode"] = False
            _advance_step()
            return

        # ── Register lineNo in this file's sorted line list ─────────
        if line_no not in s["lines"]:
            s["lines"].append(line_no)
            s["lines"].sort()

        # ── Compute navigation indices ───────────────────────────────
        s["next_line_idx"] = s["lines"].index(line_no)
        if prev_line_no in s["lines"]:
            s["nextprev_line_idx"] = s["lines"].index(prev_line_no)
        
        nxt  = s["next_line_idx"]
        prev = s["nextprev_line_idx"]



        # ============================================================
        # WRITE MODE  (plain new line  OR  edit-signal text phase)
        # ============================================================
        print(st["cp"]== -1, s["signal"])
        if st["cp"] == -1 or s["signal"]:

            if s["write_mode"]:
                # ── Actually type characters ─────────────────────────
                text = st["text"]
                if s["word"] < len(text):
                    ch = text[s["word"]]
                    
                    pyautogui.write(ch, interval=0)
                    s["cursor_x"] += 1
                    s["word"] += 1
                    time.sleep(TYPING_DELAY)
                else:
                    # Line fully written
                    s["write_mode"]  = False
                    s["signal"]      = False
                    s["word"]        = 0
                    s["move_count"]  = 0
                    s["cursor_y"]    = line_no
                    _advance_step()

            else:
                # ── Navigate to the correct line ─────────────────────
                if line_no > prev_line_no:
                   
                    vertical_dist = nxt - prev
                    
                    if s["move_count"] < vertical_dist - 1:
                        move_down()
                        s["move_count"] += 1
                    else:
                        s["move_count"] = 0
                        go_line_end()
                        pyautogui.press("enter")
                        print("enter1")
                        s["cursor_x"] = 0
                        sync()
                        s["write_mode"] = True
                        

                elif line_no < prev_line_no:
                    print(line_no,prev_line_no)
                    vertical_dist = prev - nxt
                    
                    if s["move_count"] == 0:
                        go_line_start()
                    if s["move_count"] < vertical_dist - 1:
                        move_up()
                        s["move_count"] += 1
                        return
                    else:
                        s["move_count"] = 0
                    pyautogui.press("enter")
                    print("enter2")
                    s["cursor_x"] = 0
                    sync()
                    move_up()
                    s["write_mode"] = True
                    

                else:
                    # Same line as previous — shouldn't normally happen for a new line step
                    # but handle gracefully
                    go_line_end()
                    pyautogui.press("enter")
                    print("enter3")
                    s["cursor_x"] = 0
                    sync()
                    s["write_mode"] = True

        # ============================================================
        # EDIT MODE  (cp != -1 and signal not set yet)
        # ============================================================
        else:
            if not s["write_mode"]:
                s["word"]=0


                if prev == nxt:
                    # Pure horizontal navigation
                    target_x = st["cp"] + st["del"]
                    if s["cursor_x"] < target_x:
                        move_right()
                    elif s["cursor_x"] > target_x:
                        move_left()
                    else:
                        s["move_count"] = 0
                        s["write_mode"] = True
                        sync()
                    return

                # Vertical + horizontal navigation
                vertical_moves = abs(prev - nxt)

                if prev > nxt:
                    # Move UP
                    if s["move_count"] < vertical_moves:
                        if s["move_count"] == 0:
                            go_line_start()
                        move_up()
                        s["move_count"] += 1
                        return
                elif prev < nxt:
                    # Move DOWN
                    if s["move_count"] < vertical_moves:
                        if s["move_count"] == 0:
                            go_line_start()
                        move_down()
                        s["move_count"] += 1
                        return

                # Vertical done — now move horizontally to cp + del
                horizontal_target = st["cp"] + st["del"]
                total_steps = vertical_moves + horizontal_target

                if s["move_count"] < total_steps:
                    if s["move_count"] == vertical_moves:
                        go_line_start()
                    move_right()
                    s["move_count"] += 1
                    return
                else:
                    s["move_count"] = 0
                    s["write_mode"] = True
                    sync()
            else :
                if s["word"] < st["del"]:
                    backspace()
                    s["word"] +=1
                else :
                    s["word"]=0
                    s["write_mode"]=True
                    s["signal"]=True


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
        if not waiting_for_key_release:
            typing_active = True
    elif event.event_type == 'up':
        typing_active = False
        waiting_for_key_release = False   # key released → gate open again


# ---------------- PUBLIC API ---------------- #

def start_typer(payload, window=None):
    global data, series, store, running, typing_active, window_ref
    global series_idx, step_in_series, page_no, current_page_idx
    global wait, done, waiting_for_key_release

    if running:
        print("Already running")
        return

    print("Starting typer...")
    print(payload)

    # ── Accept both new structured format and legacy flat list ───────
    if isinstance(payload, dict) and "series" in payload:
        data   = payload
        series = payload["series"]

        # Initialize per-file store for every file key
        store = {}
        for k in payload.keys():
            if isinstance(k, str) and k.isdigit():
                store[int(k)] = _make_file_state()
    else:
        # Legacy: flat list — wrap it in a single-file series structure
        data   = {"0": payload, "series": [{"file": "0", "step": list(range(len(payload)))}]}
        series = data["series"]
        store  = {0: _make_file_state()}

    # ── Reset all global pointers ─────────────────────────────────────
    series_idx            = 0
    step_in_series        = 0
    page_no               = 0
    current_page_idx      = 0
    wait                  = False
    done                  = False
    waiting_for_key_release = False
    running               = True
    typing_active         = False
    window_ref            = window

    # ── Start thread ──────────────────────────────────────────────────
    thread = threading.Thread(target=typing_loop, daemon=True)
    thread.start()

    # ── Hook keys ─────────────────────────────────────────────────────
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
    """Return True if the next step to be processed is a PDF/image step.

    Used by main.py to decide whether to minimise AutoTyper after an image
    closes (only minimise when the next task is a code-writing step).
    """
    global series_idx, step_in_series, series, running, done
    if not running or done:
        return False
    # Peek at the next item
    peek_series = series_idx
    peek_step   = step_in_series

    if peek_series >= len(series):
        return False
    item = series[peek_series]
    if "pdfPage" in item:
        return True
    if "file" in item:
        # Check if after advancing step we'd land on a PDF
        next_step = peek_step + 1
        if next_step >= len(item["step"]):
            next_series = peek_series + 1
            if next_series < len(series):
                return "pdfPage" in series[next_series]
    return False