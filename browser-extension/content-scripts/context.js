// AI Input Enhancer - Content Script
console.log("AnyText context script loaded");

// Global state
let currentActiveInput = null;
let currentButton = null;
let currentDropdown = null;
let currentSubmenu = null;
let userSettings = null;

// Initialize the script
init();

async function init() {
  // Load user settings
  await loadUserSettings();

  // Set up input field detection
  setupInputDetection();

  // Set up right-click context menu
  setupRightClickMenu();

  // Listen for messages from background/service worker
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case "AI_RESULT":
        handleAIResult(message);
        break;
      case "AI_ERROR":
        handleAIError(message);
        break;
      case "CONTEXT_MENU_ACTION":
        handleContextMenuAction(message);
        break;
      case "SETTINGS_UPDATED":
        handleSettingsUpdate(message.settings);
        break;
      default:
        break;
    }
  });
}

async function loadUserSettings() {
  try {
    const result = await chrome.storage.sync.get(["aiInputEnhancerSettings"]);
    userSettings = result.aiInputEnhancerSettings || {
      features: {
        translate: true,
        changeTone: true,
        proofread: true,
        rewrite: true,
        summarize: true,
        generate: true,
      },
      languages: [
        { code: "es", name: "Spanish", flag: "🇪🇸" },
        { code: "fr", name: "French", flag: "🇫🇷" },
        { code: "de", name: "German", flag: "🇩🇪" },
        { code: "it", name: "Italian", flag: "🇮🇹" },
        { code: "pt", name: "Portuguese", flag: "🇵🇹" },
        { code: "ja", name: "Japanese", flag: "🇯🇵" },
        { code: "ko", name: "Korean", flag: "🇰🇷" },
        { code: "zh", name: "Chinese", flag: "🇨🇳" },
      ],
    };
  } catch (error) {
    console.error("Error loading settings:", error);
    // Use default settings
    userSettings = {
      features: {
        translate: true,
        changeTone: true,
        proofread: true,
        rewrite: true,
        summarize: true,
        generate: true,
      },
      languages: [
        { code: "es", name: "Spanish", flag: "🇪🇸" },
        { code: "fr", name: "French", flag: "🇫🇷" },
        { code: "de", name: "German", flag: "🇩🇪" },
        { code: "it", name: "Italian", flag: "🇮🇹" },
      ],
    };
  }
}

function handleSettingsUpdate(newSettings) {
  console.log("Settings updated:", newSettings);
  userSettings = newSettings;

  // If dropdown is currently open, refresh it
  if (currentDropdown && currentActiveInput) {
    hideContextDropdown();
    // Small delay to ensure cleanup, then show updated dropdown
    setTimeout(() => {
      showContextDropdown(currentButton, currentActiveInput);
    }, 50);
  }
}

function hasEnabledFeatures() {
  if (!userSettings?.features) return false;
  return Object.values(userSettings.features).some((enabled) => enabled);
}

// === Right-Click Context Menu ===
function setupRightClickMenu() {
  // Store selected text for context menu actions
  let lastSelectedText = "";
  let selectionPosition = null;

  document.addEventListener("mouseup", (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      lastSelectedText = selectedText;
      // Store the position where the selection ended for popover placement
      selectionPosition = {
        x: e.clientX,
        y: e.clientY,
        range: selection.getRangeAt(0).cloneRange(),
      };

      // Send selected text to background script for context menu setup
      chrome.runtime.sendMessage({
        type: "SELECTION_CHANGED",
        text: selectedText,
        hasSelection: true,
      });
    } else {
      lastSelectedText = "";
      selectionPosition = null;
      chrome.runtime.sendMessage({
        type: "SELECTION_CHANGED",
        hasSelection: false,
      });
    }
  });

  // Store reference for context menu actions
  window.aiInputEnhancer = {
    getSelectedText: () => lastSelectedText,
    getSelectionPosition: () => selectionPosition,
  };
}

function handleContextMenuAction(message) {
  const { action, targetLanguage, languageName } = message;
  const selectedText = window.aiInputEnhancer?.getSelectedText();
  const selectionPosition = window.aiInputEnhancer?.getSelectionPosition();

  if (!selectedText) {
    showNotification("No text selected", "error");
    return;
  }

  // Handle translation with specific language
  if (action === "translate" && targetLanguage) {
    handleRightClickTranslate(
      selectedText,
      targetLanguage,
      languageName,
      selectionPosition
    );
  } else {
    handleRightClickAction(action, selectedText, selectionPosition);
  }
}

