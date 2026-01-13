import json, time, keyboard, os, sys

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


def move_up(n):
     global wait
     wait=True
     for _ in range(n):
         keyboard.press_and_release("up")
         time.sleep(0.03)
     wait=False

def move_down(n):
     global wait
     wait=True
     for _ in range(n):
         keyboard.press_and_release("down")
         time.sleep(0.03)
     wait=False
  
def go_line_start():
    global wait
    wait=True
    keyboard.press_and_release("home")
    time.sleep(0.03)
    wait=False

def go_line_end():
    global wait
    wait=True
    keyboard.press_and_release("end")
    time.sleep(0.03) 
    wait=False

def move_right(n):
    global wait
    wait = True
    for _ in range(n):
        keyboard.press_and_release("right")
        time.sleep(0.03)
    wait = False

def backspace(n):
    global wait
    wait = True
    for _ in range(n):
        keyboard.press_and_release("backspace")
        time.sleep(0.03)
    wait = False

def sync():
    wait=True
    time.sleep(0.06)
    wait=False



def next_char():
    global i, word, lines,next,write,nextprev,wait ,signal

    if wait :
        return

    if i >= len(code):
        sys.exit()
        return
    if i>0:
        prev=code[i-1]["lineNo"]
    line = code[i]
    line_no=line["lineNo"]

    if line_no not in lines:
            lines.append(line_no)
            lines.sort()
            for j in range(len(lines)-1):
                if lines[j] == line_no:
                    next=j
                if lines[j] == prev:
                    nextprev=j
    else:
        for j in range(len(lines)-1):
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

                if next == len(lines)-1 :
                     go_line_end()
                     wait=True
                     keyboard.press_and_release("enter")
                     sync()
                     wait=False
                     write=True
                else :
                    move_down(next-nextprev-1)
                    go_line_end()
                    wait=True
                    keyboard.press_and_release("enter")
                    sync()
                    wait=False
                    write=True

            elif line["lineNo"] < prev:
                go_line_start()
                move_up(nextprev-next-1)
                wait=True
                keyboard.press_and_release("enter")
                sync()
                wait=False
                move_up(1)
                write=True
    else:
        if not write:
            go_line_start()
            if nextprev > next:
                
                move_up(nextprev - next)
            else:
                move_down(next - nextprev)

            sync()

            
            sync()

            move_right(line["del"] + line["cp"])
            # if i == len(code)-1:
            #     move_right(1)
            sync()
            write = True

        else:
            if word <line["del"]:
                backspace(1)
                word+=1
            else:
                word=0
                write=True
                signal=True
                
        
    
        


def exit():
    print("exited")
    sys.exit()



# keyboard.add_hotkey("ctrl", next_char)
# keyboard.add_hotkey("Alt", next_char)
keyboard.add_hotkey("f8", next_char)
keyboard.add_hotkey("esc",exit)

keyboard.wait()
