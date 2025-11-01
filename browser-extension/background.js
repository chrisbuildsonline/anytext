// AI Input Enhancer - Background Script

// Import AI Service Manager (ES module style)
// Note: We'll inline the AIServiceManager class since ES modules in service workers have limitations

/**
 * AI Service Manager - Inlined for Service Worker compatibility
 * Handles Chrome Built-in AI API detection, initialization, and management
 */
class AIServiceManager {
  constructor() {
    this.isInitialized = false;
    this.apiAvailable = false;
    this.services = {
      languageModel: null,
    };
    this.initializationPromise = null;
  }

  /**
   * Check if Chrome Built-in AI APIs are available
   * @returns {boolean} True if AI APIs are available
   */
  checkAPIAvailability() {
    try {
      // Check for LanguageModel (works in both window and service worker contexts)
      const hasLanguageModel = typeof LanguageModel !== "undefined";
      this.apiAvailable = hasLanguageModel;
      return hasLanguageModel;
    } catch (error) {
      this.apiAvailable = false;
      return false;
    }
  }

  /**
   * Initialize all Chrome Built-in AI APIs
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initializeAPIs() {
    // Return existing promise if initialization is already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  /**
   * Internal method to perform the actual initialization
   * @private
   */
  async _performInitialization() {
    try {
      // Check API availability first
      if (!this.checkAPIAvailability()) {
        this.initializationPromise = null; // Reset promise on failure
        return false;
      }

      // Initialize LanguageModel (direct global)
      try {
        if (typeof LanguageModel === "undefined") {
          throw new Error("LanguageModel is not available");
        }

        // Check if the model is available before trying to create it
        try {
          const availability = await LanguageModel.availability();

          if (availability === "no") {
            throw new Error(
              "LanguageModel not available - download Gemini Nano model"
            );
          }
        } catch (availError) {
          // Continue anyway, as availability check might fail but creation might work
        }
        this.services.languageModel = await LanguageModel.create({
          systemPrompt: "You are a helpful AI assistant for text enhancement.",
          language: "en",
        });
        this.isInitialized = true;
      } catch (error) {
        // Check for specific error types
        if (
          error.name === "NotAllowedError" &&
          error.message.includes("crashed too many times")
        ) {
          // Chrome AI model has crashed too many times and is disabled for this version
        } else if (error.name === "NotSupportedError") {
          // Chrome Built-in AI is not supported in this browser version
        }

        this.isInitialized = false;
        this.initializationPromise = null; // Reset promise on failure
      }

      return this.isInitialized;
    } catch (error) {
      this.isInitialized = false;
      this.initializationPromise = null; // Reset promise on failure
      return false;
    }
  }

  /**
   * Get the status of AI API availability and initialization
   * @returns {Object} Status object with availability and initialization info
   */
  getStatus() {
    return {
      apiAvailable: this.apiAvailable,
      isInitialized: this.isInitialized,
      services: Object.keys(this.services).reduce((status, serviceName) => {
        status[serviceName] = this.services[serviceName] !== null;
        return status;
      }, {}),
    };
  }

  /**
   * Get a specific AI service
   * @param {string} serviceName - Name of the service (translator, proofreader, etc.)
   * @returns {Object|null} The AI service instance or null if not available
   */
  getService(serviceName) {
    if (!this.isInitialized) {
      return null;
    }

    if (!this.services.hasOwnProperty(serviceName)) {
      return null;
    }

    return this.services[serviceName];
  }

  /**
   * Check if a specific service is available
   * @param {string} serviceName - Name of the service to check
   * @returns {boolean} True if the service is available and initialized
   */
  isServiceAvailable(serviceName) {
    return this.isInitialized && this.services[serviceName] !== null;
  }

