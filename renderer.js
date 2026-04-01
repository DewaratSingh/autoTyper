

const editor = document.getElementById("editor");
const input = document.getElementById("input");
let inputdiv = document.getElementById("inputdiv");
let backdrop = document.getElementById("backdrop");
let editLabelText = document.getElementById("editLabelText");
let originalInput = document.getElementById("originalInput");
let originalContainer = document.getElementById("originalContainer");

let code = [];
let select = [];
const lineHeight = 20;
const charWidth = 8;
const gutterWidth = 20;
let selectedline = null;
let selectedEditIndex = null;
let currentFile = null;
let insertState = null;

document.addEventListener('DOMContentLoaded', () => {
  backdrop = document.getElementById('backdrop');
  editLabelText = document.getElementById('editLabelText');
  originalInput = document.getElementById('originalInput');
  originalContainer = document.getElementById('originalContainer');

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confermedit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancleinput();
      }
    });
  }

  // Close modal when clicking backdrop
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      cancleinput();
    });
  }

  // // Auto-start typing to preload Python packages
  // setTimeout(() => {
  //   // Ensure empty text fields have a space
  //   for (let i = 0; i < select.length; i++) {
  //     if (select[i].text === "") {
  //       select[i].text = " ";
  //     }
  //   }
  //   // Start typing process to load Python packages
  //   ipcRenderer.send("stop-typing");
  //   ipcRenderer.send("start-typing", currentFile, select);
  //   alert("ok")
  //   setTimeout(() => {
  //     alert("ok2")
  //   }, 10000);
  // }, 2000);

});

function normalizeLineNumbers() {
  code.forEach((line, index) => {
    line.lineNo = index;
  });
}

