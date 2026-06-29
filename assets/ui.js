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

    // Close edit modal when clicking backdrop
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            cancleinput();
        });
    }

    // Drag-and-drop onto the code modal box
    const box = document.getElementById('codeModalBox');
    if (box) {
        ['dragenter', 'dragover'].forEach(ev => {
            box.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); box.classList.add('drag-over'); });
        });
        ['dragleave', 'drop'].forEach(ev => {
            box.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); box.classList.remove('drag-over'); });
        });
        box.addEventListener('drop', e => {
            const file = e.dataTransfer.files[0];
            if (file) readFileContent(file);
        });
    }

    // Keyboard shortcuts for rename modal
    const renameInp = document.getElementById('renamePageInput');
    if (renameInp) {
        renameInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); confirmRenamePage(); }
            else if (e.key === 'Escape') { e.preventDefault(); closeRenamePageModal(); }
        });
    }

    // Auto-open Add Page modal on first load (no pages yet)
    renderPageTabs();
    if (typeof renderCommands === 'function') renderCommands();
    //openAddPageModal();
});

function openCodeModal() {
    document.getElementById('codeModal').classList.add('active');
    // Focus the textarea after animation
    setTimeout(() => {
        const ta = document.getElementById('code');
        if (ta) ta.focus();
    }, 280);
}

function closeCodeModal() {
    document.getElementById('codeModal').classList.remove('active');
}

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
    document.getElementById("editor").innerHTML = `No code selected yet. <br>
      Click
      <button onclick="loadProject()" style="color:var(--accent);" data-tooltip="Load a saved .pds project file">
        Load
      </button>
      to open an existing lecture, or click
      <div id="addPageBtn" style="display:inline-block; text-align: center; background-color: #1a1a2e;"
        onclick="openAddPageModal()">+</div>
      to create a new lecture.`;

    document.getElementById("seqList").innerHTML = ` No steps yet. Click
        <div
          style="display: inline-block; position: relative; top: 5px; left: 0px; width: 19px; height: 19px; z-index: 5;">
          <div class="mark" style="position: absolute; top: 0px; left: 0px; z-index: 100; background-color: yellow;">
            &gt;</div>
        </div>
        on code lines.`;

    const pdfSlidesSection = document.getElementById("pdfSlidesSection");
    if (pdfSlidesSection) {
        pdfSlidesSection.innerHTML = ` <div style="padding: 12px; font-size: 12px; text-align: center;">No PDF selected yet.
          Click
          <button onclick="loadPDF()" style="height: 40px; display: inline-block; font-size: 12px; color: var(--accent);"
            data-tooltip="Load a PDF to use as presentation slides">
            Load PDF
          </button>

          to select a PDF for your presentation slides.
        </div>`;
    }

    inputdiv.style.display = "none";
    backdrop.classList.remove("active");

    pages = [];
    select = [];
    commands = [];
    if (typeof renderCommands === 'function') renderCommands();
    activePageIdx = 0;
    currentFile = null;
    window.currentPDFBase64 = null;
    _syncActivePageToGlobals();
    renderPageTabs();
    //openAddPageModal();
}

