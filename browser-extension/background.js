// background.js
console.log("AI Input Enhancer background loaded");

function createMenus() {
  // Remove old menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    console.log("Creating context menus...");

    // Parent
    chrome.contextMenus.create({
      id: "ai-input-enhancer",
      title: "AI Input Enhancer",
      contexts: ["all"], // show everywhere for now (debug)
    });

    // Submenus
    chrome.contextMenus.create({
      id: "ai-rewrite",
      parentId: "ai-input-enhancer",
      title: "Rewrite",
      contexts: ["selection", "editable"],
    });

    chrome.contextMenus.create({
      id: "ai-translate",
      parentId: "ai-input-enhancer",
      title: "Translate",
      contexts: ["selection", "editable"],
    });

    chrome.contextMenus.create({
      id: "ai-summarize",
      parentId: "ai-input-enhancer",
      title: "Summarize",
      contexts: ["selection", "editable"],
    });
  });
}

// Run on install, startup, and immediately on load
chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);
createMenus();

// Handle menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText || "";
  const action = info.menuItemId;

  console.log("Menu clicked:", action, "Text:", selectedText);

  // Fake AI result for now
  const fakeResult = `[${action.toUpperCase()}] ${selectedText}`;

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    type: "AI_RESULT",
    action,
    originalText: selectedText,
    result: fakeResult,
  });
});
