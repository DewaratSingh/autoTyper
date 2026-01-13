const { ipcRenderer } = require("electron");

const editor = document.getElementById("editor");
const input = document.getElementById("input");
let inputdiv = document.getElementById("inputdiv");

let code = [];
let select = [];
const lineHeight = 20;
const charWidth = 8;
const gutterWidth = 20;
let selectedline = null;
let currentFile = null;

function newProject() {
  document.getElementById("code").value = "";
  document.getElementById("editor").innerHTML = "";
  inputdiv.style.display = "none";
  select = [];
  currentFile = null;
}

function loadProject() {
  ipcRenderer.invoke("load-file").then((data) => {
    if (!data) return;
    currentFile = data.path;
    select = data.content;
    // for (let i = 0; i < select.length; i++) {
    //   if(select[i].cp==-1){
    //     code.push({ lineNo: select[i].lineNo ,sel:select[i].sel, text: select[i].text, edit: [] })
    //   }else{

    //   }
    // }
    alert("Project loaded");
    //render()
  });
}

function saveProject() {
  ipcRenderer.invoke("save-file", select).then((path) => {
    if (path) {
      currentFile = path;
      alert("Saved successfully");
    }
  });
}

function nextt() {
  const text = document.getElementById("code").value;
  const lines = text.split("\n");
  code=[]

  for (let i = 0; i < lines.length; i++) {
    code.push({ lineNo: i,sel:"→", text: lines[i], edit: [] });
  }
  render();
}

function render() {
  editor.innerHTML = "";

  code.forEach((lineObj, i) => {
    let xOffset = 0;
    const y = i * lineHeight;

    const leftMark = document.createElement("div");
    leftMark.className = "mark";
    leftMark.textContent = "→";
    leftMark.style.backgroundColor = "yellow";
    leftMark.style.top = `${y}px`;
    leftMark.style.left = `0px`;
    leftMark.innerHTML = code[i].sel;
    leftMark.onclick = () => addline(i, -1, false, leftMark);
    editor.appendChild(leftMark);

    xOffset += gutterWidth;

    [...lineObj.text].forEach((ch, charIndex) => {
      const char = document.createElement("div");
      char.className = "char";
      char.textContent = ch;
      char.style.left = `${xOffset}px`;
      char.style.top = `${y}px`;
      editor.appendChild(char);
      xOffset += charWidth;
    });

    xOffset += gutterWidth;

    lineObj.edit.forEach((edit, editIndex) => {
      const leftMark = document.createElement("div");
      leftMark.className = "mark";
      leftMark.textContent = "→";
      leftMark.style.backgroundColor = "yellow";
      leftMark.style.top = `${y}px`;
      leftMark.style.left = `${xOffset}px`;
      leftMark.innerHTML = code[i].edit[editIndex].sel;
      leftMark.onclick = () => addline(i, editIndex, false, leftMark);
      editor.appendChild(leftMark);

      xOffset += gutterWidth;

      [...edit.text].forEach((ch, charIndex) => {
        const char = document.createElement("div");
        char.className = "char";
        char.textContent = ch;
        char.style.left = `${xOffset}px`;
        char.style.top = `${y}px`;
        editor.appendChild(char);
        xOffset += charWidth;
      });
    });

    const rightMark = document.createElement("div");
    rightMark.className = "mark";
    rightMark.textContent = "+";
    rightMark.style.top = `${y}px`;
    rightMark.style.left = `${xOffset + 10}px`;
    rightMark.onclick = () => addline(i, 0, true);
    editor.appendChild(rightMark);
  });

  editor.style.height = `${code.length * lineHeight + 20}px`;
}

function addline(i, j, isreal, adder) {
  if (isreal) {
    inputdiv.style.display = "block";
    if (code[i].edit.length === 0) {
      input.value = code[i].text;
    } else {
      input.value = code[i].edit[code[i].edit.length - 1].text;
    }
    selectedline = i;
  } else {
    
    if (j == -1) {
      code[i].sel = select.length + 1;
      adder.innerHTML = select.length + 1;
    } else {
      if(code[i].sel=="→"){
        alert("This line is not Printed yet")
        return
      }
      adder.innerHTML = select.length + 1;
      code[i].edit[j].sel = select.length + 1;
    }

    if (j == -1) {
      select.push({
        lineNo: i,
        sel: select.length + 1,
        cp: -1,
        del: -1,
        text: code[i].text,
      });
    } else {
      select.push({
        lineNo: i,
        sel: select.length + 1,
        cp: code[i].edit[j].startPos,
        del: code[i].edit[j].editedLength,
        text: code[i].edit[j].editedText,
        wholeText: code[i].edit[j].text,
      });
    }
  }
}

function confermedit() {
  const line = code[selectedline];

  const oldText =
    line.edit.length === 0 ? line.text : line.edit[line.edit.length - 1].text;

  const newText = input.value;

  if (oldText === newText) {
    alert("There is no edit.");
    return;
  }
  let startPos = 0;
  const minLen = Math.min(oldText.length, newText.length);

  while (startPos < minLen && oldText[startPos] === newText[startPos]) {
    startPos++;
  }

  let oldEnd = oldText.length - 1;
  let newEnd = newText.length - 1;

  while (
    oldEnd >= startPos &&
    newEnd >= startPos &&
    oldText[oldEnd] === newText[newEnd]
  ) {
    oldEnd--;
    newEnd--;
  }

  const editedText = newText.slice(startPos, newEnd + 1);
  const editedLength = oldEnd - startPos + 1;

  line.edit.push({
    text: newText,
    startPos,
    editedText,
    editedLength,
    sel:"→"
  });
  inputdiv.style.display = "none";
  render();
}

function cancleinput() {
  inputdiv.style.display = "none";
}

function start() {
  if (!select.length) {
    alert("No lines selected");
    return;
  }
  alert("started. Press F8 for typing");
  ipcRenderer.send("stop-typing");
  ipcRenderer.send("start-typing", currentFile, select);
}

function stop() {
  ipcRenderer.send("stop-typing");
  alert("stoped");
}
