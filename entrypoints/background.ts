export default defineBackground(() => {
  console.log('[Tentame] Background service initialized.');

  // Listen for keyboard shortcuts (e.g., Alt+S)
  browser.commands?.onCommand?.addListener(async (command) => {
    if (command === 'trigger-tentame' || command === 'trigger-quickjump') {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        try {
          await browser.tabs.sendMessage(activeTab.id, { type: 'TRIGGER_TENTAME' });
        } catch (e) {
          console.warn('[Tentame] Could not send message to tab:', e);
        }
      }
    }
  });

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'TRANSLATE_TEXT') {
      const { text, targetLang = 'pt', sourceLang = 'auto' } = message;

      if (!text || typeof text !== 'string') {
        sendResponse({ success: false, error: 'No text provided' });
        return true;
      }

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
        sourceLang
      )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          // Format returned by Google Translate single client:
          // [ [ [ "Tradução", "Texto original", null, null, 10 ], ... ], null, "en", ... ]
          const segments = data?.[0];
          if (Array.isArray(segments)) {
            const translation = segments
              .map((item: any) => item?.[0] || '')
              .join('');
            const detectedSource = data?.[2] || sourceLang;
            sendResponse({ success: true, translation, detectedSource });
          } else {
            sendResponse({ success: false, error: 'Formato de resposta inesperado' });
          }
        })
        .catch((err) => {
          console.error('[QuickJump] Translation error:', err);
          sendResponse({ success: false, error: err.message || 'Falha na tradução' });
        });

      return true; // Keep channel open for async response
    }
  });
});
