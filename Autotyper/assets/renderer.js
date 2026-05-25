const editor = document.getElementById("editor");
const input = document.getElementById("input");
let inputdiv = document.getElementById("inputdiv");
let backdrop = document.getElementById("backdrop");
let editLabelText = document.getElementById("editLabelText");
let originalInput = document.getElementById("originalInput");
let originalContainer = document.getElementById("originalContainer");

// ─── MULTI-PAGE STATE ──────────────────────────────────────────────────────── //
let pages = [];          // [{ id, name, code:[] }]  — NO per-page select
let activePageIdx = 0;   // which page is shown in the editor
let _pcmTargetIdx = -1;  // which page the context menu is acting on

// ONE global sequence — steps from ANY page, tagged with pageIdx
let select = [];

// code[] always points to the active page's lines
let code = [];

function getActivePage() { return pages[activePageIdx] || null; }

function _syncActivePageToGlobals() {
  const p = getActivePage();
  code = p ? p.code : [];
}


const lineHeight = 20;
const charWidth = 8;
const gutterWidth = 20;
let selectedline = null;
let selectedEditIndex = null;
let currentFile = null;
let insertState = null;
let pdfDoc = null;



// Called when user clicks "Next →" in the main codeModal (edit current page code)
function nextt() {
  const text = document.getElementById('code').value;
  const lines = text.split('\n');
  const newCode = lines.map((ln, i) => ({
    lineNo: i, sel: '>', text: ln === '' ? ' ' : ln, edit: [], isButton: false
  }));
  // Update code for active page only — do NOT touch global select
  const p = getActivePage();
  if (p) p.code = newCode;
  _syncActivePageToGlobals();
  // Remove any existing select entries for this page (code just replaced)
  select = select.filter(s => s.pageIdx !== activePageIdx);
  closeCodeModal();
  render();
}

// ─── PAGE MANAGEMENT ─────────────────────────────────────────────────────────