function handleRightClickTranslate(text, languageCode, languageName, position) {
  chrome.runtime.sendMessage({
    type: "AI_REQUEST",
    action: "translate",
    text: text,
    targetLanguage: languageCode,
    languageName: languageName,
    sourceLanguage: "auto", // Default to auto-detect for right-click
    isRightClick: true,
    position: position,
  });

  showNotification(`Translating to ${languageName}...`, "info");
}

function handleRightClickAction(action, text, position) {
  chrome.runtime.sendMessage({
    type: "AI_REQUEST",
    action: action,
    text: text,
    isRightClick: true,
    position: position,
  });

  showNotification(`Processing ${action}...`, "info");
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
  // Check if any features are enabled
  if (!hasEnabledFeatures()) {
    return; // Don't show button if no features are enabled
  }

  // Remove existing button
  hideContextButton();

  // Create button
  const button = document.createElement("button");
  button.id = "anytext-context-button";

  // Debug the icon URL
  const iconUrl = chrome.runtime.getURL("icons/icon-16.png");
  console.log("Icon URL:", iconUrl);

  // Create image element with error handling
  const img = document.createElement("img");
  img.src = iconUrl;
  img.style.cssText = "width: 16px; height: 16px;";
  img.alt = "AnyText";

  button.appendChild(img);
  button.title = "AI Text Tools";
  button.style.cssText = `
    position: absolute;
    width: 24px;
    height: 24px;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2147483646;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
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
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  // Position button at top-right corner of input
  currentButton.style.left = `${rect.right + scrollX - 30}px`;
  currentButton.style.top = `${rect.top + scrollY + 4}px`;
}

function showContextDropdown(button, input) {
  // Remove existing dropdown
  hideContextDropdown();

  // Safety check - if no features are enabled, don't show dropdown
  if (!hasEnabledFeatures()) {
    return;
  }

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
    {
      id: "translate",
      label: "🌐 Translate",
      description: "Translate text",
      hasSubmenu: true,
    },
    {
      id: "changeTone",
      label: "🎭 Change Tone",
      description: "Adjust writing tone",
      hasSubmenu: true,
    },
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

  // Filter enabled actions first
  const enabledActions = actions.filter(
    (action) => userSettings?.features[action.id]
  );

  enabledActions.forEach((action, index) => {
    const item = document.createElement("div");
    item.style.cssText = `
      padding: 5px 16px;
      cursor: pointer;
      border-bottom: ${
        index < enabledActions.length - 1 ? "1px solid #f0f0f0" : "none"
      };
      transition: background-color 0.2s ease;
      position: relative;
    `;

    const arrow = action.hasSubmenu
      ? '<span style="float: right; color: #666; margin-top: 2px;">▶</span>'
      : "";

    item.innerHTML = `
      <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${action.label}${arrow}</div>
    `;

    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#f8f9fa";

      // Show submenu for translate or change tone
      if (action.hasSubmenu && action.id === "translate") {
        showLanguageSubmenu(item, input);
      } else if (action.hasSubmenu && action.id === "changeTone") {
        showToneSubmenu(item, input);
      } else {
        hideSubmenu();
      }
    });

    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "transparent";

      // Don't hide submenu immediately - give user time to move to submenu
      if (
        action.hasSubmenu &&
        (action.id === "translate" || action.id === "changeTone")
      ) {
        setTimeout(() => {
          // Only hide if mouse is not over the submenu
          if (currentSubmenu && !isMouseOverSubmenu()) {
            hideSubmenu();
          }
        }, 300);
      }
    });

    if (!action.hasSubmenu) {
      item.addEventListener("click", () => {
        handleContextAction(action.id, input);
        hideContextDropdown();
      });
    }

    dropdown.appendChild(item);
  });

  // Position dropdown
  const buttonRect = button.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

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
  hideSubmenu();
}

function showLanguageSubmenu(parentItem, input) {
  hideSubmenu();

  if (!userSettings?.languages?.length) {
    showNotification(
      "No languages configured. Please set up languages in the extension popup.",
      "warning"
    );
    return;
  }

  const submenu = document.createElement("div");
  submenu.id = "anytext-language-submenu";
  submenu.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    z-index: 2147483648;
    min-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    overflow: hidden;
    max-height: 400px;
    overflow-y: auto;
  `;

  // Add header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 12px 16px;
    background: linear-gradient(135deg, #4285f4, #34a853);
    color: white;
    font-size: 14px;
    font-weight: 600;
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>🌐</span>
      <span>Translate</span>
    </div>
  `;
  submenu.appendChild(header);

  // Add "From" language selector
  const fromSection = document.createElement("div");
  fromSection.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #f8f9fa;
  `;

  const fromLabel = document.createElement("div");
  fromLabel.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
  `;
  fromLabel.textContent = "From:";
  fromSection.appendChild(fromLabel);

  const fromDropdown = document.createElement("select");
  fromDropdown.style.cssText = `
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    background: white;
    cursor: pointer;
  `;

  // Add auto-detect option
  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  autoOption.textContent = "🔍 Auto-detect";
  autoOption.selected = true;
  fromDropdown.appendChild(autoOption);

  // Add language options for "from"
  const allLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
  ];

  allLanguages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang.code;
    option.textContent = `${lang.flag} ${lang.name}`;
    fromDropdown.appendChild(option);
  });

  fromSection.appendChild(fromDropdown);
  submenu.appendChild(fromSection);

  // Add "To" language section
  const toSection = document.createElement("div");
  toSection.style.cssText = `
    padding: 12px 16px 8px 16px;
  `;

  const toLabel = document.createElement("div");
  toLabel.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
  `;
  toLabel.textContent = "To:";
  toSection.appendChild(toLabel);
  submenu.appendChild(toSection);

  // Add target language options
  userSettings.languages.forEach((language, index) => {
    const item = document.createElement("div");
    item.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      border-bottom: ${
        index < userSettings.languages.length - 1 ? "1px solid #f0f0f0" : "none"
      };
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 16px;
      border-radius: 4px;
    `;

    item.innerHTML = `
      <span style="font-size: 16px;">${language.flag}</span>
      <span style="font-weight: 500; color: #333;">${language.name}</span>
    `;

    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#f8f9fa";
    });

    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "transparent";
    });

    item.addEventListener("click", () => {
      const fromLanguage = fromDropdown.value;
      handleTranslateAction(language.code, language.name, input, fromLanguage);
      hideContextDropdown();
    });

    submenu.appendChild(item);
  });

  // Position submenu to the right of parent item
  const parentRect = parentItem.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  submenu.style.left = `${parentRect.right + scrollX + 4}px`;
  submenu.style.top = `${parentRect.top + scrollY}px`;

  // Add mouse event handlers to keep submenu open
  submenu.addEventListener("mouseenter", () => {
    // Keep submenu open when mouse enters
  });

  submenu.addEventListener("mouseleave", () => {
    // Hide submenu when mouse leaves
    setTimeout(() => {
      hideSubmenu();
    }, 100);
  });

  document.body.appendChild(submenu);
  currentSubmenu = submenu;
}

function showToneSubmenu(parentItem, input) {
  hideSubmenu();

  const submenu = document.createElement("div");
  submenu.id = "anytext-tone-submenu";
  submenu.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    z-index: 2147483648;
    min-width: 160px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    overflow: hidden;
  `;

  // Add header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 8px 12px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
    font-size: 12px;
    font-weight: 600;
    color: #666;
  `;
  header.textContent = "Select Tone";
  submenu.appendChild(header);

  const tones = [
    {
      id: "professional",
      name: "Professional",
      icon: "💼",
      description: "Formal and business-appropriate",
    },
    {
      id: "casual",
      name: "Casual",
      icon: "😊",
      description: "Relaxed and conversational",
    },
    {
      id: "straightforward",
      name: "Straightforward",
      icon: "📝",
      description: "Direct and to the point",
    },
    {
      id: "confident",
      name: "Confident",
      icon: "💪",
      description: "Assertive and self-assured",
    },
    {
      id: "friendly",
      name: "Friendly",
      icon: "🤝",
      description: "Warm and approachable",
    },
  ];

  tones.forEach((tone, index) => {
    const item = document.createElement("div");
    item.style.cssText = `
      padding: 10px 12px;
      cursor: pointer;
      border-bottom: ${index < tones.length - 1 ? "1px solid #f0f0f0" : "none"};
      transition: background-color 0.2s ease;
    `;

    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
        <span style="font-size: 16px;">${tone.icon}</span>
        <span style="font-weight: 500; color: #333;">${tone.name}</span>
      </div>
      <div style="font-size: 11px; color: #666; margin-left: 24px;">${tone.description}</div>
    `;

    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#f8f9fa";
    });

    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "transparent";
    });

    item.addEventListener("click", () => {
      handleToneChangeAction(tone.id, tone.name, input);
      hideContextDropdown();
    });

    submenu.appendChild(item);
  });

  // Position submenu to the right of parent item
  const parentRect = parentItem.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  submenu.style.left = `${parentRect.right + scrollX + 4}px`;
  submenu.style.top = `${parentRect.top + scrollY}px`;

  // Add mouse event handlers to keep submenu open
  submenu.addEventListener("mouseenter", () => {
    // Keep submenu open when mouse enters
  });

  submenu.addEventListener("mouseleave", () => {
    // Hide submenu when mouse leaves
    setTimeout(() => {
      hideSubmenu();
    }, 100);
  });

  document.body.appendChild(submenu);
  currentSubmenu = submenu;
}