  /**
   * Use LanguageModel for various AI tasks
   * @param {string} prompt - The prompt to send to the AI
   * @returns {Promise<string>} The AI response
   */
  async useLanguageModel(prompt) {
    if (!this.isServiceAvailable("languageModel")) {
      throw new Error("LanguageModel service is not available");
    }

    try {
      const session = this.services.languageModel;
      const response = await session.prompt(prompt);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper methods for common AI tasks using LanguageModel
   */
  async proofread(text) {
    const prompt = `Please proofread and correct any grammar, spelling, or punctuation errors in the following text. Return only the corrected text without explanations:\n\n${text}`;
    return await this.useLanguageModel(prompt);
  }

  async rewrite(text, style = "improve") {
    const stylePrompts = {
      formal: "Rewrite the following text in a formal, professional tone. Return only the rewritten text without any markdown formatting, bullet points, or explanations:",
      casual: "Rewrite the following text in a casual, friendly tone. Return only the rewritten text without any markdown formatting, bullet points, or explanations:",
      concise:
        "Rewrite the following text to be more concise while preserving meaning. Return only the rewritten text without any markdown formatting, bullet points, or explanations:",
      improve: "Improve the following text for clarity and readability. Return only the rewritten text without any markdown formatting, bullet points, or explanations:",
    };

    const prompt = `${stylePrompts[style] || stylePrompts.improve}\n\n${text}`;
    return await this.useLanguageModel(prompt);
  }

  async summarize(text, length = "medium") {
    const lengthPrompts = {
      short: "Provide a brief summary in 1-2 sentences:",
      medium: "Provide a concise summary in 3-4 sentences:",
      long: "Provide a detailed summary:",
    };

    const prompt = `${
      lengthPrompts[length] || lengthPrompts.medium
    }\n\n${text}`;
    return await this.useLanguageModel(prompt);
  }

  async translate(text, targetLanguage) {
    const prompt = `Translate the following text to ${targetLanguage}. Return only the translation:\n\n${text}`;
    const result = await this.useLanguageModel(prompt);
    return result;
  }



  /**
   * Reinitialize APIs (useful for retrying after browser updates)
   * @returns {Promise<boolean>} True if reinitialization was successful
   */
  async reinitialize() {
    this.isInitialized = false;
    this.initializationPromise = null;

    // Reset all services
    Object.keys(this.services).forEach((serviceName) => {
      this.services[serviceName] = null;
    });

    return await this.initializeAPIs();
  }
}

// Test LanguageModel availability in service worker context
if (typeof LanguageModel !== "undefined") {
  // Test availability check
  LanguageModel.availability()
    .then((availability) => {
      // LanguageModel is available
    })
    .catch((error) => {
      // LanguageModel availability check failed
    });
}

let userSettings = null;
let hasSelection = false;

// Load user settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(["aiInputEnhancerSettings"]);
    userSettings = result.aiInputEnhancerSettings || {
      features: {
        translate: true,
        changeTone: true,
        proofread: true,
        rewrite: true,
        summarize: true,
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
  }
}

async function createContextMenus() {
  await loadSettings();

  // Remove old menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Only show menu when text is selected
    if (!hasSelection) return;

    // Parent menu
    chrome.contextMenus.create({
      id: "ai-input-analyzer",
      title: "AnyText",
      contexts: ["selection"],
      documentUrlPatterns: ["<all_urls>"],
    });

    // Add enabled features
    if (userSettings?.features?.translate) {
      // Translation parent
      chrome.contextMenus.create({
        id: "ai-translate-parent",
        parentId: "ai-input-analyzer",
        title: "Translate to...",
        contexts: ["selection"],
      });

      // Add language options
      if (userSettings.languages?.length) {

        userSettings.languages.forEach((language) => {
          chrome.contextMenus.create({
            id: `ai-translate-${language.code}`,
            parentId: "ai-translate-parent",
            title: `${language.flag} ${language.name}`,
            contexts: ["selection"],
          });
        });
      } else {

      }
    }

    if (userSettings?.features?.proofread) {
      chrome.contextMenus.create({
        id: "ai-proofread",
        parentId: "ai-input-analyzer",
        title: "Proofread",
        contexts: ["selection"],
      });
    }

    if (userSettings?.features?.rewrite) {
      chrome.contextMenus.create({
        id: "ai-rewrite",
        parentId: "ai-input-analyzer",
        title: "Rewrite",
        contexts: ["selection"],
      });
    }

    if (userSettings?.features?.changeTone) {
      // Change Tone parent menu
      chrome.contextMenus.create({
        id: "ai-change-tone-parent",
        parentId: "ai-input-analyzer",
        title: "Change Tone...",
        contexts: ["selection"],
      });

      // Add tone options
      const toneOptions = [
        { id: "professional", name: "Professional" },
        { id: "casual", name: "Casual" },
        { id: "confident", name: "Confident" },
        { id: "straightforward", name: "Straightforward" }
      ];

      toneOptions.forEach((tone) => {
        chrome.contextMenus.create({
          id: `ai-change-tone-${tone.id}`,
          parentId: "ai-change-tone-parent",
          title: tone.name,
          contexts: ["selection"],
        });
      });
    }

    if (userSettings?.features?.summarize) {
      chrome.contextMenus.create({
        id: "ai-summarize",
        parentId: "ai-input-analyzer",
        title: "Summarize",
        contexts: ["selection"],
      });
    }

    // Separator
    chrome.contextMenus.create({
      id: "separator",
      parentId: "ai-input-analyzer",
      type: "separator",
      contexts: ["selection"],
    });

    // Settings link
    chrome.contextMenus.create({
      id: "ai-settings",
      parentId: "ai-input-analyzer",
      title: "Settings",
      contexts: ["selection"],
    });
  });
}

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  await createContextMenus();
  // Initialize AI service manager early
  await initializeAI();
});
chrome.runtime.onStartup.addListener(async () => {
  await createContextMenus();
  // Initialize AI service manager early
  await initializeAI();
});