function _genPageId() {
  return 'page-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

function _flushEditorToActivePage() {
  const p = getActivePage();
  if (p) p.code = code;  // only code, select is global
}

/** Rebuild the #pages tab bar from the pages[] array. */
function renderPageTabs() {
  const container = document.getElementById('pages');
  if (!container) return;
  // Remove all tab divs (keep #addPageBtn at the end)
  const addBtn = document.getElementById('addPageBtn');
  container.innerHTML = '';

  pages.forEach((page, idx) => {
    const tab = document.createElement('div');
    tab.className = 'page-tab' + (idx === activePageIdx ? ' active' : '');
    tab.dataset.idx = idx;

    const nameEl = document.createElement('div');
    nameEl.className = 'page-tab-name';
    nameEl.textContent = page.name;

    const menuBtn = document.createElement('div');
    menuBtn.className = 'page-menu-dots';
    menuBtn.textContent = '☰';
    menuBtn.onclick = (e) => { e.stopPropagation(); openPageMenu(idx, e); };

    tab.appendChild(nameEl);
    tab.appendChild(menuBtn);
    tab.onclick = () => switchToPage(idx);

    container.appendChild(tab);
  });

  // Re-add the + button
  if (addBtn) {
    container.appendChild(addBtn);
  } else {
    const btn = document.createElement('div');
    btn.id = 'addPageBtn';
    btn.textContent = '+';
    btn.onclick = openAddPageModal;
    container.appendChild(btn);
  }
}

/** Switch the editor view to a different page. */
function switchToPage(idx) {
  if (idx === activePageIdx && pages.length > 0) return;
  // Save current editor state back
  _flushEditorToActivePage();
  // Switch
  activePageIdx = idx;
  _syncActivePageToGlobals();
  renderPageTabs();
  render();
  renderSequencePanel();
}

// ─── ADD PAGE MODAL ──────────────────────────────────────────────────────────

function openAddPageModal() {
  const modal = document.getElementById('addPageModal');
  if (!modal) return;
  // Auto-suggest name
  const nameInput = document.getElementById('addPageCode');
  if (nameInput) nameInput.value = 'Page ' + (pages.length + 1);
  document.getElementById('addPageCode').value = '';
  modal.classList.add('active');
  setTimeout(() => { if (nameInput) nameInput.focus(); }, 280);
}

function closeAddPageModal() {
  document.getElementById('addPageModal').classList.remove('active');
}

/** Called by "Create Page →" button in #addPageModal. */
function createPage() {
  const nameInput = document.getElementById('newPageName');
  const codeTA = document.getElementById('addPageCode');
  const name = (nameInput ? nameInput.value.trim() : '') || ('Page ' + (pages.length + 1));
  const text = codeTA ? codeTA.value : '';

  const lines = text.split('\n');
  const newCode = lines.map((ln, i) => ({
    lineNo: i, sel: '>', text: ln === '' ? ' ' : ln, edit: [], isButton: false
  }));

  const newPage = { id: _genPageId(), name, code: newCode }; // no per-page select
  pages.push(newPage);
  activePageIdx = pages.length - 1;
  _syncActivePageToGlobals();
  renderPageTabs();
  closeAddPageModal();
  render();
  renderSequencePanel();
  toast(`Page "${name}" created.`, 'success');
}

// ─── PAGE CONTEXT MENU ───────────────────────────────────────────────────────

function openPageMenu(idx, event) {
  _pcmTargetIdx = idx;
  const menu = document.getElementById('pageContextMenu');
  if (!menu) return;
  menu.classList.add('open');
  // Position near the ☰ icon
  const x = Math.min(event.clientX, window.innerWidth - 160);
  const y = Math.min(event.clientY + 4, window.innerHeight - 90);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function _closePageMenu() {
  const menu = document.getElementById('pageContextMenu');
  if (menu) menu.classList.remove('open');
  _pcmTargetIdx = -1;
}

function renamePage() {
  if (_pcmTargetIdx < 0 || _pcmTargetIdx >= pages.length) { _closePageMenu(); return; }
  const targetIdx = _pcmTargetIdx;   // snapshot before _closePageMenu resets it
  _closePageMenu();
  const page = pages[targetIdx];
  const modal = document.getElementById('renamePageModal');
  const inp = document.getElementById('renamePageInput');
  if (!modal || !inp) return;
  // Store the target index on the modal so confirmRenamePage can read it
  modal.dataset.targetIdx = targetIdx;
  inp.value = page.name;
  modal.classList.add('active');
  setTimeout(() => { inp.focus(); inp.select(); }, 200);
}

function closeRenamePageModal() {
  const modal = document.getElementById('renamePageModal');
  if (modal) modal.classList.remove('active');
}

function confirmRenamePage() {
  const modal = document.getElementById('renamePageModal');
  const inp = document.getElementById('renamePageInput');
  if (!modal || !inp) return;
  const idx = parseInt(modal.dataset.targetIdx, 10);
  const newName = inp.value.trim();
  if (!isNaN(idx) && idx >= 0 && idx < pages.length && newName !== '') {
    pages[idx].name = newName;
    renderPageTabs();
    toast(`Renamed to "${newName}".`, 'info');
  }
  closeRenamePageModal();
}

function deletePage() {
  if (_pcmTargetIdx < 0 || _pcmTargetIdx >= pages.length) { _closePageMenu(); return; }
  if (pages.length === 1) {
    toast('Cannot delete the last page.', 'warning');
    _closePageMenu();
    return;
  }
  const deletedIdx = _pcmTargetIdx;
  const name = pages[deletedIdx].name;
  pages.splice(deletedIdx, 1);
  // Remove all sequence steps belonging to deleted page
  select = select.filter(s => s.pageIdx !== deletedIdx);
  // Fix pageIdx references for pages that shifted
  select.forEach(s => { if (s.pageIdx > deletedIdx) s.pageIdx--; });
  // Re-number
  select.forEach((s, i) => { s.sel = i + 1; });
  if (activePageIdx >= pages.length) activePageIdx = pages.length - 1;
  _syncActivePageToGlobals();
  syncSelectionVisuals();
  renderPageTabs();
  renderSequencePanel();
  toast(`Page "${name}" deleted.`, 'info');
  _closePageMenu();
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
    leftMark.innerHTML = code[i].sel !== ">" ? code[i].sel : ">";
    leftMark.onclick = () => addline(i, -1, false, leftMark);
    leftMark.ondblclick = (e) => {
      e.preventDefault();
      handleRightClick(i, -1);
    };
    leftMark.oncontextmenu = (e) => {
      e.preventDefault();
      handleRightClick(i, -1);
    };
    setupHoverTooltip(leftMark, "Click to select,\n Reclick to disselect,\n Double click to delete");

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
    btnUp.style.color = "black";
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
    btnDown.style.color = "black";
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
      leftMark.innerHTML = code[i].edit[editIndex].sel !== ">" ? code[i].edit[editIndex].sel : ">";
      leftMark.onclick = () => addline(i, editIndex, false, leftMark);
      leftMark.ondblclick = (e) => {
        e.preventDefault();
        handleRightClick(i, editIndex);
      };
      leftMark.oncontextmenu = (e) => {
        e.preventDefault();
        handleRightClick(i, editIndex);
      };
      setupHoverTooltip(leftMark, "Click to select,\n Reclick to disselect,\n Double click to delete");
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
    setupHoverTooltip(rightMark, "Add new edit");
    editor.appendChild(rightMark);
  });

  //editor.style.height = `${code.length * lineHeight + 20}px`;

  // Restore PDF markers if a PDF is loaded
  if (pdfDoc) {
    renderPDFMarkers(pdfDoc);
  }

  renderSequencePanel();
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
      // DESELECT LOGIC — also cascade-remove dependent edits
      const selVal = currentSel;

      // Collect sel-values to remove from the global select array
      const toRemove = new Set();
      toRemove.add(selVal);

      if (j === -1) {
        // Deselecting the LINE → remove every edit on this line too
        code[i].edit.forEach(edit => {
          if (edit.sel !== ">") toRemove.add(edit.sel);
          edit.sel = ">";             // reset visual immediately
        });
        code[i].sel = ">";
      } else {
        // Deselecting EDIT j → remove edit j and all subsequent edits on this line
        for (let k = j; k < code[i].edit.length; k++) {
          if (code[i].edit[k].sel !== ">") toRemove.add(code[i].edit[k].sel);
          code[i].edit[k].sel = ">";  // reset visual immediately
        }
      }

      // Remove all collected entries from the global select array
      select = select.filter(s => !toRemove.has(s.sel));

      // Re-number remaining
      select.forEach((s, idx) => { s.sel = idx + 1; });

      // Sync visuals (also re-applies numbers to the code model)
      syncSelectionVisuals();
      return;
    }

    // SELECT LOGIC (Validation)
    if (j != -1) {
      // 1. Parent line must be selected first
      if (code[i].sel == ">") {
        toast("This line has not been printed yet — select the line first.", "warning");
        return;
      }
      // 2. All previous edits on this line must be selected in order
      if (j > 0 && code[i].edit[j - 1].sel === ">") {
        toast(`Select edit ${j} before selecting edit ${j + 1} — edits must be added in sequence.`, "warning");
        return;
      }
    }

    // ADD TO SELECTION
    const newSel = select.length + 1;
    if (j == -1) {
      code[i].sel = newSel;
      adder.innerHTML = newSel;
    } else {
      code[i].edit[j].sel = newSel;
      adder.innerHTML = newSel;
    }

    if (j == -1) {
      select.push({
        type: 'line',
        pageIdx: activePageIdx,        // ← tag with current page
        lineNo: i,
        sel: newSel,
        cp: -1,
        del: -1,
        text: code[i].text,
      });
    } else {
      select.push({
        type: 'line',
        pageIdx: activePageIdx,        // ← tag with current page
        lineNo: i,
        sel: newSel,
        cp: code[i].edit[j].startPos,
        del: code[i].edit[j].editedLength,
        text: code[i].edit[j].editedText,
        wholeText: code[i].edit[j].text,
      });
    }
    renderSequencePanel();
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
    // It's an edit button — delete this edit AND all subsequent edits on the same line

    // Collect sel-values of this edit and all edits after it (that are selected)
    const selValuesToRemove = new Set();
    for (let k = editIndex; k < code[lineIndex].edit.length; k++) {
      const s = code[lineIndex].edit[k].sel;
      if (s !== ">") selValuesToRemove.add(s);
    }

    // Remove their entries from the global select array
    select = select.filter(s => !selValuesToRemove.has(s.sel));

    // Remove the edits from this line (from editIndex onwards)
    code[lineIndex].edit.splice(editIndex);

    if (selValuesToRemove.size > 0) {
      // Re-number the remaining select entries from scratch
      select.forEach((s, i) => { s.sel = i + 1; });
      syncSelectionVisuals();
    } else {
      // No numbered edits were removed — just re-render
      render();
    }
  }
}

