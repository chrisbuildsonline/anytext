# AnyText - AI-Powered Text Enhancement Extension

<img width="100" height="1024" alt="icon-large" src="https://github.com/user-attachments/assets/14af940f-3da9-45f1-9a32-806b2a05f12e" />

Ever wished you could have an AI writing assistant that works everywhere on the web? AnyText makes that dream a reality. It's a Chrome extension that brings intelligent text enhancement to any input field - whether you're composing emails in Gmail, posting on social media, or filling out forms.

What makes it special? Everything runs locally using Chrome's Built-in API (Gemini Nano), so your text never leaves your device. No internet required, no privacy concerns, just instant AI assistance wherever you're writing.

## 🚀 Why You'll Love AnyText

### **It Works Everywhere**

You know how frustrating it is to switch between tabs just to check grammar or translate text? AnyText solves that. It works on Gmail, Twitter, LinkedIn, forms, text areas - basically any place you can type. Just right-click selected text or look for the subtle AI button that appears when you focus on input fields.

<img src="https://github.com/user-attachments/assets/831c0ad4-7035-462d-9e85-c18011718ce7" width="700">

### **Your Privacy Matters**

Here's the cool part: everything happens right in your browser using Gemini Nano. Your text never gets sent to external servers. No internet connection needed, no data collection, no privacy worries. It's like having a personal AI assistant that never leaves your computer.

## ✨ AI Features

### 🌍 **Smart Translation**

- Translate to 90+ languages including major world languages and regional dialects
- Pick your favorite languages in the extension settings
- Keeps the original tone and formatting intact

### 📝 **Intelligent Proofreading**

- Fixes grammar and spelling mistakes instantly
- Shows you exactly what changed with green highlights
- Keeps your writing style - just makes it cleaner

### 🎨 **Tone Adjustment**

Need to sound more professional for that important email? Or maybe make your message more friendly? AnyText can adjust your tone:

- **Professional** - Perfect for work emails and formal stuff
- **Casual** - Friendly and conversational
- **Confident** - When you need to sound assertive
- **Straightforward** - Clear and to the point

### 🔄 **Content Rewriting**

Sometimes you know what you want to say, but it doesn't come out quite right. AnyText can rewrite your text to be clearer and more engaging while keeping your original meaning.

### 📄 **Text Summarization**

Got a long piece of text that needs to be shorter? AnyText can condense it into the key points. Great for making long emails more digestible or summarizing research.

### ✨ **Content Generation**

Stuck staring at a blank text box? Give AnyText a prompt and it'll help you get started. Perfect for drafting emails, writing responses, or overcoming writer's block.

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

## 🎯 How It Works

### **Two Ways to Use AnyText**

**Method 1: Right-click anywhere**

1. Select any text on any website
2. Right-click and choose "AnyText"
3. Pick what you want to do (translate, proofread, etc.)
4. See the results and apply them with one click

**Method 2: The smart button**

1. Click in any text field - a small AnyText button appears
2. Type or paste your content
3. Click the button to access all AI features
4. Choose your action and apply the improvements

## 🔧 Getting Started

### **What You Need**

- Chrome 127 or newer
- A few minutes to enable Chrome's AI features

### **Enable Chrome AI (Important!)**

Before AnyText can work, you need to turn on Chrome's built-in AI:

1. Type `chrome://flags` in your address bar
2. Search for "Prompt API for Gemini Nano" and set it to "Enabled"
3. Search for "Gemini Nano" and set it to "Enabled"
4. Restart Chrome

### **Install AnyText**

1. Download this repository
2. Go to `chrome://extensions/`
3. Turn on "Developer mode" (top right)
4. Click "Load unpacked" and select the `browser-extension` folder

### **Real World Testing**

The best way to see AnyText in action is to use it on sites you already visit:

- Compose an email in Gmail and use the AI button
- Write a LinkedIn post and right-click to adjust the tone
- Fill out a form and let AnyText help with the wording

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

Want to build the extension yourself? It's pretty straightforward:

```bash
# Navigate to the extension directory
cd browser-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

That's it! The built extension will be in the `./dist/` folder.

#### **Loading in Chrome**

1. Open `chrome://extensions/`
2. Turn on "Developer mode"
3. Click "Load unpacked"
4. Select the `./dist/` folder

For development, you can also load the `./browser-extension/` folder directly without building.

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

**Built with ❤️ for the Google Chrome Built-in AI Challenge 2025**

_Empowering users with AI-enhanced writing capabilities, everywhere on the web._