function loadProject() {
    showLoading("Loading Lecture...", "Opening project file...");
    window.pywebview.api.load_file().then((data) => {
        if (!data) {
            hideLoading();
            return;
        }
        const filePath = data.path;
        const fileExtension = filePath.toLowerCase().split('.').pop();

        if (fileExtension === 'pds') {
            currentFile = data.path;
            const content = data.content;

            if (content.version === 3) {
                // ── v3 format ──
                // New v3: top-level select[] exists
                // Old v3 (transitional): select was per-page inside pages[]
                window.currentPDFBase64 = content.pdfBase64 || null;
                if (window.currentPDFBase64) {
                    showLoading("Loading Lecture & PDF...", "Converting PDF slides...");
                    setTimeout(() => {
                        processPDFData(base64ToArrayBuffer(window.currentPDFBase64));
                    }, 50);
                }

                if (Array.isArray(content.select) && content.select.length > 0) {
                    // ── New v3: global select at top level ──
                    pages = (content.pages || []).map(p => ({ id: p.id, name: p.name, code: p.code || [] }));
                    select = content.select.map((s, idx) => ({ ...s, sel: idx + 1, pageIdx: s.pageIdx || 0 }));
                } else {
                    // ── Old v3 (transitional): merge per-page selects into global select ──
                    pages = (content.pages || []).map(p => ({ id: p.id, name: p.name, code: p.code || [] }));
                    select = [];
                    let selCounter = 1;
                    (content.pages || []).forEach((p, pageIdx) => {
                        (p.select || []).forEach(s => {
                            select.push({ ...s, pageIdx, sel: selCounter++ });
                        });
                    });
                }
                commands = content.commands || [];
                if (typeof renderCommands === 'function') renderCommands();
                activePageIdx = 0;

            } else if (content.version === 2) {
                // ── v2 → single page migration ──
                pages = [{ id: _genPageId(), name: 'Page 1', code: content.code || [] }];
                select = (content.select || []).map((s, idx) => ({ ...s, pageIdx: 0, sel: idx + 1 }));
                window.currentPDFBase64 = content.pdfBase64 || null;
                if (window.currentPDFBase64) {
                    showLoading("Loading Lecture & PDF...", "Converting PDF slides...");
                    setTimeout(() => {
                        processPDFData(base64ToArrayBuffer(window.currentPDFBase64));
                    }, 50);
                }
                activePageIdx = 0;

            } else if (Array.isArray(content)) {
                // ── v1 legacy (raw select array) ──
                const legacySelect = content;
                let maxLine = -1;
                legacySelect.forEach(s => { if (s.lineNo > maxLine) maxLine = s.lineNo; });
                const legacyCode = [];
                for (let i = 0; i <= maxLine; i++) {
                    legacyCode.push({ lineNo: i, sel: '>', text: '', edit: [], isButton: false });
                }
                legacySelect.forEach(s => {
                    if (!legacyCode[s.lineNo]) return;
                    legacyCode[s.lineNo].isButton = s.button || false;
                    if (s.cp === -1) {
                        legacyCode[s.lineNo].text = s.text;
                        legacyCode[s.lineNo].sel = s.sel;
                    } else {
                        legacyCode[s.lineNo].edit.push({
                            sel: s.sel, text: s.wholeText,
                            startPos: s.cp, editedLength: s.del, editedText: s.text
                        });
                    }
                });
                pages = [{ id: _genPageId(), name: 'Page 1', code: legacyCode }];
                select = legacySelect.map((s, idx) => ({ ...s, pageIdx: 0, sel: idx + 1 }));
                activePageIdx = 0;
            }

            _syncActivePageToGlobals();
            syncSelectionVisuals();   // apply selection markers to ALL pages
            renderPageTabs();
            renderSequencePanel();    // populate the sequence panel
            toast('Project loaded', 'success');

            if (!window.currentPDFBase64) {
                const pdfSlidesSection = document.getElementById("pdfSlidesSection");
                if (pdfSlidesSection) {
                    pdfSlidesSection.innerHTML = ` <div style="padding: 12px; font-size: 12px; text-align: center;">No PDF selected yet.
                      Click
                      <button onclick="loadPDF()" style="height: 40px; display: inline-block; font-size: 12px; color: var(--accent);"
                        data-tooltip="Load a PDF to use as presentation slides">
                        Load PDF
                      </button>

                      to select a PDF for your presentation slides.
                    </div>`;
                }
                hideLoading();
            }

        } else {
            document.getElementById('addPageCode').value = data.content;
            openAddPageModal();
            toast('File loaded — click Create Page to add it.', 'info');
            hideLoading();
        }
    }).catch((err) => {
        hideLoading();
        toast('Error loading project: ' + err.message, 'error');
    });
}


function saveProject() {
    // Flush current editor state back into active page before saving
    _flushEditorToActivePage();
    const dataToSave = {
        version: 3,
        pdfBase64: window.currentPDFBase64 || null,
        pages: pages,
        select: select,
        commands: commands
    };
    if (currentFile) {
        window.pywebview.api.save_file_direct(currentFile, dataToSave).then((path) => {
            if (path) {
                currentFile = path;
                toast("Saved successfully", "success");
            } else {
                toast("Error saving file directly", "error");
            }
        }).catch((err) => {
            toast("Error saving file: " + err, "error");
        });
    } else {
        saveProjectAs();
    }
}

function saveProjectAs() {
    // Flush current editor state back into active page before saving
    _flushEditorToActivePage();
    const dataToSave = {
        version: 3,
        pdfBase64: window.currentPDFBase64 || null,
        pages: pages,
        select: select,
        commands: commands
    };
    window.pywebview.api.save_file(dataToSave).then((path) => {
        if (path) {
            currentFile = path;
            toast("Saved successfully", "success");
        }
    }).catch((err) => {
        toast("Error saving file: " + err, "error");
    });
}