function syncSelectionVisuals() {
  console.log('[SYNC] select=', JSON.stringify(select));
  console.log('[SYNC] pages count=', pages.length, pages.map(p => p.name + ':' + p.code.length + 'lines'));

  // Reset markers on ALL pages
  pages.forEach(p => {
    p.code.forEach(line => {
      line.sel = '>';
      line.edit.forEach(e => e.sel = '>');
    });
  });

  // Apply from global select to each item's correct page
  select.forEach(s => {
    if (s.type !== 'line') return;
    const pg = pages[s.pageIdx];
    if (!pg) { console.warn('[SYNC] no page for pageIdx=', s.pageIdx); return; }
    const pgCode = pg.code;
    if (!pgCode[s.lineNo]) { console.warn('[SYNC] no code line for lineNo=', s.lineNo, 'in page', s.pageIdx, 'len=', pgCode.length); return; }
    if (s.cp === -1) {
      pgCode[s.lineNo].sel = s.sel;
      console.log('[SYNC] set page', s.pageIdx, 'line', s.lineNo, 'sel=', s.sel);
    } else {
      const edit = pgCode[s.lineNo].edit.find(e =>
        e.startPos === s.cp &&
        e.editedLength === s.del &&
        e.text === s.wholeText
      );
      if (edit) { edit.sel = s.sel; console.log('[SYNC] set edit sel=', s.sel); }
      else { console.warn('[SYNC] edit not found for', s); }
    }
  });

  _syncActivePageToGlobals();
  render();
}


