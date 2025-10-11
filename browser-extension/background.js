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
        changeTone: true,
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
      title: "AnyText",
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
  const { action, text, targetLanguage, languageName, isRightClick, position, isInputField } = message;
  
  let result;
  
  try {
    switch (action) {
      case 'translate':
        result = await performTranslation(text, targetLanguage, languageName);
        break;
      case 'changeTone':
        result = await performToneChange(text, message.tone, message.toneName);
        break;
      case 'proofread':
        result = await performProofreading(text);
        break;
      case 'rewrite':
        result = await performRewriting(text);
        break;
      case 'summarize':
        result = await performSummarization(text);
        break;
      case 'generate':
        result = await performGeneration(text);
        break;
      default:
        result = `[PROCESSED] ${text}`;
    }
  } catch (error) {
    console.error('AI processing error:', error);
    chrome.tabs.sendMessage(tabId, {
      type: 'AI_ERROR',
      action: action,
      error: error.message || 'Processing failed'
    });
    return;
  }

  // Send result back to content script
  chrome.tabs.sendMessage(tabId, {
    type: 'AI_RESULT',
    action: action,
    originalText: text,
    result: result,
    isRightClick: isRightClick,
    position: position,
    isInputField: isInputField,
    isFullText: message.isFullText,
    textStart: message.textStart,
    textEnd: message.textEnd,
    languageName: languageName,
    tone: message.tone,
    toneName: message.toneName
  });
}

// AI Processing Functions
async function performTranslation(text, targetLanguage, languageName) {
  try {
    // Check if Translator API is available
    if (typeof Translator === 'undefined') {
      throw new Error('Translation API not available');
    }

    const availability = await Translator.availability();
    if (availability === 'no') {
      throw new Error('Translation not available');
    }

    // Create translator session
    const translator = await Translator.create({
      sourceLanguage: 'en', // Auto-detect would be better
      targetLanguage: targetLanguage
    });

    // Perform translation
    const translatedText = await translator.translate(text);
    return translatedText;
    
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to a simple mock translation for demo
    return `[Translated to ${languageName}] ${text}`;
  }
}

async function performProofreading(text) {
  try {
    if (typeof Proofreader === 'undefined') {
      throw new Error('Proofreader API not available');
    }

    const availability = await Proofreader.availability();
    if (availability === 'no') {
      throw new Error('Proofreader not available');
    }

    const proofreader = await Proofreader.create({
      language: 'en'
    });

    const correctedText = await proofreader.proofread(text);
    return correctedText;
    
  } catch (error) {
    console.error('Proofreading error:', error);
    // Simple fallback corrections
    return text.replace(/\b(teh|recieve|seperate|there|their|they're)\b/gi, match => {
      const corrections = { 
        'teh': 'the', 'recieve': 'receive', 'seperate': 'separate',
        'there': 'their', 'their': 'there' // This is overly simple, just for demo
      };
      return corrections[match.toLowerCase()] || match;
    });
  }
}

async function performRewriting(text) {
  try {
    if (typeof Rewriter === 'undefined') {
      throw new Error('Rewriter API not available');
    }

    const availability = await Rewriter.availability();
    if (availability === 'no') {
      throw new Error('Rewriter not available');
    }

    const rewriter = await Rewriter.create({
      tone: 'more-formal',
      length: 'as-is'
    });

    const rewrittenText = await rewriter.rewrite(text);
    return rewrittenText;
    
  } catch (error) {
    console.error('Rewriting error:', error);
    // Simple fallback - make text more formal
    return text.replace(/\bcan't\b/g, 'cannot')
              .replace(/\bwon't\b/g, 'will not')
              .replace(/\bdon't\b/g, 'do not')
              .replace(/\bisn't\b/g, 'is not');
  }
}

async function performSummarization(text) {
  try {
    if (typeof Summarizer === 'undefined') {
      throw new Error('Summarizer API not available');
    }

    const availability = await Summarizer.availability();
    if (availability === 'no') {
      throw new Error('Summarizer not available');
    }

    const summarizer = await Summarizer.create({
      type: 'key-points',
      format: 'plain-text',
      length: 'short'
    });

    const summary = await summarizer.summarize(text);
    return summary;
    
  } catch (error) {
    console.error('Summarization error:', error);
    // Simple fallback - take first few sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, Math.max(1, Math.floor(sentences.length / 3))).join('. ');
    return summary + (summary.endsWith('.') ? '' : '.');
  }
}

async function performToneChange(text, tone, toneName) {
  try {
    if (typeof Rewriter === 'undefined') {
      throw new Error('Rewriter API not available');
    }

    const availability = await Rewriter.availability();
    if (availability === 'no') {
      throw new Error('Rewriter not available');
    }

    // Map our tone names to Rewriter API tones
    const toneMapping = {
      'professional': 'more-formal',
      'casual': 'more-casual', 
      'straightforward': 'as-is',
      'confident': 'more-formal',
      'friendly': 'more-casual'
    };

    const rewriter = await Rewriter.create({
      tone: toneMapping[tone] || 'as-is',
      length: 'as-is'
    });

    let rewrittenText = await rewriter.rewrite(text);
    
    // Apply additional tone-specific adjustments
    rewrittenText = applyToneAdjustments(rewrittenText, tone);
    
    return rewrittenText;
    
  } catch (error) {
    console.error('Tone change error:', error);
    // Fallback tone transformations
    return applyToneAdjustments(text, tone);
  }
}

function applyToneAdjustments(text, tone) {
  switch (tone) {
    case 'professional':
      return text
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/\bdon't\b/gi, 'do not')
        .replace(/\bisn't\b/gi, 'is not')
        .replace(/\bI think\b/gi, 'I believe')
        .replace(/\bkinda\b/gi, 'somewhat')
        .replace(/\bgonna\b/gi, 'going to');
        
    case 'casual':
      return text
        .replace(/\bcannot\b/gi, "can't")
        .replace(/\bwill not\b/gi, "won't")
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bis not\b/gi, "isn't")
        .replace(/\bI believe\b/gi, 'I think')
        .replace(/\bgoing to\b/gi, 'gonna');
        
    case 'straightforward':
      return text
        .replace(/\bI think that maybe\b/gi, 'I think')
        .replace(/\bperhaps\b/gi, '')
        .replace(/\bmight be able to\b/gi, 'can')
        .replace(/\bwould like to\b/gi, 'want to');
        
    case 'confident':
      return text
        .replace(/\bI think\b/gi, 'I know')
        .replace(/\bmight\b/gi, 'will')
        .replace(/\bcould\b/gi, 'can')
        .replace(/\bmaybe\b/gi, 'definitely')
        .replace(/\bprobably\b/gi, 'certainly');
        
    case 'friendly':
      return text
        .replace(/\bHello\b/gi, 'Hi there')
        .replace(/\bThank you\b/gi, 'Thanks so much')
        .replace(/\bRegards\b/gi, 'Best wishes')
        .replace(/\.$/, '! 😊');
        
    default:
      return text;
  }
}

async function performGeneration(text) {
  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('Language Model API not available');
    }

    const availability = await LanguageModel.availability();
    if (availability === 'no') {
      throw new Error('Language Model not available');
    }

    const session = await LanguageModel.create({
      systemPrompt: 'You are a helpful writing assistant.',
      language: 'en'
    });

    const prompt = `Generate content based on this prompt: "${text}"`;
    const generatedText = await session.prompt(prompt);
    return generatedText;
    
  } catch (error) {
    console.error('Generation error:', error);
    // Simple fallback
    return `Here is some generated content based on your prompt: "${text}". This would be expanded with AI-generated text in a real implementation.`;
  }
}
