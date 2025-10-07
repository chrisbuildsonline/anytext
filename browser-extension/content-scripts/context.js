// AI Input Enhancer - Content Script
console.log("AnyText context script loaded");

// Global state
let currentActiveInput = null;
let currentButton = null;
let currentDropdown = null;

// Initialize the script
init();

function init() {
  // Set up input field detection
  setupInputDetection();

  // Listen for messages from background/service worker
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case "AI_RESULT":
        handleAIResult(message);
        break;
      case "AI_ERROR":
        handleAIError(message);
        break;
      default:
        break;
    }
  });
}

// === Input Field Detection ===
function setupInputDetection() {
  // Handle existing inputs
  document
    .querySelectorAll(
      'input[type="text"], input[type="email"], input[type="search"], textarea, [contenteditable="true"]'
    )
    .forEach(setupInputField);

  // Handle dynamically added inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the node itself is an input
          if (isInputField(node)) {
            setupInputField(node);
          }
          // Check for inputs within the added node
          node
            .querySelectorAll?.(
              'input[type="text"], input[type="email"], input[type="search"], textarea, [contenteditable="true"]'
            )
            .forEach(setupInputField);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function isInputField(element) {
  return (
    (element.tagName === "INPUT" &&
      ["text", "email", "search"].includes(element.type)) ||
    element.tagName === "TEXTAREA" ||
    element.contentEditable === "true"
  );
}

function setupInputField(input) {
  // Skip if already set up
  if (input.dataset.anytextSetup) return;
  input.dataset.anytextSetup = "true";

  // Add event listeners
  input.addEventListener("focus", () => handleInputFocus(input));
  input.addEventListener("blur", () => handleInputBlur(input));
  input.addEventListener("input", () => handleInputChange(input));
  input.addEventListener("selectionchange", () => handleSelectionChange(input));
}

function handleInputFocus(input) {
  currentActiveInput = input;
  showContextButton(input);
}

function handleInputBlur(input) {
  // Delay hiding to allow clicking the button
  setTimeout(() => {
    if (currentActiveInput === input && !isDropdownOpen()) {
      hideContextButton();
      currentActiveInput = null;
    }
  }, 150);
}

function handleInputChange(input) {
  if (currentActiveInput === input) {
    updateButtonPosition(input);
  }
}

function handleSelectionChange(input) {
  if (currentActiveInput === input) {
    updateButtonPosition(input);
  }
}

// === Context Button Management ===
function showContextButton(input) {
  // Remove existing button
  hideContextButton();

  // Create button
  const button = document.createElement("button");
  button.id = "anytext-context-button";
  button.innerHTML = "✨";
  button.title = "AI Text Tools";
  button.style.cssText = `
    position: absolute;
    width: 24px;
    height: 24px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    z-index: 2147483646;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Add hover effects
  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.1)";
    button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
    button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  });

  // Add click handler
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showContextDropdown(button, input);
  });

  // Position and add to DOM
  document.body.appendChild(button);
  currentButton = button;
  updateButtonPosition(input);
}

function hideContextButton() {
  if (currentButton) {
    currentButton.remove();
    currentButton = null;
  }
  hideContextDropdown();
}

function updateButtonPosition(input) {
  if (!currentButton || !input) return;

  const rect = input.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  // Position button at top-right corner of input
  currentButton.style.left = `${rect.right + scrollX - 30}px`;
  currentButton.style.top = `${rect.top + scrollY + 4}px`;
}

function showContextDropdown(button, input) {
  // Remove existing dropdown
  hideContextDropdown();

  const dropdown = document.createElement("div");
  dropdown.id = "anytext-context-dropdown";
  dropdown.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    z-index: 2147483647;
    min-width: 180px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    overflow: hidden;
  `;

  const actions = [
    { id: "translate", label: "🌐 Translate", description: "Translate text" },
    {
      id: "proofread",
      label: "✏️ Proofread",
      description: "Fix grammar & spelling",
    },
    {
      id: "rewrite",
      label: "📝 Rewrite",
      description: "Improve writing style",
    },
    { id: "summarize", label: "📄 Summarize", description: "Create summary" },
    {
      id: "generate",
      label: "✨ Generate",
      description: "Generate new content",
    },
  ];

  actions.forEach((action, index) => {
    const item = document.createElement("div");
    item.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: ${
        index < actions.length - 1 ? "1px solid #f0f0f0" : "none"
      };
      transition: background-color 0.2s ease;
    `;

    item.innerHTML = `
      <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${action.label}</div>
      <div style="font-size: 12px; color: #666;">${action.description}</div>
    `;

    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#f8f9fa";
    });

    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "transparent";
    });

    item.addEventListener("click", () => {
      handleContextAction(action.id, input);
      hideContextDropdown();
    });

    dropdown.appendChild(item);
  });

  // Position dropdown
  const buttonRect = button.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  dropdown.style.left = `${buttonRect.left + scrollX}px`;
  dropdown.style.top = `${buttonRect.bottom + scrollY + 4}px`;

  document.body.appendChild(dropdown);
  currentDropdown = dropdown;

  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}

function hideContextDropdown() {
  if (currentDropdown) {
    currentDropdown.remove();
    currentDropdown = null;
    document.removeEventListener("click", handleOutsideClick);
  }
}

function handleOutsideClick(e) {
  if (
    currentDropdown &&
    !currentDropdown.contains(e.target) &&
    currentButton &&
    !currentButton.contains(e.target)
  ) {
    hideContextDropdown();
  }
}

function isDropdownOpen() {
  return currentDropdown !== null;
}

function handleContextAction(actionId, input) {
  const selectedText = getSelectedText(input);

  if (!selectedText && actionId !== "generate") {
    showNotification("Please select some text first", "error");
    return;
  }

  // Send message to background script to handle AI processing
  chrome.runtime.sendMessage({
    type: "AI_REQUEST",
    action: actionId,
    text: selectedText,
    inputElement: input.tagName,
  });

  showNotification(`Processing ${actionId}...`, "info");
}

function getSelectedText(input) {
  if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    return input.value.substring(start, end);
  } else if (input.contentEditable === "true") {
    const selection = window.getSelection();
    return selection.toString();
  }
  return "";
}

// === Message Handlers ===
function handleAIResult(message) {
  const { action, originalText, result } = message;
  showResultModal(action, originalText, result);
}

function handleAIError(message) {
  const { action, error } = message;
  showNotification(`Error with ${action}: ${error}`, "error");
}

// === UI ===
function showResultModal(action, originalText, result) {
  // Prevent duplicates
  if (document.getElementById("anytext-overlay")) {
    document.getElementById("anytext-overlay").remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "anytext-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;color:#333;text-transform:capitalize;">${action} Result</h3>
      <button id="anytext-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">&times;</button>
    </div>
    <div style="margin-bottom:16px;">
      <label style="display:block;font-weight:600;color:#666;margin-bottom:8px;">Original:</label>
      <div style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:14px;">${escapeHtml(
        originalText
      )}</div>
    </div>
    <div style="margin-bottom:20px;">
      <label style="display:block;font-weight:600;color:#666;margin-bottom:8px;">Result:</label>
      <div id="anytext-result" style="background:#f0f8ff;padding:12px;border-radius:6px;font-size:14px;border-left:4px solid #4285f4;">${escapeHtml(
        result
      )}</div>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end;">
      <button id="anytext-copy" style="background:#4285f4;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Copy</button>
      <button id="anytext-replace" style="background:#34a853;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Replace</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Events
  modal.querySelector("#anytext-close").onclick = () => overlay.remove();
  modal.querySelector("#anytext-copy").onclick = () => {
    navigator.clipboard.writeText(result);
    showNotification("Copied to clipboard!", "success");
  };
  modal.querySelector("#anytext-replace").onclick = () => {
    replaceSelectedText(result);
    overlay.remove();
    showNotification("Text replaced!", "success");
  };
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

// === Helpers ===
function replaceSelectedText(newText) {
  const activeElement = document.activeElement;

  if (
    activeElement &&
    (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")
  ) {
    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;
    const value = activeElement.value;
    activeElement.value =
      value.substring(0, start) + newText + value.substring(end);
    activeElement.selectionStart = activeElement.selectionEnd =
      start + newText.length;
    activeElement.focus();
    activeElement.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      sel.removeAllRanges();
    }
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  const bgColor =
    type === "error" ? "#ea4335" : type === "success" ? "#34a853" : "#4285f4";
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${bgColor};
    color: white; padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px; z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: opacity 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[c])
  );
}

// === Window Events ===
window.addEventListener("resize", () => {
  if (currentActiveInput && currentButton) {
    updateButtonPosition(currentActiveInput);
  }
});

window.addEventListener("scroll", () => {
  if (currentActiveInput && currentButton) {
    updateButtonPosition(currentActiveInput);
  }
});

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  hideContextButton();
});