function renderSequencePanel() {
  const list = document.getElementById('seqList');
  if (!list) return;
  list.innerHTML = '';

  if (select.length === 0) {
    const empty = document.createElement('div');
    empty.style.padding = '12px';
    empty.style.fontSize = '12px';
    empty.innerHTML = ` No steps yet. Click
        <div
          style="display: inline-block; position: relative; top: 5px; left: 0px; width: 19px; height: 19px; z-index: 5;">
          <div class="mark" style="position: absolute; top: 0px; left: 0px; z-index: 100; background-color: yellow;">
            &gt;</div>
        </div>
        on code lines.`;

    list.appendChild(empty);
    return;
  }

  select.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'seq-item' + (item.type === 'page' ? ' type-page' : '');

    const num = document.createElement('div');
    num.className = 'seq-num';
    num.textContent = item.sel;

    // Page badge — shows which file this step belongs to
    const pageBadge = document.createElement('div');
    pageBadge.className = 'seq-page-badge';
    if (item.type === 'page') {
      pageBadge.textContent = '\uD83D\uDDBC\uFE0F';
    } else {
      const pg = pages[item.pageIdx];
      pageBadge.textContent = pg ? pg.name : `P${(item.pageIdx || 0) + 1}`;
      pageBadge.title = pg ? pg.name : '';
    }

    const label = document.createElement('div');
    label.className = 'seq-label';
    if (item.type === 'page') {
      label.textContent = `Page ${item.pageNo}`;
    } else {
      const txt = item.text || '';
      label.textContent = txt.length > 22 ? txt.slice(0, 22) + '\u2026' : txt;
      label.title = txt;
    }

    const del = document.createElement('span');
    del.className = 'seq-del';
    del.textContent = '\u00D7';
    del.title = 'Remove step';
    del.onclick = (e) => {
      e.stopPropagation();
      removeStepByIndex(idx);
    };

    row.appendChild(num);
    row.appendChild(pageBadge);
    row.appendChild(label);
    row.appendChild(del);
    list.appendChild(row);
  });
}

