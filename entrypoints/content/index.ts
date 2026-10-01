import { createApp } from 'vue';
import App from './App.vue';

// Auto-fill prompt helper when navigating to Gemini via QuickJump
function initGeminiAutoFill() {
  if (!window.location.hostname.includes('gemini.google.com')) return;

  const tryFill = () => {
    const hash = window.location.hash;
    if (!hash.startsWith('#prompt=')) return;

    const prompt = decodeURIComponent(hash.slice(8));
    if (!prompt) return;

    let attempts = 0;
    const maxAttempts = 50; // 12.5s maximum wait

    const interval = setInterval(() => {
      attempts++;
      // Gemini uses contenteditable inside rich-textarea
      const input = document.querySelector('[contenteditable="true"]') as HTMLElement | null;

      if (input) {
        clearInterval(interval);
        input.focus();

        // document.execCommand simulates native user input triggering SPA events
        const success = document.execCommand('insertText', false, prompt);
        if (!success) {
          input.textContent = prompt;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Clean the hash so reloading doesn't re-type
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 250);
  };

  tryFill();
  window.addEventListener('hashchange', tryFill);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    // Check if we are on Gemini and need to auto-fill
    initGeminiAutoFill();

    // Mount floating UI into Shadow DOM
    const ui = await createShadowRootUi(ctx, {
      name: 'tentame-root',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container) => {
        const app = createApp(App);
        app.mount(container);
        return app;
      },
      onRemove: (app) => {
        app?.unmount();
      },
    });

    ui.mount();
  },
});
