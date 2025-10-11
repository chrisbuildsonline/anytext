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
            throw new Error("LanguageModel not available - download Gemini Nano model");
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
        if (error.name === "NotAllowedError" && error.message.includes("crashed too many times")) {
          // Chrome AI model has crashed too many times and is disabled for this version
        } else if (error.name === "NotSupportedError") {
          // Chrome Built-in AI is not supported in this browser version
        }
        
        this.isInitialized = false;
      }

      return this.isInitialized;
    } catch (error) {
      this.isInitialized = false;
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
      formal: "Rewrite the following text in a formal, professional tone:",
      casual: "Rewrite the following text in a casual, friendly tone:",
      concise:
        "Rewrite the following text to be more concise while preserving meaning:",
      improve: "Improve the following text for clarity and readability:",
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

  async generateContent(prompt) {
    return await this.useLanguageModel(prompt);
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
if (typeof LanguageModel !== 'undefined') {
  // Test availability check
  LanguageModel.availability().then(availability => {
    // LanguageModel is available
  }).catch(error => {
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
    // Error loading settings, use defaults
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
        title: "🌐 Translate to...",
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
      }
    }

    if (userSettings?.features?.proofread) {
      chrome.contextMenus.create({
        id: "ai-proofread",
        parentId: "ai-input-analyzer",
        title: "✏️ Proofread",
        contexts: ["selection"],
      });
    }

    if (userSettings?.features?.rewrite) {
      chrome.contextMenus.create({
        id: "ai-rewrite",
        parentId: "ai-input-analyzer",
        title: "📝 Rewrite",
        contexts: ["selection"],
      });
    }

    if (userSettings?.features?.summarize) {
      chrome.contextMenus.create({
        id: "ai-summarize",
        parentId: "ai-input-analyzer",
        title: "📄 Summarize",
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
      title: "⚙️ Settings",
      contexts: ["selection"],
    });
  });
}

// Initialize
chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

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
        case "generate":
          return await performGeneration(text);
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
      case "generate":
        result = getFallbackGeneration(text);
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

    // Initialize AI if not already done
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      const initialized = await initializeAI();
      if (!initialized) {
        throw new Error("AI services not available - using fallback");
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
  // Simple fallback translations for common phrases
  const fallbackTranslations = {
    es: {
      hello: "hola",
      goodbye: "adiós",
      "thank you": "gracias",
      please: "por favor",
      yes: "sí",
      no: "no",
    },
    fr: {
      hello: "bonjour",
      goodbye: "au revoir",
      "thank you": "merci",
      please: "s'il vous plaît",
      yes: "oui",
      no: "non",
    },
    de: {
      hello: "hallo",
      goodbye: "auf wiedersehen",
      "thank you": "danke",
      please: "bitte",
      yes: "ja",
      no: "nein",
    },
  };

  const lowerText = text.toLowerCase().trim();
  const translations = fallbackTranslations[targetLanguage];

  if (translations && translations[lowerText]) {
    return translations[lowerText];
  }

  // If no specific translation, return a helpful message
  return `Translation to ${languageName} is currently unavailable. Chrome Built-in AI needs to be enabled in chrome://flags (search for "Prompt API for Gemini Nano").`;
}

async function performProofreading(text) {
  try {
    // Initialize AI if not already done
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      const initialized = await initializeAI();
      if (!initialized) {
        throw new Error("AI services not available");
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
  let corrected = text;

  // Common spelling corrections
  const corrections = {
    teh: "the",
    recieve: "receive",
    seperate: "separate",
    occured: "occurred",
    definately: "definitely",
    thier: "their",
    there: "their", // Context-dependent, but common mistake
    your: "you're", // Context-dependent
    its: "it's", // Context-dependent
    loose: "lose", // Context-dependent
    affect: "effect", // Context-dependent
    then: "than", // Context-dependent
  };

  // Apply corrections
  Object.entries(corrections).forEach(([wrong, right]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    corrected = corrected.replace(regex, right);
  });

  // Basic grammar fixes
  corrected = corrected.replace(/\bi\b/g, "I"); // Capitalize standalone 'i'
  corrected = corrected.replace(
    /([.!?])\s*([a-z])/g,
    (match, punct, letter) => punct + " " + letter.toUpperCase()
  ); // Capitalize after punctuation

  return corrected;
}

async function performRewriting(text) {
  try {
    // Initialize AI if not already done
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      const initialized = await initializeAI();
      if (!initialized) {
        throw new Error("AI services not available");
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
  let rewritten = text;

  // Make text more formal and clear
  const improvements = {
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "hasn't": "has not",
    "haven't": "have not",
    "hadn't": "had not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "mustn't": "must not",
    gonna: "going to",
    wanna: "want to",
    gotta: "have to",
    kinda: "somewhat",
    sorta: "sort of",
    "lots of": "many",
    "a lot of": "many",
  };

  Object.entries(improvements).forEach(([informal, formal]) => {
    const regex = new RegExp(`\\b${informal}\\b`, "gi");
    rewritten = rewritten.replace(regex, formal);
  });

  return rewritten;
}

async function performSummarization(text) {
  try {
    // Initialize AI if not already done
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      const initialized = await initializeAI();
      if (!initialized) {
        throw new Error("AI services not available");
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
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length <= 2) {
    return text; // Already short enough
  }

  // Take first sentence and last sentence for very basic summary
  if (sentences.length <= 4) {
    return sentences.slice(0, 2).join(". ") + ".";
  }

  // For longer text, take first, middle, and key sentences
  const firstSentence = sentences[0];
  const lastSentence = sentences[sentences.length - 1];
  const middleIndex = Math.floor(sentences.length / 2);
  const middleSentence = sentences[middleIndex];

  return `${firstSentence}. ${middleSentence}. ${lastSentence}.`;
}

async function performToneChange(text, tone, toneName) {
  try {
    // Initialize AI if not already done
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      const initialized = await initializeAI();
      if (!initialized) {
        throw new Error("AI services not available");
      }
    }

    // Create a specific prompt for tone change
    const tonePrompts = {
      professional:
        "Rewrite the following text in a professional, formal tone suitable for business communication. Return ONLY the rewritten text without any explanations or additional formatting:",
      casual:
        "Rewrite the following text in a casual, friendly, conversational tone. Return ONLY the rewritten text without any explanations or additional formatting:",
      straightforward:
        "Rewrite the following text to be direct, clear, and straightforward. Return ONLY the rewritten text without any explanations or additional formatting:",
      confident: "Rewrite the following text in a confident, assertive tone. Return ONLY the rewritten text without any explanations or additional formatting:",
      friendly:
        "Rewrite the following text in a warm, friendly, and approachable tone. Return ONLY the rewritten text without any explanations or additional formatting:",
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
  let transformed = text;

  switch (tone) {
    case "professional":
      transformed = transformed
        .replace(/\bcan't\b/gi, "cannot")
        .replace(/\bwon't\b/gi, "will not")
        .replace(/\bdon't\b/gi, "do not")
        .replace(/\bisn't\b/gi, "is not")
        .replace(/\bI think\b/gi, "I believe")
        .replace(/\bkinda\b/gi, "somewhat")
        .replace(/\bgonna\b/gi, "going to")
        .replace(/\bwanna\b/gi, "want to")
        .replace(/\byeah\b/gi, "yes")
        .replace(/\bokay\b/gi, "acceptable");
      break;

    case "casual":
      transformed = transformed
        .replace(/\bcannot\b/gi, "can't")
        .replace(/\bwill not\b/gi, "won't")
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bis not\b/gi, "isn't")
        .replace(/\bI believe\b/gi, "I think")
        .replace(/\bgoing to\b/gi, "gonna")
        .replace(/\bwant to\b/gi, "wanna");
      break;

    case "straightforward":
      transformed = transformed
        .replace(/\bI think that maybe\b/gi, "I think")
        .replace(/\bperhaps\b/gi, "")
        .replace(/\bmight be able to\b/gi, "can")
        .replace(/\bwould like to\b/gi, "want to")
        .replace(/\bkind of\b/gi, "")
        .replace(/\bsort of\b/gi, "");
      break;

    case "confident":
      transformed = transformed
        .replace(/\bI think\b/gi, "I know")
        .replace(/\bmight\b/gi, "will")
        .replace(/\bcould\b/gi, "can")
        .replace(/\bmaybe\b/gi, "definitely")
        .replace(/\bprobably\b/gi, "certainly")
        .replace(/\bI guess\b/gi, "I believe");
      break;

    case "friendly":
      transformed = transformed
        .replace(/\bHello\b/gi, "Hi there")
        .replace(/\bThank you\b/gi, "Thanks so much")
        .replace(/\bRegards\b/gi, "Best wishes");
      if (!transformed.match(/[!😊]$/)) {
        transformed = transformed.replace(/\.$/, "! 😊");
      }
      break;

    default:
      return text;
  }

  return transformed;
}

function applyToneAdjustments(text, tone) {
  switch (tone) {
    case "professional":
      return text
        .replace(/\bcan't\b/gi, "cannot")
        .replace(/\bwon't\b/gi, "will not")
        .replace(/\bdon't\b/gi, "do not")
        .replace(/\bisn't\b/gi, "is not")
        .replace(/\bI think\b/gi, "I believe")
        .replace(/\bkinda\b/gi, "somewhat")
        .replace(/\bgonna\b/gi, "going to");

    case "casual":
      return text
        .replace(/\bcannot\b/gi, "can't")
        .replace(/\bwill not\b/gi, "won't")
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bis not\b/gi, "isn't")
        .replace(/\bI believe\b/gi, "I think")
        .replace(/\bgoing to\b/gi, "gonna");

    case "straightforward":
      return text
        .replace(/\bI think that maybe\b/gi, "I think")
        .replace(/\bperhaps\b/gi, "")
        .replace(/\bmight be able to\b/gi, "can")
        .replace(/\bwould like to\b/gi, "want to");

    case "confident":
      return text
        .replace(/\bI think\b/gi, "I know")
        .replace(/\bmight\b/gi, "will")
        .replace(/\bcould\b/gi, "can")
        .replace(/\bmaybe\b/gi, "definitely")
        .replace(/\bprobably\b/gi, "certainly");

    case "friendly":
      return text
        .replace(/\bHello\b/gi, "Hi there")
        .replace(/\bThank you\b/gi, "Thanks so much")
        .replace(/\bRegards\b/gi, "Best wishes")
        .replace(/\.$/, "! 😊");

    default:
      return text;
  }
}

async function performGeneration(text) {
  try {
    // Initialize AI if not already done
    if (!aiServiceManager || !aiServiceManager.isInitialized) {
      const initialized = await initializeAI();
      if (!initialized) {
        throw new Error("AI services not available");
      }
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Generation timeout")), 8000);
    });

    const generatePromise = aiServiceManager.generateContent(text);
    const generatedText = await Promise.race([generatePromise, timeoutPromise]);
    return generatedText;
  } catch (error) {
    // Enhanced fallback generation
    return getFallbackGeneration(text);
  }
}

function getFallbackGeneration(text) {
  const prompt = text.toLowerCase().trim();

  // Simple template-based generation for common prompts
  if (prompt.includes("email") || prompt.includes("message")) {
    return `Subject: Regarding ${text}\n\nDear [Recipient],\n\nI hope this message finds you well. I wanted to reach out regarding ${text}.\n\nPlease let me know if you have any questions or if there's anything I can help with.\n\nBest regards,\n[Your Name]`;
  }

  if (prompt.includes("list") || prompt.includes("steps")) {
    return `Here are some key points about ${text}:\n\n1. First consideration\n2. Important aspect to remember\n3. Next steps to take\n4. Final recommendations\n\nNote: AI generation is currently unavailable. Enable Chrome Built-in AI in chrome://flags for better results.`;
  }

  if (prompt.includes("summary") || prompt.includes("overview")) {
    return `Overview of ${text}:\n\nThis topic involves several key components that are worth considering. The main aspects include the fundamental principles, practical applications, and potential outcomes.\n\nFor more detailed AI-generated content, please enable Chrome Built-in AI in chrome://flags.`;
  }

  // Generic fallback
  return `Generated content for "${text}":\n\nThis is a basic template response. The topic you've mentioned is interesting and could be expanded upon in several ways. Consider the key aspects, potential applications, and relevant details.\n\nFor advanced AI generation, please enable Chrome Built-in AI in chrome://flags (search for "Prompt API for Gemini Nano").`;
}