function removeStepByIndex(idx) {
  const removed = select[idx];
  select.splice(idx, 1);
  // Re-number
  select.forEach((s, i) => { s.sel = i + 1; });
  syncSelectionVisuals();
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

// ─── START / STOP BUTTON STATE ───────────────────────────────────────────── //

let _pollTimer = null;

function setRunningState() {
  const btn = document.getElementById('btnStartStop');
  if (!btn) return;
  btn.className = 'running';
  btn.textContent = 'Stop';
}

function setIdleState() {
  const btn = document.getElementById('btnStartStop');
  if (!btn) return;
  btn.className = 'idle';
  btn.textContent = '▶ Start';
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

/** Poll Python every second; reset button when typer stops on its own. */
function _startPolling() {
  if (_pollTimer) return;
  _pollTimer = setInterval(() => {
    try {
      window.pywebview.api.start_typing.__proto__; // sanity – api exists
      // We use a lightweight trick: ask Python if it's still running via
      // the existing stop_typing call return value would always be "Stopped",
      // so instead we rely on the is_running flag exposed through a tiny check.
      // Since pywebview doesn't expose is_running directly, we use a workaround:
      // call stop_typing(dry=true) – but that doesn't exist. Instead we check
      // whether the button should revert by trying to read typer state.
      // The cleanest approach: expose is_running via the Api class.
      if (window.pywebview && window.pywebview.api && window.pywebview.api.is_running) {
        window.pywebview.api.is_running().then(running => {
          if (!running) setIdleState();
        }).catch(() => { });
      }
    } catch (e) { /* pywebview not ready */ }
  }, 1000);
}

function toggleStartStop() {
  const btn = document.getElementById('btnStartStop');
  if (btn && btn.classList.contains('running')) {
    // Currently running → stop
    window.pywebview.api.stop_typing();
    setIdleState();
    toast('Typing stopped.', 'info');
  } else {
    // Currently idle → start
    start();
  }
}

function start() {
  // Flush current page state before building payload
  _flushEditorToActivePage();

  // select is now ONE global array — check it directly
  if (select.length === 0) {
    toast("No lines selected — add lines to the sequence first.", "warning");
    return;

  }

  const payload = flattenForTyper();

  // Execute the actual start logic
  window.pywebview.api.stop_typing();
  window.pywebview.api.start_typing(currentFile, payload);
  setRunningState();
  _startPolling();
  toast("Starting in 5 seconds — hold F8 to type · ESC to stop.", "info", 5000);
}

function stop() {
  window.pywebview.api.stop_typing();
  setIdleState();
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
    toast('Please select a text-based file (.c, .py, .js, .java, etc.)', 'warning');
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
        toast('This file appears to be binary. Please select a text file.', 'error');
        return;
      }

      // Display content in textarea
      codeTextarea.value = text;
      toast(`File "${file.name}" loaded successfully!`, "success");
    } catch (error) {
      toast('Error reading file: ' + error.message, 'error');
    }
  };

  reader.onerror = function () {
    toast('Error reading file. Please try again.', 'error');
  };

  // Read file as text
  reader.readAsText(file);
}

// ---------------- PDF FUNCTIONS ---------------- //

function loadPDF() {
  document.getElementById('pdfInputHidden').click();
}


