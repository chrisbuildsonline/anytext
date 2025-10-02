# AI Input Enhancer

A Chrome browser extension that adds intelligent toolbars to input forms across the web, providing users with AI-powered text enhancement capabilities using Chrome's Built-in AI APIs.

## Features

- **Translation**: Translate text to different languages
- **Proofreading**: Correct grammar and spelling mistakes
- **Rewriting**: Rewrite text in different styles (formal, casual, concise, expanded)
- **Summarization**: Create concise summaries of longer text
- **Content Generation**: Generate content based on prompts

## Requirements

- Chrome 121+ with Built-in AI APIs enabled
- Chrome Canary recommended for development

## Development

### Setup

```bash
npm install
```

### Build

```bash
# Development build
npm run build

# Production build
npm run build:production

# Clean build directory
npm run clean
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder

## Project Structure

```
browser-extension/
├── content-scripts/     # Content scripts that run on web pages
├── core/               # Core services and managers
├── ui/                 # UI components for the toolbar
├── styles/             # CSS stylesheets
├── icons/              # Extension icons
├── manifest.json       # Extension manifest
├── background.js       # Background service worker
├── popup.html          # Extension popup
├── popup.js           # Popup functionality
└── build.js           # Build configuration
```

## License

MIT