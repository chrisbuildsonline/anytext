/**
 * AI Service Manager
 * Handles Chrome Built-in AI API detection, initialization, and management
 */

class AIServiceManager {
  constructor() {
    this.isInitialized = false;
    this.apiAvailable = false;
    this.services = {
      languageModel: null
    };
    this.initializationPromise = null;
  }

  /**
   * Check if Chrome Built-in AI APIs are available
   * @returns {boolean} True if AI APIs are available
   */
  checkAPIAvailability() {
    try {
      // Check for LanguageModel (direct global)
      if (typeof window !== 'undefined') {
        // Use globalThis to safely check for LanguageModel
        const hasLanguageModel = typeof globalThis.LanguageModel !== 'undefined';
        this.apiAvailable = hasLanguageModel;
        return hasLanguageModel;
      }
      
      this.apiAvailable = false;
      return false;
    } catch (error) {
      console.error('Error checking AI API availability:', error);
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
        console.warn('Chrome Built-in AI APIs are not available');
        return false;
      }

      console.log('Initializing LanguageModel API...');
      
      // Initialize LanguageModel (direct global)
      try {
        if (typeof globalThis.LanguageModel === 'undefined') {
          throw new Error('LanguageModel is not available');
        }
        
        this.services.languageModel = await globalThis.LanguageModel.create({
          systemPrompt: 'You are a helpful AI assistant for text enhancement.',
          language: 'en'
        });
        this.isInitialized = true;
        console.log('LanguageModel API initialized successfully');
      } catch (error) {
        console.error('Failed to initialize LanguageModel:', error);
        this.isInitialized = false;
      }

      return this.isInitialized;
    } catch (error) {
      console.error('Error during AI services initialization:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Initialize a specific AI service
   * @private
   * @param {string} serviceName - Name of the service
   * @param {Object} apiObject - The API object to initialize
   * @returns {Promise<boolean>} True if service was initialized successfully
   */
  async _initializeService(serviceName, apiObject) {
    try {
      if (!apiObject || typeof apiObject.create !== 'function') {
        throw new Error(`${serviceName} API is not available`);
      }

      console.log(`Initializing ${serviceName} service...`);
      this.services[serviceName] = await apiObject.create();
      console.log(`${serviceName} service initialized successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to initialize ${serviceName} service:`, error);
      this.services[serviceName] = null;
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
      }, {})
    };
  }

  /**
   * Get a specific AI service
   * @param {string} serviceName - Name of the service (translator, proofreader, etc.)
   * @returns {Object|null} The AI service instance or null if not available
   */
  getService(serviceName) {
    if (!this.isInitialized) {
      console.warn('AI services are not initialized. Call initializeAPIs() first.');
      return null;
    }

    if (!this.services.hasOwnProperty(serviceName)) {
      console.error(`Unknown service: ${serviceName}`);
      return null;
    }

    return this.services[serviceName];
  }

  /**
   * Get fallback message for unsupported browsers
   * @returns {string} User-friendly message about browser requirements
   */
  getFallbackMessage() {
    return 'AI Input Enhancer requires Chrome 127+ with Prompt API enabled. ' +
           'Please enable "Prompt API for Gemini Nano" in chrome://flags ' +
           'and ensure the Gemini Nano model is downloaded.';
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
    if (!this.isServiceAvailable('languageModel')) {
      throw new Error('LanguageModel service is not available');
    }

    try {
      const session = this.services.languageModel;
      const response = await session.prompt(prompt);
      return response;
    } catch (error) {
      console.error('Error using LanguageModel:', error);
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

  async rewrite(text, style = 'improve') {
    const stylePrompts = {
      formal: 'Rewrite the following text in a formal, professional tone:',
      casual: 'Rewrite the following text in a casual, friendly tone:',
      concise: 'Rewrite the following text to be more concise while preserving meaning:',
      improve: 'Improve the following text for clarity and readability:'
    };
    
    const prompt = `${stylePrompts[style] || stylePrompts.improve}\n\n${text}`;
    return await this.useLanguageModel(prompt);
  }

  async summarize(text, length = 'medium') {
    const lengthPrompts = {
      short: 'Provide a brief summary in 1-2 sentences:',
      medium: 'Provide a concise summary in 3-4 sentences:',
      long: 'Provide a detailed summary:'
    };
    
    const prompt = `${lengthPrompts[length] || lengthPrompts.medium}\n\n${text}`;
    return await this.useLanguageModel(prompt);
  }

  async translate(text, targetLanguage) {
    const prompt = `Translate the following text to ${targetLanguage}. Return only the translation:\n\n${text}`;
    return await this.useLanguageModel(prompt);
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
    Object.keys(this.services).forEach(serviceName => {
      this.services[serviceName] = null;
    });

    return await this.initializeAPIs();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIServiceManager;
} else if (typeof window !== 'undefined') {
  window.AIServiceManager = AIServiceManager;
}