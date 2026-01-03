const { ipcRenderer } = require("electron");

let lines = [];
let selected = [];
let currentFile = null;

/* NEW PROJECT */
function newProject() {
  document.getElementById("code").value = "";
  document.getElementById("editor").innerHTML = "";
  selected = [];
  currentFile = null;
}

/* LOAD PROJECT */
function loadProject() {
  ipcRenderer.invoke("load-file").then(data => {
    if (!data) return;
    currentFile = data.path;
    selected = data.content;
    alert("Project loaded");
  });
}

/* SAVE PROJECT */
function saveProject() {
  ipcRenderer.invoke("save-file", selected).then(path => {
    if (path) {
      currentFile = path;
      alert("Saved successfully");
    }
  });
}

/* BUILD LINE EDITOR */
function next() {
  const text = document.getElementById("code").value;
  lines = text.split("\n");
  selected = [];

  const editor = document.getElementById("editor");
  editor.innerHTML = "";

  lines.forEach((line, i) => {
    const row = document.createElement("div");
    row.className = "line";

    const mark = document.createElement("div");
    mark.onclick = () => toggleLine(i, mark);

    const input = document.createElement("input");
    input.value = line;

    row.appendChild(mark);
    row.appendChild(input);
    editor.appendChild(row);
  });
}

/* SELECT LINE ORDER */
function toggleLine(i, el) {
  const idx = selected.findIndex(x => x.lineNO === i + 1);
  if (idx === -1) {
    selected.push({ lineNO: i + 1, text: lines[i] });
    el.textContent = selected.length;
    el.style.background = "yellow";
  } else {
    selected.splice(idx, 1);
    el.textContent = "";
    el.style.background = "transparent";
  }
}

/* START */
function start() {
  if (!selected.length) {
    alert("No lines selected");
    return;
  }
  alert("started. Press F8 for typing")
  ipcRenderer.send("stop-typing");
  ipcRenderer.send("start-typing", currentFile, selected);
}

/* STOP */
function stop() {
  ipcRenderer.send("stop-typing");
  alert("stoped")
}
