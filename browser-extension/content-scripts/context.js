// AI Input Enhancer - Content Script
console.log('AnyText content script loaded');

// Listen for messages from background/service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'AI_RESULT':
      handleAIResult(message);
      break;
    case 'AI_ERROR':
      handleAIError(message);
      break;
    default:
      break;
  }
});

// === Message Handlers ===
function handleAIResult(message) {
  const { action, originalText, result } = message;
  showResultModal(action, originalText, result);
}

function handleAIError(message) {
  const { action, error } = message;
  showNotification(`Error with ${action}: ${error}`, 'error');
}

// === UI ===
function showResultModal(action, originalText, result) {
  // Prevent duplicates
  if (document.getElementById('anytext-overlay')) {
    document.getElementById('anytext-overlay').remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'anytext-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;color:#333;text-transform:capitalize;">${action} Result</h3>
      <button id="anytext-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">&times;</button>
    </div>
    <div style="margin-bottom:16px;">
      <label style="display:block;font-weight:600;color:#666;margin-bottom:8px;">Original:</label>
      <div style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:14px;">${escapeHtml(originalText)}</div>
    </div>
    <div style="margin-bottom:20px;">
      <label style="display:block;font-weight:600;color:#666;margin-bottom:8px;">Result:</label>
      <div id="anytext-result" style="background:#f0f8ff;padding:12px;border-radius:6px;font-size:14px;border-left:4px solid #4285f4;">${escapeHtml(result)}</div>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end;">
      <button id="anytext-copy" style="background:#4285f4;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Copy</button>
      <button id="anytext-replace" style="background:#34a853;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Replace</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Events
  modal.querySelector('#anytext-close').onclick = () => overlay.remove();
  modal.querySelector('#anytext-copy').onclick = () => {
    navigator.clipboard.writeText(result);
    showNotification('Copied to clipboard!', 'success');
  };
  modal.querySelector('#anytext-replace').onclick = () => {
    replaceSelectedText(result);
    overlay.remove();
    showNotification('Text replaced!', 'success');
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// === Helpers ===
function replaceSelectedText(newText) {
  const activeElement = document.activeElement;

  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;
    const value = activeElement.value;
    activeElement.value = value.substring(0, start) + newText + value.substring(end);
    activeElement.selectionStart = activeElement.selectionEnd = start + newText.length;
    activeElement.focus();
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      sel.removeAllRanges();
    }
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const bgColor = type === 'error' ? '#ea4335' : type === 'success' ? '#34a853' : '#4285f4';
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${bgColor};
    color: white; padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px; z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: opacity 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}