// Dismiss context menu on outside click
document.addEventListener('click', (e) => {
    const menu = document.getElementById('pageContextMenu');
    if (menu && menu.classList.contains('open') && !menu.contains(e.target)) {
        _closePageMenu();
    }
});

// ─── FLATTEN GLOBAL SEQUENCE FOR TYPER ───────────────────────────────────────

/**
 * Walk the ONE global select[] in order.
 * Before each typing step, compare its pageIdx to the currently
 * active VS Code file. If different, insert a -3 (file-switch) step
 * using Ctrl+Alt+Right or Ctrl+Alt+Left the needed number of times.
 */
function flattenForTyper() {
    const payload = { series: [] };

    // Initialize an array for each page
    for (let i = 0; i < pages.length; i++) {
        payload[i.toString()] = [];
    }

    let currentFile = null;
    let currentSeriesGroup = null;

    select.forEach(item => {
        if (item.type === 'page') {
            payload.series.push({ pdfPage: item.pageNo });
            currentFile = null;
            currentSeriesGroup = null;
            return;
        }

        if (item.type === 'command') {
            payload.series.push({ command: item.text });
            currentFile = null;
            currentSeriesGroup = null;
            return;
        }

        const targetPageIdx = item.pageIdx || 0;
        const pageKey = targetPageIdx.toString();

        if (!payload[pageKey]) {
            payload[pageKey] = [];
        }

        const pg = pages[targetPageIdx];
        const isBtn = pg && pg.code[item.lineNo] && pg.code[item.lineNo].isButton;

        // Re-read live text from the code model to avoid stale cached text in select[]
        let textToUse = item.text;
        let cpToUse   = item.cp;
        let delToUse  = item.del;

        if (pg && pg.code[item.lineNo]) {
            const codeLine = pg.code[item.lineNo];
            if (item.cp === -1) {
                // Plain line step — always use the live text from the code model
                textToUse = codeLine.text;
            } else {
                // Edit step — find the matching edit entry by its wholeText
                const matchEdit = codeLine.edit.find(e =>
                    e.text === item.wholeText &&
                    e.startPos === item.cp &&
                    e.editedLength === item.del
                );
                if (matchEdit) {
                    textToUse = matchEdit.editedText;
                    cpToUse   = matchEdit.startPos;
                    delToUse  = matchEdit.editedLength;
                }
            }
        }

        if (textToUse === '' && (delToUse == 0 || delToUse == -1)) textToUse = ' ';

        const stepObj = {
            lineNo: isBtn ? -1 : item.lineNo,
            sel: payload[pageKey].length + 1,
            cp: cpToUse,
            del: delToUse,
            text: textToUse
        };

        const stepIndex = payload[pageKey].length;
        payload[pageKey].push(stepObj);

        // Create a new series group if we changed files or if the previous step was a PDF
        if (currentFile !== targetPageIdx || !currentSeriesGroup) {
            currentFile = targetPageIdx;
            currentSeriesGroup = { file: pageKey, step: [] };
            payload.series.push(currentSeriesGroup);
        }

        currentSeriesGroup.step.push(stepIndex);
    });

    return payload;
}


// Wire addPageFileInput upload
document.addEventListener('DOMContentLoaded', () => {
    const addPageFileInput = document.getElementById('addPageFileInput');
    if (addPageFileInput) {
        addPageFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('addPageCode').value = ev.target.result;
                toast(`"${file.name}" loaded.`, 'success');
            };
            reader.readAsText(file);
        });
    }
});


let hoverTooltipTimeout = null;
function setupHoverTooltip(el, text) {
    el.addEventListener('mouseenter', () => {
        clearTimeout(hoverTooltipTimeout);
        hoverTooltipTimeout = setTimeout(() => {
            const tooltip = document.getElementById('globalEditorTooltip');
            if (!tooltip) return;
            tooltip.textContent = text;
            tooltip.style.display = 'block';
            const rect = el.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            let leftPos = rect.left + (rect.width / 2);
            // Prevent the tooltip from clipping off the left side of the screen
            if (leftPos - (tooltipRect.width / 2) < 10) {
                leftPos = (tooltipRect.width / 2) + 10;
            }

            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = rect.top - 2 + 'px';
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
            });
        }, 450); // delay before showing
    });

    const hideTooltip = () => {
        clearTimeout(hoverTooltipTimeout);
        const tooltip = document.getElementById('globalEditorTooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => { if (tooltip.style.opacity === '0') tooltip.style.display = 'none'; }, 200);
        }
    };

    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', hideTooltip);
    el.addEventListener('contextmenu', hideTooltip);
}