function prepareInsert(index, direction) {
  insertState = { index, direction };
  input.value = "";
  originalInput.value = "";
  if (originalContainer) {
    originalContainer.style.display = 'none';
  }
  if (editLabelText) {
    editLabelText.textContent = direction === 'up' ? 'Insert line above' : 'Insert line below';
  }
  let typeGroup = document.getElementById('insertTypeGroup');
  if (typeGroup) typeGroup.style.display = 'flex';

  inputdiv.style.display = "block";
  backdrop.classList.add("active");
  setTimeout(() => {
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, 50);
}

function newProject() {
  document.getElementById("code").value = "";
  document.getElementById("editor").innerHTML = "";
  inputdiv.style.display = "none";
  backdrop.classList.remove("active");
  select = [];
  currentFile = null;
}

function loadProject() {
  window.pywebview.api.load_file().then((data) => {
    if (!data) return;

    // Check file extension
    const filePath = data.path;
    const fileExtension = filePath.toLowerCase().split('.').pop();

    if (fileExtension === 'pds') {
      if (Array.isArray(data.content)) {
        // Load as legacy project file
        currentFile = data.path;
        select = data.content;
        // Reconstruct code array from select data
        let maxLine = -1;
        select.forEach(s => {
          if (s.lineNo > maxLine) maxLine = s.lineNo;
        });

        code = [];
        for (let i = 0; i <= maxLine; i++) {
          code.push({ lineNo: i, sel: ">", text: "", edit: [], isButton: false });
        }

        select.forEach(s => {
          if (!code[s.lineNo]) return;

          // Preserve isButton properly onto code items so they render natively.
          code[s.lineNo].isButton = s.button || false;

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
      } else if (data.content.version === 2) {
        // Load as modern project file
        currentFile = data.path;
        code = data.content.code;
        select = data.content.select;
      }

      alert("Project loaded");
      render();
    } else {
      // Load as text file - put content in textarea
      const fileContent = data.content;
      const codeTextarea = document.getElementById('code');
      if (codeTextarea) {
        codeTextarea.value = fileContent;
        alert(`File loaded successfully!`);
      }
    }
  });
}

function saveProject() {
  const dataToSave = {
    version: 2,
    code: code,
    select: select
  };
  window.pywebview.api.save_file(dataToSave).then((path) => {
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
    code.push({ lineNo: i, sel: ">", text: lines[i] == "" ? " " : lines[i], edit: [], isButton: false });
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
    leftMark.textContent = ">";
    leftMark.style.backgroundColor = "yellow";
    leftMark.innerHTML = code[i].sel;
    leftMark.onclick = () => addline(i, -1, false, leftMark);
    leftMark.oncontextmenu = (e) => {
      e.preventDefault();
      handleRightClick(i, -1);
    };

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
      if (lineObj.isButton) {
        char.style.color = "#d63384";
        char.style.fontWeight = "bold";
      }
      char.style.left = `${xOffset}px`;
      char.style.top = `${y}px`;
      editor.appendChild(char);
      xOffset += charWidth;
    });

    xOffset += gutterWidth;

    lineObj.edit.forEach((edit, editIndex) => {
      const leftMark = document.createElement("div");
      leftMark.className = "mark";
      leftMark.textContent = ">";
      leftMark.style.backgroundColor = "yellow";
      leftMark.style.zIndex = "100";
      leftMark.style.top = `${y}px`;
      leftMark.style.left = `${xOffset}px`;
      leftMark.innerHTML = code[i].edit[editIndex].sel;
      leftMark.onclick = () => addline(i, editIndex, false, leftMark);
      leftMark.oncontextmenu = (e) => {
        e.preventDefault();
        handleRightClick(i, editIndex);
      };
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
    let typeGroup = document.getElementById('insertTypeGroup');
    if (typeGroup) typeGroup.style.display = 'none';

    backdrop.classList.add("active");

    selectedline = i;

    // Use selectedEditIndex context based on line state for the end-of-line plus button
    selectedEditIndex = code[i].edit.length === 0 ? -1 : code[i].edit.length - 1;

    if (originalContainer) {
      originalContainer.style.display = 'flex';
    }

    if (selectedEditIndex === -1) {
      originalInput.value = code[i].text;
      input.value = code[i].text;
      if (editLabelText) {
        editLabelText.textContent = `Original Line:`;
      }
    } else {
      originalInput.value = code[i].edit[selectedEditIndex].text;
      input.value = code[i].edit[selectedEditIndex].text;
      if (editLabelText) {
        editLabelText.textContent = `Editing:`;
      }
    }

    setTimeout(() => {
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }, 50);
  } else {
    // Check if ALREADY selected
    let currentSel;
    if (j == -1) {
      currentSel = code[i].sel;
    } else {
      currentSel = code[i].edit[j].sel;
    }

    if (currentSel !== ">") {
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
      if (code[i].sel == ">") {
        // If parent line is not selected, strict check? 
        // Existing logic allowed edit selection if code[i].sel is not arrow?
        // Original: if (code[i].sel == ">") alert...
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
      const elCopy = {
        lineNo: i,
        sel: select.length + 1,
        cp: -1,
        del: -1,
        text: code[i].text,
      };
      select.push(elCopy);
    } else {
      const elCopy = {
        lineNo: i,
        sel: select.length + 1,
        cp: code[i].edit[j].startPos,
        del: code[i].edit[j].editedLength,
        text: code[i].edit[j].editedText,
        wholeText: code[i].edit[j].text,
      };
      select.push(elCopy);
    }
  }
}

function handleRightClick(lineIndex, editIndex) {
  // If editIndex is -1, it's the line button (left mark)
  if (editIndex === -1) {
    const lineSel = code[lineIndex].sel;

    if (lineSel === ">") {
      // Delete the entire line
      // Remove from select array any selections on this line
      const removedSels = [];
      select = select.filter(s => {
        if (s.lineNo === lineIndex) {
          removedSels.push(s.sel);
          return false;
        }
        return true;
      });

      // Remove the line from code array
      code.splice(lineIndex, 1);

      // Update lineNo for all lines after the deleted line
      select.forEach(s => {
        if (s.lineNo > lineIndex) {
          s.lineNo--;
        }
      });

      // Renumber selections
      if (removedSels.length > 0) {
        const minRemoved = Math.min(...removedSels);
        select.forEach(s => {
          if (s.sel > minRemoved) {
            s.sel -= removedSels.length;
          }
        });
      }

      normalizeLineNumbers();
      syncSelectionVisuals();
    } else {
      // It's a numbered button - remove just this number and delete the line
      const selValue = lineSel;

      // Remove only this specific selection from select array
      select = select.filter(s => s.sel !== selValue);

      // Shift remaining numbers down
      select.forEach(s => {
        if (s.sel > selValue) {
          s.sel--;
        }
      });

      // Remove from select array any selections on this line
      const removedSels = [];
      select = select.filter(s => {
        if (s.lineNo === lineIndex) {
          removedSels.push(s.sel);
          return false;
        }
        return true;
      });

      // Remove the line from code array
      code.splice(lineIndex, 1);

      // Update lineNo for all lines after the deleted line
      select.forEach(s => {
        if (s.lineNo > lineIndex) {
          s.lineNo--;
        }
      });

      // Renumber selections if more were removed
      if (removedSels.length > 0) {
        const minRemoved = Math.min(...removedSels);
        select.forEach(s => {
          if (s.sel > minRemoved) {
            s.sel -= removedSels.length;
          }
        });
      }

      normalizeLineNumbers();
      syncSelectionVisuals();
    }
  } else {
    // It's an edit button
    const editSel = code[lineIndex].edit[editIndex].sel;

    if (editSel === ">") {
      // Delete this specific edit
      code[lineIndex].edit.splice(editIndex, 1);
      render();
    } else {
      // If there's a number, remove it and delete the edit
      const selValue = editSel;

      // Remove only this specific selection from select array
      select = select.filter(s => s.sel !== selValue);

      // Shift remaining numbers down
      select.forEach(s => {
        if (s.sel > selValue) {
          s.sel--;
        }
      });

      // Delete this specific edit
      code[lineIndex].edit.splice(editIndex, 1);

      // Sync visuals
      syncSelectionVisuals();
    }
  }
}

function syncSelectionVisuals() {
  // Reset all to arrow
  code.forEach(line => {
    line.sel = ">";
    line.edit.forEach(e => e.sel = ">");
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
  let typeGroup = document.getElementById('insertTypeGroup');
  if (typeGroup) typeGroup.style.display = 'none';

  if (insertState) {
    let type = 'text';
    const checkedRadio = document.querySelector('input[name="lineType"]:checked');
    if (checkedRadio) type = checkedRadio.value;

    const newLine = {
      lineNo: -1,
      sel: ">",
      text: input.value,
      edit: [],
      isButton: (type === 'shortcut')
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
    backdrop.classList.remove("active");
    render();
    return;
  }

  const line = code[selectedline];

  if (selectedEditIndex === -1) {
    if (line.text !== originalInput.value) {
      line.text = originalInput.value;
      const s = select.find(x => x.lineNo === selectedline && x.cp === -1);
      if (s) s.text = originalInput.value;
    }
  } else {
    const editObj = line.edit[selectedEditIndex];
    if (editObj.text !== originalInput.value) {
      const oldWholeText = editObj.text;
      const oldCp = editObj.startPos;

      const thisBaseText = selectedEditIndex === 0 ? line.text : line.edit[selectedEditIndex - 1].text;
      const newNewText = originalInput.value;

      let sPos = 0;
      const mLen = Math.min(thisBaseText.length, newNewText.length);
      while (sPos < mLen && thisBaseText[sPos] === newNewText[sPos]) { sPos++; }

      let oEnd = thisBaseText.length - 1;
      let nEnd = newNewText.length - 1;
      while (oEnd >= sPos && nEnd >= sPos && thisBaseText[oEnd] === newNewText[nEnd]) { oEnd--; nEnd--; }

      editObj.text = originalInput.value;
      editObj.startPos = sPos;
      editObj.editedLength = oEnd - sPos + 1;
      editObj.editedText = newNewText.slice(sPos, nEnd + 1);

      const s = select.find(x => x.lineNo === selectedline && x.wholeText === oldWholeText && x.cp === oldCp);
      if (s) {
        s.text = editObj.editedText;
        s.wholeText = editObj.text;
        s.cp = editObj.startPos;
        s.del = editObj.editedLength;
      }
    }
  }

  let baseText;

  if (selectedEditIndex === -1) {
    baseText = code[selectedline].text;
  } else {
    baseText = code[selectedline].edit[selectedEditIndex].text;
  }

  const oldText = baseText;
  const newText = input.value;

  if (oldText === newText) {
    inputdiv.style.display = "none";
    backdrop.classList.remove("active");
    selectedEditIndex = null;
    render();
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
    sel: ">"
  });
  inputdiv.style.display = "none";
  backdrop.classList.remove("active");
  selectedEditIndex = null;
  render();
}

function cancleinput() {
  inputdiv.style.display = "none";
  let typeGroup = document.getElementById('insertTypeGroup');
  if (typeGroup) typeGroup.style.display = 'none';
  backdrop.classList.remove("active");
  insertState = null;
  selectedEditIndex = null;
}

function start() {
  if (!select.length) {
    alert("No lines selected");
    return;
  }

  const payload = [];
  for (let i = 0; i < select.length; i++) {
    let textToUse = select[i].text;
    if (textToUse === "" && (select[i].del == 0 || select[i].del == -1)) {
      textToUse = " ";
    }
    const isBtn = code[select[i].lineNo] && code[select[i].lineNo].isButton;
    payload.push({
      lineNo: isBtn ? -1 : select[i].lineNo,
      sel: select[i].sel,
      cp: select[i].cp,
      del: select[i].del,
      text: textToUse
    });
  }

  // Execute the actual start logic
  window.pywebview.api.stop_typing();
  window.pywebview.api.start_typing(currentFile, payload);
  alert("starting in 5 seconds. Press F8 for typing");

}

function stop() {
  window.pywebview.api.stop_typing();
  alert("stoped");
}

// Drag-and-drop functionality
const codeTextarea = document.getElementById('code');
const codeContainer = document.getElementById('codeContainer');
const fileInputHidden = document.getElementById('fileInputHidden');

// Handle file input change for hidden input
if (fileInputHidden) {
  fileInputHidden.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      readFileContent(file);
    }
  });
}


if (codeContainer) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    codeContainer.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    // Don't prevent defaults if user is interacting with input/textarea
    const target = e.target;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop area when file is dragged over
  ['dragenter', 'dragover'].forEach(eventName => {
    codeContainer.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    codeContainer.addEventListener(eventName, unhighlight, false);
  });

  function highlight(e) {
    codeContainer.classList.add('drag-over');
  }

  function unhighlight(e) {
    codeContainer.classList.remove('drag-over');
  }

  // Handle dropped files
  codeContainer.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      readFileContent(files[0]);
    }
  }
}


function readFileContent(file) {

  const textExtensions = ['.c', '.py', '.js', '.java', '.html', '.css', '.txt',
    '.cpp', '.h', '.cs', '.php', '.rb', '.go', '.rs',
    '.kt', '.swift', '.ts', '.jsx', '.tsx', '.json',
    '.xml', '.md', '.sh', '.bat', '.sql', '.r', '.scala',
    '.m', '.mm', '.v', '.vh', '.sv', '.svh'];

  const fileName = file.name.toLowerCase();
  const isTextFile = textExtensions.some(ext => fileName.endsWith(ext));

  if (!isTextFile) {
    alert('Please select a text-based file (.c, .py, .js, .java, etc.)');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const text = e.target.result;

      // Check if content is actually text (not binary)
      // Simple check: if there are too many non-printable characters, it's likely binary
      const nonPrintableCount = (text.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length;
      const nonPrintableRatio = nonPrintableCount / text.length;

      if (nonPrintableRatio > 0.3) {
        alert('This file appears to be binary. Please select a text file.');
        return;
      }

      // Display content in textarea
      codeTextarea.value = text;
      alert(`File "${file.name}" loaded successfully!`);
    } catch (error) {
      alert('Error reading file: ' + error.message);
    }
  };

  reader.onerror = function () {
    alert('Error reading file. Please try again.');
  };

  // Read file as text
  reader.readAsText(file);
}