// Listen for settings changes and update context menus
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.aiInputEnhancerSettings) {
    // Settings changed, update context menus
    createContextMenus();
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "SELECTION_CHANGED":
      hasSelection = message.hasSelection;
      createContextMenus();
      break;

    case "AI_REQUEST":
      handleAIRequest(message, sender.tab.id);
      break;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText || "";
  const menuItemId = info.menuItemId;

  if (menuItemId === "ai-settings") {
    // Open extension popup/options
    chrome.action.openPopup();
    return;
  }

  // Handle translation with specific language
  if (menuItemId.startsWith("ai-translate-")) {
    const languageCode = menuItemId.replace("ai-translate-", "");
    const language = userSettings?.languages?.find(
      (l) => l.code === languageCode
    );

    if (language) {
      chrome.tabs.sendMessage(tab.id, {
        type: "CONTEXT_MENU_ACTION",
        action: "translate",
        targetLanguage: languageCode,
        languageName: language.name,
      });
    }
    return;
  }

  // Handle tone change actions
  if (menuItemId.startsWith("ai-change-tone-")) {
    const toneId = menuItemId.replace("ai-change-tone-", "");
    const toneNames = {
      professional: "Professional",
      casual: "Casual", 
      confident: "Confident",
      straightforward: "Straightforward"
    };

    chrome.tabs.sendMessage(tab.id, {
      type: "CONTEXT_MENU_ACTION",
      action: "changeTone",
      tone: toneId,
      toneName: toneNames[toneId]
    });
    return;
  }

  // Handle other actions
  const actionMap = {
    "ai-proofread": "proofread",
    "ai-rewrite": "rewrite",
    "ai-summarize": "summarize",
  };

  const action = actionMap[menuItemId];
  if (action) {
    chrome.tabs.sendMessage(tab.id, {
      type: "CONTEXT_MENU_ACTION",
      action: action,
    });
  }
});

