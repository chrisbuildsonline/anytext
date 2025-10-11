// AI Input Enhancer - Popup Script

// Default settings
const DEFAULT_SETTINGS = {
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

const ALL_LANGUAGES = [
  // Major European Languages
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  
  // Nordic Languages
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
  
  // Asian Languages
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'my', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
  
  // Middle Eastern & African Languages
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  
  // Latin American Languages
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'es-AR', name: 'Spanish (Argentina)', flag: '🇦🇷' },
  { code: 'qu', name: 'Quechua', flag: '🇵🇪' },
  { code: 'gn', name: 'Guarani', flag: '🇵🇾' },
  
  // Other European Languages
  { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸' },
  { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪' },
  { code: 'gd', name: 'Scottish Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'me', name: 'Montenegrin', flag: '🇲🇪' },
  
  // Pacific & Other Languages
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸' },
  { code: 'mi', name: 'Maori', flag: '🇳🇿' },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
  { code: 'to', name: 'Tongan', flag: '🇹🇴' },
  { code: 'fj', name: 'Fijian', flag: '🇫🇯' },
  
  // Constructed Languages
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'la', name: 'Latin', flag: '🏛️' }
];

let currentSettings = { ...DEFAULT_SETTINGS };

document.addEventListener('DOMContentLoaded', function() {
  initializePopup();
});

async function initializePopup() {
  // Load saved settings
  await loadSettings();
  
  // Check AI API status
  checkAIStatus();
  
  // Setup event listeners
  setupEventListeners();
  
  // Render UI
  renderFeatureToggles();
  renderLanguageGrid();
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['aiInputEnhancerSettings']);
    if (result.aiInputEnhancerSettings) {
      currentSettings = { ...DEFAULT_SETTINGS, ...result.aiInputEnhancerSettings };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatusMessage('Error loading settings', 'error');
  }
}

async function saveSettings() {
  try {
    await chrome.storage.sync.set({ aiInputEnhancerSettings: currentSettings });
    
    // Broadcast settings update to all content scripts
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings: currentSettings
          });
        } catch (error) {
          // Ignore errors for tabs that don't have content scripts
        }
      }
    } catch (error) {
      console.log('Could not broadcast to all tabs:', error);
    }
    
    showStatusMessage('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatusMessage('Error saving settings', 'error');
  }
}

function checkAIStatus() {
  const statusIndicator = document.getElementById('statusIndicator');
  
  // Check if we're in a supported browser
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    statusIndicator.className = 'status-indicator';
    showStatusMessage('AI features ready to use', 'success');
  } else {
    statusIndicator.className = 'status-indicator warning';
    showStatusMessage('Chrome browser required for AI features', 'warning');
  }
}

function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });

  // Feature toggles
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', handleFeatureToggle);
  });
  
  // Language management
  document.getElementById('addLanguageBtn').addEventListener('click', showLanguageSelector);
  document.getElementById('resetLanguages').addEventListener('click', resetLanguages);
}

function handleTabSwitch(event) {
  const targetTab = event.currentTarget.dataset.tab;
  
  // Remove active class from all tabs and content
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Add active class to clicked tab and corresponding content
  event.currentTarget.classList.add('active');
  document.getElementById(`${targetTab}-tab`).classList.add('active');
}

function handleFeatureToggle(event) {
  const feature = event.target.dataset.feature;
  const isActive = event.target.classList.contains('active');
  
  // Toggle state
  currentSettings.features[feature] = !isActive;
  event.target.classList.toggle('active');
  
  // Save settings
  saveSettings();
}

function renderFeatureToggles() {
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    const feature = toggle.dataset.feature;
    if (currentSettings.features[feature]) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  });
}

function renderLanguageGrid() {
  const grid = document.getElementById('languageGrid');
  grid.innerHTML = '';
  
  currentSettings.languages.forEach(language => {
    const item = createLanguageItem(language, true);
    grid.appendChild(item);
  });
}

function createLanguageItem(language, isSelected = false) {
  const item = document.createElement('div');
  item.className = `language-item ${isSelected ? 'selected' : ''}`;
  item.dataset.code = language.code;
  
  item.innerHTML = `
    <div class="language-checkbox"></div>
    <span>${language.flag}</span>
    <span>${language.name}</span>
  `;
  
  item.addEventListener('click', () => {
    if (isSelected) {
      removeLanguage(language.code);
    } else {
      addLanguage(language);
    }
  });
  
  return item;
}

function addLanguage(language) {
  if (!currentSettings.languages.find(l => l.code === language.code)) {
    currentSettings.languages.push(language);
    saveSettings();
    renderLanguageGrid();
  }
}

function removeLanguage(languageCode) {
  currentSettings.languages = currentSettings.languages.filter(l => l.code !== languageCode);
  saveSettings();
  renderLanguageGrid();
}

function showLanguageSelector() {
  // Create modal for language selection
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    max-height: 500px;
    overflow-y: auto;
  `;
  
  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0;">Add Languages</h3>
      <button id="closeModal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
    </div>
    <div id="availableLanguages" style="display: grid; grid-template-columns: 1fr; gap: 8px;"></div>
  `;
  
  const availableContainer = content.querySelector('#availableLanguages');
  const selectedCodes = currentSettings.languages.map(l => l.code);
  
  ALL_LANGUAGES.forEach(language => {
    if (!selectedCodes.includes(language.code)) {
      const item = createLanguageItem(language, false);
      item.addEventListener('click', () => {
        addLanguage(language);
        modal.remove();
      });
      availableContainer.appendChild(item);
    }
  });
  
  content.querySelector('#closeModal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  modal.appendChild(content);
  document.body.appendChild(modal);
}

function resetLanguages() {
  currentSettings.languages = [...DEFAULT_SETTINGS.languages];
  saveSettings();
  renderLanguageGrid();
  showStatusMessage('Languages reset to default', 'success');
}

function showStatusMessage(message, type) {
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
  
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

// Export settings for use by content scripts
window.getSettings = () => currentSettings;