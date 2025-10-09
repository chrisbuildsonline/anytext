// AI Input Enhancer - Background Script
console.log("AI Input Enhancer background loaded");

let userSettings = null;
let hasSelection = false;

// Load user settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['aiInputEnhancerSettings']);
    userSettings = result.aiInputEnhancerSettings || {
      features: {
        translate: true,
        proofread: true,
        rewrite: true,
        summarize: true,
        generate: true
      },
      languages: [
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷' },
        { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
      ]
    };
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function createContextMenus() {
  await loadSettings();
  
  // Remove old menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    console.log("Creating context menus...");

    // Only show menu when text is selected
    if (!hasSelection) return;

    // Parent menu
    chrome.contextMenus.create({
      id: "ai-input-analyzer",
      title: "✨ AI Input Analyzer",
      contexts: ["selection"],
      documentUrlPatterns: ["<all_urls>"]
    });

    // Add enabled features
    if (userSettings?.features?.translate) {
      // Translation parent
      chrome.contextMenus.create({
        id: "ai-translate-parent",
        parentId: "ai-input-analyzer",
        title: "🌐 Translate to...",
        contexts: ["selection"]
      });

      // Add language options
      if (userSettings.languages?.length) {
        userSettings.languages.forEach(language => {
          chrome.contextMenus.create({
            id: `ai-translate-${language.code}`,
            parentId: "ai-translate-parent",
            title: `${language.flag} ${language.name}`,
            contexts: ["selection"]
          });
        });
      }
    }

    if (userSettings?.features?.proofread) {
      chrome.contextMenus.create({
        id: "ai-proofread",
        parentId: "ai-input-analyzer",
        title: "✏️ Proofread",
        contexts: ["selection"]
      });
    }

    if (userSettings?.features?.rewrite) {
      chrome.contextMenus.create({
        id: "ai-rewrite",
        parentId: "ai-input-analyzer",
        title: "📝 Rewrite",
        contexts: ["selection"]
      });
    }

    if (userSettings?.features?.summarize) {
      chrome.contextMenus.create({
        id: "ai-summarize",
        parentId: "ai-input-analyzer",
        title: "📄 Summarize",
        contexts: ["selection"]
      });
    }

    // Separator
    chrome.contextMenus.create({
      id: "separator",
      parentId: "ai-input-analyzer",
      type: "separator",
      contexts: ["selection"]
    });

    // Settings link
    chrome.contextMenus.create({
      id: "ai-settings",
      parentId: "ai-input-analyzer",
      title: "⚙️ Settings",
      contexts: ["selection"]
    });
  });
}

// Initialize
chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SELECTION_CHANGED':
      hasSelection = message.hasSelection;
      createContextMenus();
      break;
      
    case 'AI_REQUEST':
      handleAIRequest(message, sender.tab.id);
      break;
      
    default:
      break;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText || "";
  const menuItemId = info.menuItemId;

  console.log("Context menu clicked:", menuItemId, "Text:", selectedText);

  if (menuItemId === 'ai-settings') {
    // Open extension popup/options
    chrome.action.openPopup();
    return;
  }

  // Handle translation with specific language
  if (menuItemId.startsWith('ai-translate-')) {
    const languageCode = menuItemId.replace('ai-translate-', '');
    const language = userSettings?.languages?.find(l => l.code === languageCode);
    
    if (language) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CONTEXT_MENU_ACTION',
        action: 'translate',
        targetLanguage: languageCode,
        languageName: language.name
      });
    }
    return;
  }

  // Handle other actions
  const actionMap = {
    'ai-proofread': 'proofread',
    'ai-rewrite': 'rewrite',
    'ai-summarize': 'summarize'
  };

  const action = actionMap[menuItemId];
  if (action) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_ACTION',
      action: action
    });
  }
});

// Handle AI processing requests
async function handleAIRequest(message, tabId) {
  const { action, text, targetLanguage, languageName, isRightClick, position } = message;
  
  // Simulate AI processing with fake results for now
  // In a real implementation, this would call the Chrome Built-in AI APIs
  
  let result;
  switch (action) {
    case 'translate':
      result = `[TRANSLATED TO ${languageName?.toUpperCase() || 'TARGET LANGUAGE'}] ${text}`;
      break;
    case 'proofread':
      result = `[PROOFREAD] ${text.replace(/\b(teh|recieve|seperate)\b/g, match => {
        const corrections = { 'teh': 'the', 'recieve': 'receive', 'seperate': 'separate' };
        return corrections[match] || match;
      })}`;
      break;
    case 'rewrite':
      result = `[REWRITTEN] ${text.split(' ').reverse().join(' ')}`;
      break;
    case 'summarize':
      const words = text.split(' ');
      result = `[SUMMARY] ${words.slice(0, Math.max(3, Math.floor(words.length / 3))).join(' ')}...`;
      break;
    case 'generate':
      result = `[GENERATED] Here is some generated content based on: "${text}"`;
      break;
    default:
      result = `[PROCESSED] ${text}`;
  }

  // Send result back to content script
  setTimeout(() => {
    chrome.tabs.sendMessage(tabId, {
      type: 'AI_RESULT',
      action: action,
      originalText: text,
      result: result,
      isRightClick: isRightClick,
      position: position
    });
  }, 1000); // Simulate processing delay
}