// Handle AI processing requests
async function handleAIRequest(message, tabId) {
  const {
    action,
    text,
    targetLanguage,
    languageName,
    isRightClick,
    position,
    isInputField,
  } = message;

  let result;

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("AI processing timeout"));
      }, 10000); // 10 second timeout
    });

    const processingPromise = (async () => {
      switch (action) {
        case "translate":
          return await performTranslation(text, targetLanguage, languageName);
        case "changeTone":
          return await performToneChange(text, message.tone, message.toneName);
        case "proofread":
          return await performProofreading(text);
        case "rewrite":
          return await performRewriting(text);
        case "summarize":
          return await performSummarization(text);
        default:
          return `[PROCESSED] ${text}`;
      }
    })();

    result = await Promise.race([processingPromise, timeoutPromise]);
  } catch (error) {
    // Provide fallback results instead of sending error
    switch (action) {
      case "translate":
        result = await getFallbackTranslation(
          text,
          targetLanguage,
          languageName
        );
        break;
      case "changeTone":
        result = getFallbackToneChange(text, message.tone);
        break;
      case "proofread":
        result = getFallbackProofreading(text);
        break;
      case "rewrite":
        result = getFallbackRewriting(text);
        break;
      case "summarize":
        result = getFallbackSummarization(text);
        break;
      default:
        result = `AI processing failed. ${text}`;
    }
  }

  // Send result back to content script
  try {
    chrome.tabs.sendMessage(tabId, {
      type: "AI_RESULT",
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
      toneName: message.toneName,
    });
  } catch (error) {
    // Failed to send AI_RESULT message
  }
}

// Initialize AI Service Manager
let aiServiceManager = null;
let aiPermanentlyDisabled = false;

async function initializeAI() {
  if (!aiServiceManager) {
    aiServiceManager = new AIServiceManager();
  }

  try {
    // Add timeout to AI initialization
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("AI initialization timeout"));
      }, 5000); // 5 second timeout
    });

    const initPromise = aiServiceManager.initializeAPIs();
    const initialized = await Promise.race([initPromise, timeoutPromise]);

    return initialized;
  } catch (error) {
    // Reset the service manager's promise on timeout/error so next call can retry
    if (aiServiceManager) {
      aiServiceManager.initializationPromise = null;
    }
    return false;
  }
}

// AI Processing Functions
async function performTranslation(text, targetLanguage, languageName) {
  try {
    // Check if AI is permanently disabled
    if (aiPermanentlyDisabled) {
      throw new Error("AI permanently disabled - using fallback");
    }

    // Initialize AI if not already done (with retry)
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      let initialized = await initializeAI();
      
      // If first attempt fails, try once more after a short delay
      if (!initialized) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        initialized = await initializeAI();
        
        if (!initialized) {
          throw new Error("AI services not available - using fallback");
        }
      }
    }

    // Use the AI service manager for translation with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Translation timeout"));
      }, 8000);
    });

    const translationPromise = aiServiceManager.translate(text, languageName);
    const translatedText = await Promise.race([
      translationPromise,
      timeoutPromise,
    ]);
    return translatedText;
  } catch (error) {
    // Provide a more helpful fallback
    const fallbackResult = await getFallbackTranslation(
      text,
      targetLanguage,
      languageName
    );
    return fallbackResult;
  }
}

async function getFallbackTranslation(text, targetLanguage, languageName) {
  // Show notification about AI unavailability and return original text
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SHOW_NOTIFICATION",
        message: `AI translation to ${languageName} unavailable. Try again.`,
        notificationType: "warning",
      });
    }
  });
  return text;
}

async function performProofreading(text) {
  try {
    // Initialize AI if not already done (with retry)
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      let initialized = await initializeAI();
      
      // If first attempt fails, try once more after a short delay
      if (!initialized) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        initialized = await initializeAI();
        
        if (!initialized) {
          throw new Error("AI services not available");
        }
      }
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Proofreading timeout")), 8000);
    });

    const proofreadPromise = aiServiceManager.proofread(text);
    const correctedText = await Promise.race([
      proofreadPromise,
      timeoutPromise,
    ]);
    return correctedText;
  } catch (error) {
    // Enhanced fallback corrections
    return getFallbackProofreading(text);
  }
}