// --- TOAST NOTIFICATION SYSTEM ---
function toast(msg, type, duration) {
  type = type || 'info';
  duration = duration || 3500;
  var icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  var titles = { info: 'Info', success: 'Done', error: 'Error', warning: 'Warning' };
  var container = document.getElementById('toastContainer');
  if (!container) { console.warn(msg); return; }
  var el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.style.setProperty('--duration', (duration / 1000) + 's');
  el.innerHTML =
    '<span class="toast-icon">' + icons[type] + '</span>' +
    '<div class="toast-body">' +
    '<div class="toast-title">' + titles[type] + '</div>' +
    '<div class="toast-msg">' + msg + '</div>' +
    '</div>' +
    '<button class="toast-close" onclick="this.closest(\'.toast\').remove()">×</button>' +
    '<div class="toast-progress"></div>';
  container.appendChild(el);
  requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
  setTimeout(function () {
    el.classList.remove('show');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  const pdfInput = document.getElementById('pdfInputHidden');
  if (pdfInput) {
    pdfInput.addEventListener('change', handlePDFUpload);
  }
});

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function handlePDFUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    window.currentPDFBase64 = arrayBufferToBase64(e.target.result);
    processPDFData(e.target.result);
  };
  reader.readAsArrayBuffer(file);
}

function processPDFData(arrayBuffer) {
  const typedArray = new Uint8Array(arrayBuffer);
  pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
    pdfDoc = pdf;
    renderPDFMarkers(pdf);
    toast(`PDF loaded — ${pdf.numPages} page(s) ready.`, "success");
  }).catch(function (error) {
    toast('Error loading PDF: ' + error.message, 'error');
  });
}

function renderPDFMarkers(pdf) {
  const bottomBar = document.getElementById('pdfBottomBar');
  if (!bottomBar) return;
  bottomBar.innerHTML = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const thumb = document.createElement('div');
    thumb.className = 'pdf-thumbnail';
    thumb.id = `pdfThumb_${pageNum}`;

    const canvas = document.createElement('canvas');
    const label = document.createElement('span');
    label.textContent = 'Pg ' + pageNum;

    // Single click → add a page step to the sequence
    thumb.onclick = () => {
      addPageStep(pageNum);
    };

    // Double click → preview full screen
    thumb.ondblclick = (e) => {
      e.stopPropagation();
      showPDFPagetemp(pageNum);
    };

    thumb.appendChild(canvas);
    thumb.appendChild(label);
    bottomBar.appendChild(thumb);

    pdf.getPage(pageNum).then(function (page) {
      const viewport = page.getViewport({ scale: 0.2 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      page.render({ canvasContext: context, viewport: viewport });
    });
  }
}

function addPageStep(pageNum) {
  const newSel = select.length + 1;
  select.push({
    type: 'page',
    pageNo: pageNum,
    sel: newSel,
    // dummy fields to match shape
    lineNo: -1,
    cp: -1,
    del: -1,
    text: ''
  });
  renderSequencePanel();
  // Flash the thumbnail to confirm
  const thumb = document.getElementById('pdfThumb_' + pageNum);
  if (thumb) {
    thumb.classList.add('selected');
    setTimeout(() => thumb.classList.remove('selected'), 600);
  }
}


function showPDFPreview(pageNum, anchorElement) {
  if (!pdfDoc) return;

  let preview = document.getElementById('pdfPreview');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'pdfPreview';
    document.body.appendChild(preview);
    const canvas = document.createElement('canvas');
    preview.appendChild(canvas);
  }

  preview.classList.add('visible');
  const rect = anchorElement.getBoundingClientRect();

  // Position it to the LEFT of the sidebar
  preview.style.top = `${rect.top}px`;
  // Account for the width of the row (approx 40px)
  preview.style.right = `${window.innerWidth - rect.left + 5}px`;
  preview.style.left = 'auto';

  pdfDoc.getPage(pageNum).then(function (page) {
    const canvas = preview.querySelector('canvas');
    const viewport = page.getViewport({ scale: 0.3 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    page.render(renderContext);
  });
}


function showPDFPage(pageNum) {
  if (!pdfDoc) return;

  pdfDoc.getPage(pageNum).then(function (page) {
    // Render at native screen resolution for best quality
    const sw = window.screen.width || window.innerWidth;
    const sh = window.screen.height || window.innerHeight;
    const nativeVP = page.getViewport({ scale: 1 });
    const scale = Math.min(sw / nativeVP.width, sh / nativeVP.height);
    const viewport = page.getViewport({ scale: scale });

    // Render into an off-screen canvas
    const offCanvas = document.createElement('canvas');
    offCanvas.width = viewport.width;
    offCanvas.height = viewport.height;
    const ctx = offCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
      // Export as PNG data URL, strip the prefix to get pure base64
      const dataUrl = offCanvas.toDataURL('image/png');
      const b64 = dataUrl.split(',')[1];

      // Ask Python to open a REAL fullscreen native window
      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.show_image_fullscreen(b64).catch(() => {
          // Fallback: show in the in-app modal
          const canvas = document.getElementById('pdfModalCanvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          context.drawImage(offCanvas, 0, 0);
          document.getElementById('pdfModal').classList.add('active');
        });
      } else {
        // Fallback: show in the in-app modal
        const canvas = document.getElementById('pdfModalCanvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        context.drawImage(offCanvas, 0, 0);
        document.getElementById('pdfModal').classList.add('active');
      }
    });
  });
}

function showPDFPagetemp(pageNum) {
  if (!pdfDoc) return;

  pdfDoc.getPage(pageNum).then(function (page) {
    // Render at native screen resolution for best quality
    const sw = window.screen.width || window.innerWidth;
    const sh = window.screen.height || window.innerHeight;
    const nativeVP = page.getViewport({ scale: 1 });
    const scale = Math.min(sw / nativeVP.width, sh / nativeVP.height);
    const viewport = page.getViewport({ scale: scale });

    // Render into an off-screen canvas
    const offCanvas = document.createElement('canvas');
    offCanvas.width = viewport.width;
    offCanvas.height = viewport.height;
    const ctx = offCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
      // Export as PNG data URL, strip the prefix to get pure base64
      const dataUrl = offCanvas.toDataURL('image/png');
      const b64 = dataUrl.split(',')[1];


      // Fallback: show in the in-app modal
      const canvas = document.getElementById('pdfModalCanvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      context.drawImage(offCanvas, 0, 0);
      document.getElementById('pdfModal').classList.add('active');

    });
  });
}
function showPDFPageAndFocus(pageNum) {
  try { window.pywebview.api.restore_window(); } catch (e) { }
  showPDFPage(pageNum);
}

