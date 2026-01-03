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


def move_up(n):
     for _ in range(n):
         keyboard.press_and_release("up")
         time.sleep(0.05)

def move_down(n):
     for _ in range(n):
         keyboard.press_and_release("down")
         time.sleep(0.01)
  
def go_line_start():
    keyboard.press_and_release("home")
    time.sleep(0.01)

def go_line_end():
    keyboard.press_and_release("end")
    time.sleep(0.01) 



def next_char():
    global i, word, lines,next,write,nextprev

    if i >= len(code):
        return
    
    prev=code[i-1]["lineNO"]
    line = code[i]
    line_no=line["lineNO"]

    if line_no not in lines:
        lines.append(line_no)
        lines.sort()
        for j in range(len(lines)-1):
            if lines[j] == line_no:
                next=j
            if lines[j] == prev:
                nextprev=j
                
    

    if  write:
        if word < len(line["text"]):
            keyboard.write(line["text"][word]) 
            word += 1
        else:
            write=False
            i=i+1
            word=0

    else:
        if line["lineNO"] > prev:

            if next == len(lines)-1 :
                 go_line_end()
                 keyboard.press_and_release("enter")
                 write=True
            else :
                move_down(next-nextprev-1)
                go_line_end()
                keyboard.press_and_release("enter")
                write=True

        elif line["lineNO"] < prev:
            go_line_start()
            move_up(nextprev-next-1)
            keyboard.press_and_release("enter")
            move_up(1)
            write=True
    
        


def exit():
    print("exited")
    lambda: sys.exit()



# keyboard.add_hotkey("ctrl", next_char)
# keyboard.add_hotkey("Alt", next_char)
keyboard.add_hotkey("f8", next_char)
keyboard.add_hotkey("esc",exit)

keyboard.wait()