function insertTextAtInput(text, input, replaceAll = false) {
  if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
    const start = input.selectionStart || input.value.length;
    const end = replaceAll ? input.value.length : input.selectionEnd || start;
    const value = input.value;

    input.value = value.substring(0, start) + text + value.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
    input.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (input.contentEditable === "true") {
    if (replaceAll) {
      input.textContent = text;
    } else {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        selection.removeAllRanges();
      } else {
        input.textContent += text;
      }
    }
  }
}

function hideSubmenu() {
  if (currentSubmenu) {
    currentSubmenu.remove();
    currentSubmenu = null;
  }
}

function isMouseOverSubmenu() {
  if (!currentSubmenu) return false;

  // Check if submenu is being hovered
  return currentSubmenu.matches(":hover");
}

function handleOutsideClick(e) {
  const isInsideDropdown =
    currentDropdown && currentDropdown.contains(e.target);
  const isInsideSubmenu = currentSubmenu && currentSubmenu.contains(e.target);
  const isInsideButton = currentButton && currentButton.contains(e.target);

  if (!isInsideDropdown && !isInsideSubmenu && !isInsideButton) {
    hideContextDropdown();
  }
}

function isDropdownOpen() {
  return currentDropdown !== null;
}

function handleTranslateAction(
  languageCode,
  languageName,
  input,
  fromLanguage = "auto"
) {
  const textInfo = getTextFromInput(input);

  if (!textInfo.text) {
    showNotification("No text to translate", "error");
    return;
  }

  // Send message to background script to handle translation
  chrome.runtime.sendMessage({
    type: "AI_REQUEST",
    action: "translate",
    text: textInfo.text,
    targetLanguage: languageCode,
    languageName: languageName,
    sourceLanguage: fromLanguage,
    inputElement: input.tagName,
    isInputField: true,
    isFullText: textInfo.isFullText,
    textStart: textInfo.start,
    textEnd: textInfo.end,
  });

  const fromText =
    fromLanguage === "auto" ? "auto-detected language" : fromLanguage;
  showNotification(
    `Translating from ${fromText} to ${languageName}...`,
    "info"
  );
}

