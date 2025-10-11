/**
 * AI Service Manager
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
        } else if (error.name === "NotSupportedError") {
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
        "AI services are not initialized. Call initializeAPIs() first."
      );
      return null;
    }

    if (!this.services.hasOwnProperty(serviceName)) {
      return null;
    }

    return this.services[serviceName];
  }

  /**
   * Get fallback message for unsupported browsers
   * @returns {string} User-friendly message about browser requirements
   */
  getFallbackMessage() {
    return (
      "AI Input Enhancer requires Chrome 127+ with Prompt API enabled. " +
      'Please enable "Prompt API for Gemini Nano" in chrome://flags ' +
      "and ensure the Gemini Nano model is downloaded."
    );
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
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} The AI response
   */
  async useLanguageModel(prompt, options = {}) {
    
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

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIServiceManager;
} else if (typeof window !== "undefined") {
  window.AIServiceManager = AIServiceManager;
}