function hidePDFPreview() {
  const preview = document.getElementById('pdfPreview');
  if (preview) preview.classList.remove('visible');
}

function closePDFModal() {
  document.getElementById('pdfModal').classList.remove('active');
  try { window.pywebview.api.close_fullscreen_image(); } catch (e) { }
  try { window.pywebview.api.minimize_window(); } catch (e) { }
}

function closePDFModaltemp() {
  document.getElementById('pdfModal').classList.remove('active');
}
// --- KNOW MORE MODAL ---
function knowMore() { document.getElementById('knowMoreModal').classList.add('active'); }
function closeKnowMore() { document.getElementById('knowMoreModal').classList.remove('active'); }

// --- TOAST NOTIFICATION SYSTEM ---
function toast(msg, type, duration) {
  type = type || 'info';
  duration = duration || 3500;
  var icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  var titles = { info: 'Info', success: 'Done', error: 'Error', warning: 'Warning' };
  var container = document.getElementById('toastContainer');
  if (!container) { console.warn(msg); return; }
  var el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.style.setProperty('--duration', (duration / 1000) + 's');
  el.innerHTML =
    '<span class="toast-icon">' + icons[type] + '</span>' +
    '<div class="toast-body">' +
    '<div class="toast-title">' + titles[type] + '</div>' +
    '<div class="toast-msg">' + msg + '</div>' +
    '</div>' +
    '<button class="toast-close" onclick="this.closest(\'.toast\').remove()">×</button>' +
    '<div class="toast-progress"></div>';
  container.appendChild(el);
  requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
  setTimeout(function () {
    el.classList.remove('show');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
  }, duration);
}

document.addEventListener('DOMContentLoaded', function () { var m = document.getElementById('knowMoreModal'); if (m) m.addEventListener('click', function (e) { if (e.target === m) closeKnowMore(); }); });

// ─── SETTINGS PANEL ──────────────────────────────────────────────────────── //

const SPEED_PRESETS = {
  slow: { typing: 0.15, loop: 0.20, sync: 0.10 },
  normal: { typing: 0.08, loop: 0.10, sync: 0.05 },
  fast: { typing: 0.03, loop: 0.05, sync: 0.02 },
  turbo: { typing: 0.01, loop: 0.02, sync: 0.01 },
};