function handleToneChangeAction(toneId, toneName, input) {
  const textInfo = getTextFromInput(input);

  if (!textInfo.text) {
    showNotification("No text to change tone", "error");
    return;
  }

  // Send message to background script to handle tone change
  chrome.runtime.sendMessage({
    type: "AI_REQUEST",
    action: "changeTone",
    text: textInfo.text,
    tone: toneId,
    toneName: toneName,
    inputElement: input.tagName,
    isInputField: true,
    isFullText: textInfo.isFullText,
    textStart: textInfo.start,
    textEnd: textInfo.end,
  });

  showNotification(`Changing tone to ${toneName}...`, "info");
}

function handleContextAction(actionId, input) {
  let textToProcess = "";
  let isFullText = false;
  let textStart = 0;
  let textEnd = 0;

  if (actionId === "generate") {
    // For generate, we can work with empty text or use selected/full text as prompt
    const textInfo = getTextFromInput(input);
    textToProcess = textInfo.text;
    isFullText = textInfo.isFullText;
    textStart = textInfo.start;
    textEnd = textInfo.end;
  } else {
    // For other actions, get text from input (selected or full)
    const textInfo = getTextFromInput(input);
    if (!textInfo.text) {
      showNotification("No text to process", "error");
      return;
    }
    textToProcess = textInfo.text;
    isFullText = textInfo.isFullText;
    textStart = textInfo.start;
    textEnd = textInfo.end;
  }

  // Send message to background script to handle AI processing
  chrome.runtime.sendMessage({
    type: "AI_REQUEST",
    action: actionId,
    text: textToProcess,
    inputElement: input.tagName,
    isInputField: true,
    isFullText: isFullText,
    textStart: textStart,
    textEnd: textEnd,
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

function getTextFromInput(input) {
  if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selectedText = input.value.substring(start, end);

    // If no text is selected, use the entire input value
    if (selectedText.trim().length === 0) {
      return {
        text: input.value.trim(),
        isFullText: true,
        start: 0,
        end: input.value.length,
      };
    } else {
      return {
        text: selectedText,
        isFullText: false,
        start: start,
        end: end,
      };
    }
  } else if (input.contentEditable === "true") {
    const selection = window.getSelection();
    const selectedText = selection.toString();

    // If no text is selected, use the entire content
    if (selectedText.trim().length === 0) {
      return {
        text: input.textContent.trim(),
        isFullText: true,
        start: 0,
        end: input.textContent.length,
      };
    } else {
      return {
        text: selectedText,
        isFullText: false,
        start: null,
        end: null,
      };
    }
  }

  return {
    text: "",
    isFullText: false,
    start: 0,
    end: 0,
  };
}

// === Message Handlers ===
function handleAIResult(message) {
  const {
    action,
    originalText,
    result,
    isRightClick,
    position,
    isInputField,
    isFullText,
    textStart,
    textEnd,
  } = message;

  if (isRightClick) {
    showResultPopover(action, originalText, result, position);
  } else if (
    isInputField &&
    (action === "translate" || action === "proofread" || action === "rewrite")
  ) {
    // For input field actions that should replace text directly
    replaceSelectedText(result, isFullText, textStart, textEnd);
    const actionName =
      action === "translate"
        ? `Translated to ${message.languageName || "target language"}`
        : action === "proofread"
        ? "Proofread completed"
        : "Text rewritten";
    showNotification(`${actionName}!`, "success");
  } else {
    // For other actions or non-input fields, show modal
    showResultModal(action, originalText, result);
  }
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

function showResultPopover(action, originalText, result, position) {
  // Remove existing popover
  const existingPopover = document.getElementById("anytext-popover");
  if (existingPopover) {
    existingPopover.remove();
  }

  const popover = document.createElement("div");
  popover.id = "anytext-popover";

  // Position in bottom-right corner
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popoverWidth = 350;
  const popoverMaxHeight = 400;

  popover.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: ${popoverWidth}px;
    max-height: ${popoverMaxHeight}px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    animation: slideInUp 0.3s ease-out;
  `;

  // Add animation keyframes
  if (!document.getElementById("anytext-popover-styles")) {
    const style = document.createElement("style");
    style.id = "anytext-popover-styles";
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes slideOutDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  popover.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; background: linear-gradient(135deg, #4285f4, #34a853); color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; text-transform: capitalize;">${action} Result</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">AnyText</>
        </div>
        <button id="anytext-popover-close" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
      </div>
    </div>
    <div style="padding: 16px; max-height: 300px; overflow-y: auto;">
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-weight: 600; color: #666; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Original Text</label>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.4; border-left: 3px solid #e0e0e0; max-height: 80px; overflow-y: auto;">${escapeHtml(
          originalText
        )}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-weight: 600; color: #666; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">AI Result</label>
        <div id="anytext-popover-result" style="background: #f0f8ff; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.4; border-left: 3px solid #4285f4; max-height: 120px; overflow-y: auto;">${escapeHtml(
          result
        )}</div>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="anytext-popover-copy" style="background: #f8f9fa; color: #333; border: 1px solid #e0e0e0; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;">Copy</button>
        <button id="anytext-popover-insert" style="background: #4285f4; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;">Insert</button>
      </div>
    </div>
  `;

  document.body.appendChild(popover);

  // Event handlers
  const closeBtn = popover.querySelector("#anytext-popover-close");
  const copyBtn = popover.querySelector("#anytext-popover-copy");
  const insertBtn = popover.querySelector("#anytext-popover-insert");

  closeBtn.addEventListener("click", () => {
    popover.style.animation = "slideOutDown 0.3s ease-in";
    setTimeout(() => popover.remove(), 300);
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(result);
    copyBtn.textContent = "Copied!";
    copyBtn.style.background = "#34a853";
    copyBtn.style.color = "white";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.style.background = "#f8f9fa";
      copyBtn.style.color = "#333";
    }, 2000);
  });

  insertBtn.addEventListener("click", () => {
    insertTextAtCursor(result, position);
    popover.style.animation = "slideOutDown 0.3s ease-in";
    setTimeout(() => popover.remove(), 300);
    showNotification("Text inserted!", "success");
  });

  // Auto-close after 30 seconds
  setTimeout(() => {
    if (document.body.contains(popover)) {
      popover.style.animation = "slideOutDown 0.3s ease-in";
      setTimeout(() => popover.remove(), 300);
    }
  }, 30000);

  // Close on click outside
  setTimeout(() => {
    const handleOutsideClick = (e) => {
      if (!popover.contains(e.target)) {
        popover.style.animation = "slideOutDown 0.3s ease-in";
        setTimeout(() => popover.remove(), 300);
        document.removeEventListener("click", handleOutsideClick);
      }
    };
    document.addEventListener("click", handleOutsideClick);
  }, 100);
}

function insertTextAtCursor(text, position) {
  if (position && position.range) {
    try {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(position.range);

      // Try to replace the selected text
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        selection.removeAllRanges();
      }
    } catch (error) {
      // Fallback: just copy to clipboard
      navigator.clipboard.writeText(text);
      showNotification(
        "Text copied to clipboard (couldn't insert directly)",
        "info"
      );
    }
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text);
    showNotification("Text copied to clipboard", "info");
  }
}

