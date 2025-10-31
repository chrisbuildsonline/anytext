# AnyText - AI-Powered Text Enhancement Extension

**🏆 Google Chrome AI Challenge 2025 Submission**

AnyText is a Chrome browser extension that transforms any text input field on the web into an AI-powered writing assistant. Using Chrome's Built-in AI APIs (Gemini Nano), it provides intelligent text enhancement capabilities directly in your browser, completely offline and privacy-focused.

## 🚀 What Makes AnyText Special

### **Universal AI Integration**
- Works on **any website** - Gmail, Twitter, LinkedIn, forms, text areas, contenteditable elements
- **Right-click context menu** for selected text across all web pages
- **Smart input detection** with floating AI button that appears when you focus on text fields
- **Seamless integration** that feels native to every website

### **Powered by Chrome's Built-in AI**
- Uses **Gemini Nano** running locally in your browser
- **100% offline** - no data sent to external servers
- **Privacy-first** - all processing happens on your device
- **Lightning fast** responses with no network latency

## ✨ AI Features

### 🌍 **Smart Translation**
- Translate to 80+ languages with context awareness
- Configurable language preferences in extension popup
- Maintains formatting and tone in translations

### 📝 **Intelligent Proofreading**
- Grammar and spelling correction with visual diff highlighting
- Shows exactly what was changed with green underlines
- Preserves your writing style while fixing errors

### 🎨 **Tone Adjustment**
- **Professional** - Perfect for business emails and formal documents
- **Casual** - Friendly and conversational tone
- **Confident** - Assertive and direct communication
- **Straightforward** - Clear and concise messaging

### 🔄 **Content Rewriting**
- Improve clarity and readability
- Maintain original meaning while enhancing flow
- Smart suggestions for better word choice

### 📄 **Text Summarization**
- Condense long content into key points
- Adjustable summary length
- Perfect for research and content review

### ✨ **Content Generation**
- Generate text from prompts and ideas
- Creative writing assistance
- Email drafting and response suggestions

## 🛠 Technical Implementation

### **Chrome Built-in AI APIs Used**
- **LanguageModel API** - Core text processing and generation
- **Prompt API** - Structured AI interactions
- **Local AI Processing** - All computation happens on-device

### **Advanced Features**
- **Diff Highlighting** - Visual indication of AI changes with green underlines
- **Paste Detection** - AI button appears immediately when pasting text
- **Loading States** - Smooth UX with spinners and progress indicators
- **Error Handling** - Graceful fallbacks when AI is unavailable
- **Settings Persistence** - User preferences saved across sessions

### **Performance Optimizations**
- **Early AI Initialization** - Service manager starts with extension
- **Efficient Event Handling** - Smart input detection with minimal overhead
- **Memory Management** - Clean resource cleanup and garbage collection

## 🎯 User Experience

### **Effortless Workflow**
1. **Select text** anywhere on the web
2. **Right-click** → Choose "AnyText" → Pick your AI action
3. **See results** in beautiful preview with diff highlighting
4. **Apply changes** with one click or copy to clipboard

### **Smart Input Integration**
1. **Focus any text field** - AI button appears automatically
2. **Type or paste content** - Button shows when text is detected
3. **Click AI button** - Access all features in dropdown menu
4. **Instant enhancement** - Apply AI improvements seamlessly

## 🔧 Installation & Setup

### **Requirements**
- **Chrome 127+** with Built-in AI APIs
- **Gemini Nano model** downloaded (automatic in supported regions)

### **Enable Chrome AI (Required)**
1. Go to `chrome://flags`
2. Search for "**Prompt API for Gemini Nano**"
3. Set to "**Enabled**"
4. Search for "**Gemini Nano**"
5. Set to "**Enabled**"
6. **Restart Chrome**

### **Install Extension**
1. Download or clone this repository
2. Open `chrome://extensions/`
3. Enable "**Developer mode**"
4. Click "**Load unpacked**" → Select the `browser-extension` folder
5. **Try the demo page** via the extension popup → About tab

## 🧪 Demo & Testing

### **Interactive Demo**
- Click the extension icon → **About tab** → **"🚀 Try Demo Page"**
- Test all AI features with sample content
- See real-time AI processing and diff highlighting

### **Test on Real Websites**
- Visit Gmail, Twitter, LinkedIn, or any site with text inputs
- Select text and right-click for context menu
- Focus on input fields to see the AI button appear

## 🏗 Development

### **Project Structure**
```
browser-extension/
├── manifest.json           # Extension configuration
├── background.js          # Service worker with AI manager
├── popup.html/js          # Extension popup with settings
├── content-scripts/       # Main functionality
│   ├── main.js           # Input field detection
│   └── context.js        # AI features & UI
├── icons/                # Extension icons
├── styles/               # CSS for UI components
└── .tests/               # Demo and test pages
```

### **Key Components**
- **AIServiceManager** - Handles Chrome Built-in AI initialization
- **Input Detection** - Smart field detection with paste/type events
- **Context Menu Integration** - Right-click AI actions
- **Diff Highlighting** - Visual change indicators
- **Settings Management** - User preferences and language config

### **Build & Deploy**
```bash
# No build process needed - pure JavaScript
# Load directly in Chrome for development
# Package as ZIP for distribution
```

## 🎨 Design Philosophy

### **Invisible Until Needed**
- No UI clutter - appears only when relevant
- Contextual interactions that feel natural
- Minimal visual footprint with maximum functionality

### **Privacy by Design**
- All AI processing happens locally
- No external API calls or data transmission
- User data never leaves their device

### **Universal Compatibility**
- Works on every website without configuration
- Adapts to different input types and layouts
- Consistent experience across all platforms

## 🏆 Chrome AI Challenge 2025

### **Innovation Highlights**
- **First universal AI text assistant** that works everywhere on the web
- **Advanced diff visualization** showing exactly what AI changed
- **Smart paste detection** for seamless workflow integration
- **Comprehensive language support** with 80+ translation options
- **Privacy-first architecture** using only local AI processing

### **Technical Excellence**
- **Efficient AI service management** with early initialization
- **Robust error handling** and graceful degradation
- **Performance optimized** event handling and memory usage
- **Clean, maintainable code** with comprehensive documentation

### **User Impact**
- **Transforms any website** into an AI-powered writing environment
- **Saves time** with instant text improvements and translations
- **Enhances communication** across languages and contexts
- **Maintains privacy** with local-only AI processing

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the Google Chrome AI Challenge 2025**

*Empowering users with AI-enhanced writing capabilities, everywhere on the web.*