function openSettings() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('active');
  // Load current values from Python if available
  try {
    window.pywebview.api.get_settings().then(d => {
      if (!d) return;
      const tSlider = document.getElementById('slTyping');
      const lSlider = document.getElementById('slLoop');
      const sSlider = document.getElementById('slSync');
      tSlider.value = Math.round(d.typing * 100);
      lSlider.value = Math.round(d.loop * 100);
      sSlider.value = Math.round(d.sync * 100);
      document.getElementById('valTyping').textContent = Math.round(d.typing * 1000) + 'ms';
      document.getElementById('valLoop').textContent = Math.round(d.loop * 1000) + 'ms';
      document.getElementById('valSync').textContent = Math.round(d.sync * 1000) + 'ms';
    }).catch(() => { });
  } catch (e) { }
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
}

function applySpeedPreset(preset) {
  const p = SPEED_PRESETS[preset];
  if (!p) return;
  // Update sliders
  document.getElementById('slTyping').value = Math.round(p.typing * 100);
  document.getElementById('slLoop').value = Math.round(p.loop * 100);
  document.getElementById('slSync').value = Math.round(p.sync * 100);
  document.getElementById('valTyping').textContent = Math.round(p.typing * 1000) + 'ms';
  document.getElementById('valLoop').textContent = Math.round(p.loop * 1000) + 'ms';
  document.getElementById('valSync').textContent = Math.round(p.sync * 1000) + 'ms';
  // Highlight active preset button
  ['slow', 'normal', 'fast', 'turbo'].forEach(id => {
    document.getElementById('preset-' + id).classList.toggle('active', id === preset);
  });
}

function applyAccent(color, swatchEl) {
  const root = document.documentElement;
  root.style.setProperty('--accent', color);
  // Darken the accent ~20% for --accent-dark
  root.style.setProperty('--accent-dark', shadeColor(color, -20));
  // Set --accent-rgb as "R, G, B" so rgba(var(--accent-rgb), 0.1) works in CSS
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  // Clear swatch selection
  document.querySelectorAll('.st-swatch').forEach(s => s.classList.remove('selected'));
  if (swatchEl) swatchEl.classList.add('selected');
}

function pickSwatch(el) {
  const color = el.dataset.color;
  applyAccent(color, el);
  document.getElementById('customAccentPicker').value = color;
}

function applyBg(color, btnId) {
  document.documentElement.style.setProperty('--bg', color);
  document.documentElement.style.setProperty('--surface',
    btnId === 'bg-dark' ? '#2a2a3e' : (btnId === 'bg-grey' ? '#d4d4d4' : '#e8e8e8'));
  document.querySelectorAll('.st-bg-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add('selected');
  // Dark theme: body text color
  if (btnId === 'bg-dark') {
    document.body.style.color = '#e0e0e0';
  } else {
    document.body.style.color = '';
  }
}

function shadeColor(hex, percent) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, Math.max(0, r + Math.round(r * percent / 100)));
  g = Math.min(255, Math.max(0, g + Math.round(g * percent / 100)));
  b = Math.min(255, Math.max(0, b + Math.round(b * percent / 100)));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function applySettings() {
  const typing = parseInt(document.getElementById('slTyping').value) / 100;
  const loop = parseInt(document.getElementById('slLoop').value) / 100;
  const sync = parseInt(document.getElementById('slSync').value) / 100;
  try {
    window.pywebview.api.update_settings(typing, loop, sync).then(() => {
      toast('Settings saved! Speed updated.', 'success');
      closeSettings();
    }).catch(e => toast('Error saving settings: ' + e, 'error'));
  } catch (e) {
    // pywebview not available (dev mode)
    toast('Settings applied (UI only).', 'info');
    closeSettings();
  }
}

// Close settings on backdrop click
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var m = document.getElementById('settingsModal');
    if (m) m.addEventListener('click', function (e) { if (e.target === m) closeSettings(); });
  });
})();