// === Helpers ===
function replaceSelectedText(
  newText,
  isFullText = false,
  textStart = null,
  textEnd = null
) {
  // Try to use the current active input first
  if (
    currentActiveInput &&
    (currentActiveInput.tagName === "INPUT" ||
      currentActiveInput.tagName === "TEXTAREA")
  ) {
    let start, end;
    if (isFullText || (textStart !== null && textEnd !== null)) {
      // Replace specific range or full text
      start = textStart !== null ? textStart : 0;
      end = textEnd !== null ? textEnd : currentActiveInput.value.length;
    } else {
      // Use current selection
      start = currentActiveInput.selectionStart || 0;
      end = currentActiveInput.selectionEnd || 0;
    }

    const value = currentActiveInput.value;
    currentActiveInput.value =
      value.substring(0, start) + newText + value.substring(end);
    currentActiveInput.selectionStart = currentActiveInput.selectionEnd =
      start + newText.length;
    currentActiveInput.focus();
    currentActiveInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // Fallback to document.activeElement
  const activeElement = document.activeElement;
  if (
    activeElement &&
    (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")
  ) {
    let start, end;
    if (isFullText || (textStart !== null && textEnd !== null)) {
      start = textStart !== null ? textStart : 0;
      end = textEnd !== null ? textEnd : activeElement.value.length;
    } else {
      start = activeElement.selectionStart || 0;
      end = activeElement.selectionEnd || 0;
    }

    const value = activeElement.value;
    activeElement.value =
      value.substring(0, start) + newText + value.substring(end);
    activeElement.selectionStart = activeElement.selectionEnd =
      start + newText.length;
    activeElement.focus();
    activeElement.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (
    currentActiveInput &&
    currentActiveInput.contentEditable === "true"
  ) {
    // Handle contenteditable elements
    if (isFullText) {
      currentActiveInput.textContent = newText;
    } else {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(newText));
        selection.removeAllRanges();
      }
    }
  } else {
    // General fallback for any selected text
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
