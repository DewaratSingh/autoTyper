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
let insertState = null;

function normalizeLineNumbers() {
  code.forEach((line, index) => {
    line.lineNo = index;
  });
}

function prepareInsert(index, direction) {
  insertState = { index, direction };
  input.value = "";
  inputdiv.style.display = "block";
  input.focus();
}

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
    // Reconstruct code array from select data
    let maxLine = -1;
    select.forEach(s => {
      if (s.lineNo > maxLine) maxLine = s.lineNo;
    });

    code = [];
    for (let i = 0; i <= maxLine; i++) {
      code.push({ lineNo: i, sel: "→", text: "", edit: [] });
    }

    select.forEach(s => {
      if (!code[s.lineNo]) return;

      if (s.cp === -1) {
        code[s.lineNo].text = s.text;
        code[s.lineNo].sel = s.sel;
      } else {
        code[s.lineNo].edit.push({
          sel: s.sel,
          text: s.wholeText,
          startPos: s.cp,
          editedLength: s.del,
          editedText: s.text
        });
      }
    });

    alert("Project loaded");
    render()
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
  code = []

  for (let i = 0; i < lines.length; i++) {
    code.push({ lineNo: i, sel: "→", text: lines[i], edit: [] });
  }
  render();
}

function render() {
  editor.innerHTML = "";

  code.forEach((lineObj, i) => {
    let xOffset = 0;
    const y = i * lineHeight;

    const markContainer = document.createElement("div");
    markContainer.style.position = "absolute";
    markContainer.style.top = `${y}px`;
    markContainer.style.left = `0px`;
    markContainer.style.width = "19px";
    markContainer.style.height = "19px";
    markContainer.style.zIndex = "5";

    const leftMark = document.createElement("div");
    leftMark.className = "mark";
    leftMark.style.position = "absolute";
    leftMark.style.top = "0px";
    leftMark.style.left = "0px";
    leftMark.style.zIndex = "100";
    leftMark.textContent = "→";
    leftMark.style.backgroundColor = "yellow";
    leftMark.innerHTML = code[i].sel;
    leftMark.onclick = () => addline(i, -1, false, leftMark);

    const btnUp = document.createElement("div");
    btnUp.textContent = "+";
    btnUp.style.position = "absolute";
    btnUp.style.top = "-9px";
    btnUp.style.left = "0px";
    btnUp.style.width = "10px";
    btnUp.style.height = "10px";
    btnUp.style.zIndex = "99999";
    btnUp.style.marginLeft = "15px";
    btnUp.style.marginTop = "5px";
    btnUp.style.backgroundColor = "lightgreen";
    btnUp.style.display = "none";
    btnUp.style.cursor = "pointer";
    btnUp.style.justifyContent = "center";
    btnUp.style.alignItems = "center";
    btnUp.style.display = "none";
    btnUp.style.border = "1px solid black";
    btnUp.onclick = (e) => { e.stopPropagation(); prepareInsert(i, 'up'); };

    const btnDown = document.createElement("div");
    btnDown.textContent = "+";
    btnDown.style.position = "absolute";
    btnDown.style.top = "15px";
    btnDown.style.left = "0px";
    btnDown.style.width = "10px";
    btnDown.style.height = "10px";
    btnDown.style.zIndex = "99999";
    btnDown.style.marginLeft = "15px";
    btnDown.style.marginTop = "-5px";
    btnDown.style.backgroundColor = "lightgreen";
    btnDown.style.display = "none";
    btnDown.style.cursor = "pointer";
    btnDown.style.justifyContent = "center";
    btnDown.style.alignItems = "center";
    btnDown.style.display = "none";
    btnDown.style.border = "1px solid black";
    btnDown.onclick = (e) => { e.stopPropagation(); prepareInsert(i, 'down'); };


    const showBtns = () => {
      btnUp.style.display = "flex";
      btnDown.style.display = "flex";
    };
    const hideBtns = () => {
      btnUp.style.display = "none";
      btnDown.style.display = "none";
    };

    markContainer.onmouseenter = showBtns;
    markContainer.onmouseleave = hideBtns;

    markContainer.appendChild(leftMark);
    markContainer.appendChild(btnUp);
    markContainer.appendChild(btnDown);
    editor.appendChild(markContainer);

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
      leftMark.style.zIndex = "100";
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
    input.focus();
    if (code[i].edit.length === 0) {
      input.value = code[i].text;
    } else {
      input.value = code[i].edit[code[i].edit.length - 1].text;
    }
    selectedline = i;
  } else {
    // Check if ALREADY selected
    let currentSel;
    if (j == -1) {
      currentSel = code[i].sel;
    } else {
      currentSel = code[i].edit[j].sel;
    }

    if (currentSel !== "→") {
      // DESELECT LOGIC
      const selVal = currentSel;

      // Remove from select array
      select = select.filter(s => s.sel !== selVal);

      // Shift remaining numbers
      select.forEach(s => {
        if (s.sel > selVal) s.sel--;
      });

      // Sync visuals
      syncSelectionVisuals();
      return;
    }

    // SELECT LOGIC (Validation)
    if (j != -1) {
      if (code[i].sel == "→") {
        // If parent line is not selected, strict check? 
        // Existing logic allowed edit selection if code[i].sel is not arrow?
        // Original: if (code[i].sel == "→") alert...
        // If we want to allow selecting edit only if line is selected:
        alert("This line is not Printed yet")
        return
      }
    }

    // ADD TO SELECTION
    if (j == -1) {
      code[i].sel = select.length + 1;
      adder.innerHTML = select.length + 1;
    } else {
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

function syncSelectionVisuals() {
  // Reset all to arrow
  code.forEach(line => {
    line.sel = "→";
    line.edit.forEach(e => e.sel = "→");
  });

  // Apply from select
  select.forEach(s => {
    if (!code[s.lineNo]) return;
    if (s.cp === -1) {
      code[s.lineNo].sel = s.sel;
    } else {
      const edit = code[s.lineNo].edit.find(e =>
        e.startPos === s.cp &&
        e.editedLength === s.del &&
        e.text === s.wholeText
      );
      if (edit) edit.sel = s.sel;
    }
  });
  render();
}

function confermedit() {
  if (insertState) {
    const newLine = {
      lineNo: -1,
      sel: "→",
      text: input.value,
      edit: []
    };
    if (insertState.direction === 'up') {
      select.forEach(item => {
        if (item.lineNo >= insertState.index) {
          item.lineNo++;
        }
      });
      code.splice(insertState.index, 0, newLine);
    } else {
      select.forEach(item => {
        if (item.lineNo >= insertState.index + 1) {
          item.lineNo++;
        }
      });
      code.splice(insertState.index + 1, 0, newLine);
    }
    normalizeLineNumbers();
    insertState = null;
    inputdiv.style.display = "none";
    render();
    return;
  }

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
    sel: "→"
  });
  inputdiv.style.display = "none";
  render();
}

function cancleinput() {
  inputdiv.style.display = "none";
  insertState = null;
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
