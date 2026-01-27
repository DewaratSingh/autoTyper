import json, time, keyboard, os, sys
import pyautogui

BASE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(BASE, "code.json")

with open(FILE, "r", encoding="utf-8") as f:
    code = json.load(f)

print("Typing starts in 3 seconds...")
time.sleep(3)

i = 0
word = 0
lines = []
next=0
nextprev=0
write = True
wait=False
signal=False
move=0
done=False



def move_up():
    global wait
    wait=True
    pyautogui.press("up")
    time.sleep(0.03)
    wait=False

def move_down():
    global wait
    wait=True
    pyautogui.press("down")
    time.sleep(0.03)
    wait=False

def go_line_start():
    global wait 
    wait=True
    pyautogui.press("home")
    time.sleep(0.03)
    wait=False

def go_line_end():
    global wait
    wait=True
    pyautogui.press("end")
    time.sleep(0.03)
    wait=False

def move_right():
    global wait
    wait=True
    pyautogui.press("right")
    time.sleep(0.03)
    wait=False

def backspace():
    global wait
    wait=True
    pyautogui.press("backspace")
    time.sleep(0.03)
    wait=False

def sync():
    global wait
    wait=True
    time.sleep(0.06)
    wait=False



def debug_state(msg):
    print(f"DEBUG: {msg}")

def next_char():
    global i, word, lines,next,write,nextprev,wait ,signal,move,done
    debug_state("BEFORE state change")

    if done:
        return
    
    if wait:
        return

    if i >= len(code):
        print("All code typed!")
        done = True
        return
    
    if i > 0:
        prev = code[i-1]["lineNo"]
    else:
        prev = -1
    
    line = code[i]
    line_no=line["lineNo"]

    if line_no not in lines:
            lines.append(line_no)
            lines.sort()
            for j in range(len(lines)):
                if lines[j] == line_no:
                    next=j
                if lines[j] == prev:
                    nextprev=j
    else:
        for j in range(len(lines)):
                if lines[j] == line_no:
                    next=j
                if lines[j] == prev:
                    nextprev=j


    if line["cp"] == -1 or signal:

        if  write:
            if word < len(line["text"]):
                keyboard.write(line["text"][word]) 
                sync()
                word += 1
            else:
                write=False
                i=i+1
                word=0
                signal=False

        else:
            if line["lineNo"] > prev:
                print("next line")
                print(next,len(lines)-1)
                if next == len(lines) -1:
                     print("last line")
                     go_line_end()
                     wait=True
                     keyboard.press_and_release("enter")
                     sync()
                     wait=False
                     write=True
                else :
                    if move < next-nextprev-1:
                        move_down()
                        move+=1
                    elif move == next-nextprev-1:
                        move=0
                        go_line_end()
                        wait=True
                        keyboard.press_and_release("enter")
                        sync()
                        wait=False
                        write=True

            elif line["lineNo"] < prev:
                go_line_start()
                print(nextprev-next-1)
                if move < nextprev-next-1:
                    move_up()
                    move+=1
                    return
                else:
                    move=0
                wait=True
                keyboard.press_and_release("enter")
                sync()
                move_up()
                wait=False
                write=True
                    
                    
    else:
        if not write:
            word=0
            
            if nextprev > next:
                if move < nextprev - next:
                    if move == 0:
                        go_line_start()
                    move_up()
                    move+=1
                    return
            elif nextprev < next:
                if move < next - nextprev:
                    if move == 0:
                        go_line_start()
                    move_down()
                    move+=1
                    return
            
            vertical_moves = abs(nextprev - next)
            if move < vertical_moves + line["del"] + line["cp"]:
                if move == vertical_moves:
                    go_line_start()
                move_right()
                move+=1
                return
            else:
                move=0
                write = True
                sync()

        else:
            if word <line["del"]:
                print("backspace")
                backspace()
                word+=1
            else:
                word=0
                write=True
                signal=True
                
    debug_state("AFTER state change")

    
        


def exit():
    print("exited")
    sys.exit()




def on_key_event(event):
    if time.time() - event.time > 0.15:
        return
    next_char()

for key_index in range(1, 13):
    keyboard.on_press_key(f"f{key_index}", on_key_event, suppress=True)

keyboard.add_hotkey("esc", exit, suppress=True)

keyboard.wait()