function getFallbackProofreading(text) {
  // Show notification about AI unavailability and return original text
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SHOW_NOTIFICATION",
        message:
          "AI proofreading unavailable. Try again.",
        notificationType: "warning",
      });
    }
  });
  return text;
}

async function performRewriting(text) {
  try {
    // Initialize AI if not already done (with retry)
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      let initialized = await initializeAI();
      
      // If first attempt fails, try once more after a short delay
      if (!initialized) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        initialized = await initializeAI();
        
        if (!initialized) {
          throw new Error("AI services not available");
        }
      }
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Rewriting timeout")), 8000);
    });

    const rewritePromise = aiServiceManager.rewrite(text, "improve");
    const rewrittenText = await Promise.race([rewritePromise, timeoutPromise]);
    return rewrittenText;
  } catch (error) {
    // Enhanced fallback rewriting
    return getFallbackRewriting(text);
  }
}

function getFallbackRewriting(text) {
  // Show notification about AI unavailability and return original text
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SHOW_NOTIFICATION",
        message:
          "AI rewriting unavailable. Try again.",
        notificationType: "warning",
      });
    }
  });
  return text;
}

async function performSummarization(text) {
  try {
    // Initialize AI if not already done (with retry)
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      let initialized = await initializeAI();
      
      // If first attempt fails, try once more after a short delay
      if (!initialized) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        initialized = await initializeAI();
        
        if (!initialized) {
          throw new Error("AI services not available");
        }
      }
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Summarization timeout")), 8000);
    });

    const summarizePromise = aiServiceManager.summarize(text, "medium");
    const summary = await Promise.race([summarizePromise, timeoutPromise]);
    return summary;
  } catch (error) {
    // Enhanced fallback summarization
    return getFallbackSummarization(text);
  }
}

function getFallbackSummarization(text) {
  // Show notification about AI unavailability and return original text
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SHOW_NOTIFICATION",
        message:
          "AI summarization unavailable. Try again.",
        notificationType: "warning",
      });
    }
  });
  return text;
}

async function performToneChange(text, tone, toneName) {
  try {
    // Initialize AI if not already done (with retry)
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      let initialized = await initializeAI();
      
      // If first attempt fails, try once more after a short delay
      if (!initialized) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        initialized = await initializeAI();
        
        if (!initialized) {
          throw new Error("AI services not available");
        }
      }
    }

    // Create a specific prompt for tone change
    const tonePrompts = {
      professional:
        "Rewrite the following text in a professional, formal tone suitable for business communication. Return ONLY the rewritten text without any markdown formatting, asterisks, bullet points, bold text, or explanations:",
      casual:
        "Rewrite the following text in a casual, friendly, conversational tone. Return ONLY the rewritten text without any markdown formatting, asterisks, bullet points, bold text, or explanations:",
      straightforward:
        "Rewrite the following text to be direct, clear, and straightforward. Return ONLY the rewritten text without any markdown formatting, asterisks, bullet points, bold text, or explanations:",
      confident:
        "Rewrite the following text in a confident, assertive tone. Return ONLY the rewritten text without any markdown formatting, asterisks, bullet points, bold text, or explanations:",
      friendly:
        "Rewrite the following text in a warm, friendly, and approachable tone. Return ONLY the rewritten text without any markdown formatting, asterisks, bullet points, bold text, or explanations:",
    };

    const prompt = `${
      tonePrompts[tone] || tonePrompts.professional
    }\n\n${text}`;

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Tone change timeout")), 8000);
    });

    const tonePromise = aiServiceManager.useLanguageModel(prompt);
    const rewrittenText = await Promise.race([tonePromise, timeoutPromise]);

    return rewrittenText;
  } catch (error) {
    // Enhanced fallback tone transformations
    return getFallbackToneChange(text, tone);
  }
}

function getFallbackToneChange(text, tone) {
  // Show notification about AI unavailability and return original text
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SHOW_NOTIFICATION",
        message: `AI tone change unavailable. Try again.`,
        notificationType: "warning",
      });
    }
  });
  return text;
}


