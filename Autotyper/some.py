
import json, time, keyboard, os, sys, threading
import pyautogui

# --- Configuration ---
TYPING_DELAY = 0.08 # Delay between characters (0.08s = 80ms) - Slightly faster
LOOP_DELAY = 0.10   # Main loop delay (0.10s = 100ms) - Increased responsiveness
SYNC_DELAY = 0.05   # Delay for synchronization/waiting (50ms for reliability)

# Stability Fix: Remove PyAutoGUI pause and use 0 interval
pyautogui.PAUSE = 0

if getattr(sys, 'frozen', False):
    BASE = os.path.dirname(sys.executable)
else:
    BASE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(BASE, "code.json")

try:
    with open(FILE, "r", encoding="utf-8") as f:
        code = json.load(f)
except Exception as e:
    print(f"Error loading code.json: {e}")
    code = []

# --- Global State ---
running = True
lock = threading.Lock()

i = 0
word = 0
lines = []
next_line_idx = 0      # Renamed from 'next'
nextprev_line_idx = 0  # Renamed from 'nextprev'
write_mode = True      # Renamed from 'write'
wait = False
signal = False
move_count = 0        # Renamed from 'move'
done = False
cursor_x = 0          # Renamed from 'x'
typing_active = False

# --- Navigation Helpers (PyAutoGUI) ---

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

# --- Core Logic ---

def process_tick():
    global i, word, lines, next_line_idx, write_mode, nextprev_line_idx, wait, signal, move_count, done, cursor_x, running

    with lock:
        if done or not running:
            return
        
        if wait:
            return

        if i >= len(code):
            done = True
            running = False
            return
        
        # Calculate Previous Line Number
        if i > 0:
            prev_line_no = code[i-1]["lineNo"]
        else:
            prev_line_no = -1
        
        line = code[i] 
        line_no = line["lineNo"]

        if line_no == -1:
            keys = [k.strip().lower() for k in line["text"].split('+')]
            pyautogui.hotkey(*keys)
            time.sleep(TYPING_DELAY)
            write_mode = False
            i += 1
            word = 0
            signal = False
            return

        # Update Known Lines List
        if line_no not in lines:
            lines.append(line_no)
            lines.sort()

        # Find method to locate current and previous line indexes in the sorted list
        for j in range(len(lines)):
            if lines[j] == line_no:
                next_line_idx = j
            if lines[j] == prev_line_no:
                nextprev_line_idx = j

        # Check for Copy/Paste Logic or Signal (Backspace/Correction)
        if line["cp"] == -1 or signal:

            if write_mode:
                if word < len(line["text"]):
                    # Use PyAutoGUI to type safely with interval=0
                    pyautogui.write(line["text"][word], interval=0) 
                    cursor_x += 1
                    word += 1
                    # Increase delay here significantly to slow down typing speed
                    time.sleep(TYPING_DELAY) 
                else:
                    write_mode = False
                    i += 1
                    word = 0
                    signal = False

            else:
                # Not writing, so we are navigating to the next position
                if line["lineNo"] > prev_line_no:
                    # Moving Down (New Line logic)
                    vertical_dist = next_line_idx - nextprev_line_idx
                    
                    if move_count < vertical_dist - 1:
                        move_down()
                        move_count += 1
                    elif move_count == vertical_dist - 1:
                        move_count = 0
                        go_line_end()
                        wait = True
                        pyautogui.press("enter")
                        cursor_x = 0
                        sync()
                        wait = False
                        write_mode = True
                
                elif line["lineNo"] < prev_line_no:
                    # Moving Up (Backtracking to insert)
                    go_line_start()
                    
                    vertical_dist = nextprev_line_idx - next_line_idx
                    
                    if move_count < vertical_dist - 1:
                        move_up()
                        move_count += 1
                        return
                    else:
                        move_count = 0
                    
                    wait = True
                    pyautogui.press("enter")
                    cursor_x = 0
                    sync()
                    move_up()
                    wait = False
                    write_mode = True
                        
        else:
            # Complex Editing / Deletion / Navigation Logic
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
                # Deleting characters (Backspacing)
                if word < line["del"]:
                    backspace()
                    word += 1
                else:
                    word = 0
                    write_mode = True
                    signal = True

def exit_app(event=None):
    global running
    running = False
    print("Exiting safely...")
    time.sleep(0.1)
    sys.exit(0)

def typing_loop():
    """Background thread that continuously calls process_tick when typing is active"""
    print("Typing loop started")
    while running:
        if typing_active:
            process_tick()
            time.sleep(LOOP_DELAY)
        else:
            time.sleep(0.05) 

# Global typing active flag
def on_key_event(event):
    global typing_active
    if event.event_type == 'down':
        typing_active = True
    elif event.event_type == 'up':
        typing_active = False

# --- Entry Point ---

# Start typing thread
typing_thread = threading.Thread(target=typing_loop, daemon=True)
typing_thread.start()

# Hooks
print("Hooking keys...")
# Hook F1-F12
for key_index in range(1, 13):
    # Important: suppress=False (default) effectively
    keyboard.hook_key(f"f{key_index}", on_key_event, suppress=False)

keyboard.on_press_key("esc", exit_app, suppress=False)

print("Typer Ready. Press F1-F12 to type. Press ESC to exit.")

# Main loop replaces keyboard.wait()
while running:
    time.sleep(0.1)




    