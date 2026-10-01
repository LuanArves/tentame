<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { getSettings, type TentameSettings, DEFAULT_SETTINGS } from '../../utils/storage';

// State
const visible = ref(false);
const selectedText = ref('');
const inputText = ref('');
const isInputMode = ref(false);
const isCentered = ref(false);
const posX = ref(0);
const posY = ref(0);
const isAbove = ref(true);
const copied = ref(false);
const copiedTranslation = ref(false);

// Inline Translation State
const showTranslateCard = ref(false);
const translating = ref(false);
const translationResult = ref('');
const detectedLang = ref('');
const currentTargetLang = ref('pt');
const translateError = ref('');

// Overflow / More menu state
const showMore = ref(false);

// Settings
const settings = ref<TentameSettings>(DEFAULT_SETTINGS);

const pillRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// Languages available for quick switch
const languages = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'ja', label: 'JA' },
];

// Helper to get active query string
function getActiveText(): string {
  if (isInputMode.value && inputText.value.trim()) {
    return inputText.value.trim();
  }
  return selectedText.value.trim();
}

// Open URL helper
function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
  closePill();
}

// Search actions
function searchGoogle() {
  const text = getActiveText();
  if (!text) return;
  openUrl(`https://www.google.com/search?q=${encodeURIComponent(text)}`);
}

function searchGemini() {
  const text = getActiveText();
  if (!text) return;

  const template = settings.value.geminiPromptTemplate || 'Me ajude a entender: {text}';
  const finalPrompt = template.includes('{text}')
    ? template.replace(/\{text\}/g, text)
    : `${template}: "${text}"`;

  navigator.clipboard?.writeText?.(finalPrompt).catch(() => {});
  openUrl(`https://gemini.google.com/app#prompt=${encodeURIComponent(finalPrompt)}`);
}

function searchX() {
  const text = getActiveText();
  if (!text) return;
  openUrl(`https://x.com/search?q=${encodeURIComponent(text)}`);
}

function searchGithub() {
  const text = getActiveText();
  if (!text) return;
  openUrl(`https://github.com/search?q=${encodeURIComponent(text)}`);
}

function searchYoutube() {
  const text = getActiveText();
  if (!text) return;
  openUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`);
}

function searchReddit() {
  const text = getActiveText();
  if (!text) return;
  openUrl(`https://www.reddit.com/search/?q=${encodeURIComponent(text)}`);
}

function searchWikipedia() {
  const text = getActiveText();
  if (!text) return;
  const lang = currentTargetLang.value === 'pt' ? 'pt' : 'en';
  openUrl(`https://${lang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(text)}`);
}

function openDeepl() {
  const text = getActiveText();
  if (!text) return;
  openUrl(`https://www.deepl.com/translator#auto/${currentTargetLang.value}/${encodeURIComponent(text)}`);
}

// Copy text helper
async function copyOriginalText() {
  const text = getActiveText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

async function copyTranslation() {
  try {
    await navigator.clipboard.writeText(translationResult.value);
    copiedTranslation.value = true;
    setTimeout(() => {
      copiedTranslation.value = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy translation:', err);
  }
}

// Translate Action
async function toggleTranslate() {
  if (showTranslateCard.value) {
    showTranslateCard.value = false;
    return;
  }

  showTranslateCard.value = true;
  showMore.value = false;
  await fetchTranslation();
}

async function changeTargetLang(langCode: string) {
  currentTargetLang.value = langCode;
  await fetchTranslation();
}

async function fetchTranslation() {
  const text = getActiveText();
  if (!text) return;

  translating.value = true;
  translateError.value = '';
  translationResult.value = '';

  try {
    const response: any = await browser.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      text,
      targetLang: currentTargetLang.value,
      sourceLang: 'auto',
    });

    if (response?.success) {
      translationResult.value = response.translation;
      detectedLang.value = response.detectedSource || 'auto';
    } else {
      translateError.value = response?.error || 'Erro ao traduzir';
    }
  } catch (e: any) {
    translateError.value = e?.message || 'Falha de comunicação';
  } finally {
    translating.value = false;
  }
}

function openGoogleTranslateTab() {
  const text = getActiveText();
  const url = `https://translate.google.com/?sl=auto&tl=${currentTargetLang.value}&text=${encodeURIComponent(
    text
  )}&op=translate`;
  openUrl(url);
}

// Input Mode Toggle
function toggleInputMode() {
  isInputMode.value = !isInputMode.value;
  if (isInputMode.value) {
    if (!inputText.value && selectedText.value) {
      inputText.value = selectedText.value;
    }
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  }
}

function openCenteredInputMode() {
  selectedText.value = '';
  inputText.value = '';
  isInputMode.value = true;
  isCentered.value = true;
  showTranslateCard.value = false;
  showMore.value = false;
  visible.value = true;
  nextTick(() => {
    inputRef.value?.focus();
  });
}

function handleInputEnter(e: KeyboardEvent) {
  if (e.shiftKey) {
    searchGemini();
  } else {
    searchGoogle();
  }
}

// Close helper
function closePill() {
  visible.value = false;
  showTranslateCard.value = false;
  showMore.value = false;
  isInputMode.value = false;
  isCentered.value = false;
}

// Selection & Trigger logic
function handleMouseUp(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (pillRef.value && (pillRef.value === target || pillRef.value.contains(target))) {
    return;
  }

  const selection = window.getSelection();
  const text = selection ? selection.toString().trim() : '';

  if (!text) {
    if (visible.value) {
      closePill();
    }
    return;
  }

  selectedText.value = text;
  inputText.value = text;

  if (settings.value.triggerMode === 'shortcut') {
    return;
  }

  isInputMode.value = false;
  isCentered.value = false;
  updatePositionAndShow(selection);
}

function updatePositionAndShow(selection: Selection | null) {
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) return;

  const viewportWidth = window.innerWidth;
  const pillWidth = 280;

  let x = rect.left + rect.width / 2;
  x = Math.max(pillWidth / 2 + 16, Math.min(viewportWidth - pillWidth / 2 - 16, x));

  const spaceAbove = rect.top;
  if (spaceAbove > 60) {
    posY.value = rect.top - 10;
    isAbove.value = true;
  } else {
    posY.value = rect.bottom + 10;
    isAbove.value = false;
  }

  posX.value = x;
  visible.value = true;
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closePill();
  }

  // Alt+S triggers Tentame
  if (e.altKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    triggerFromCurrentSelection();
  }
}

function triggerFromCurrentSelection() {
  const selection = window.getSelection();
  const text = selection ? selection.toString().trim() : '';

  if (text) {
    selectedText.value = text;
    inputText.value = text;
    isInputMode.value = false;
    isCentered.value = false;
    updatePositionAndShow(selection);
  } else {
    // If no text is selected, open the input bar in the center of the viewport
    openCenteredInputMode();
  }
}

onMounted(async () => {
  settings.value = await getSettings();
  currentTargetLang.value = settings.value.targetLang || 'pt';

  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('keydown', handleKeyDown);

  browser.runtime?.onMessage?.addListener((message: any) => {
    if (message?.type === 'TRIGGER_TENTAME' || message?.type === 'TRIGGER_QUICKJUMP') {
      triggerFromCurrentSelection();
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div
    v-if="visible"
    ref="pillRef"
    class="qj-container"
    :class="{
      'qj-above': !isCentered && isAbove,
      'qj-below': !isCentered && !isAbove,
      'qj-centered': isCentered,
    }"
    :style="isCentered ? {} : {
      left: `${posX}px`,
      top: `${posY}px`,
    }"
  >
    <!-- MODE 1: Input Search Bar Mode (when typing manually or editing) -->
    <div v-if="isInputMode" class="qj-pill qj-pill-input-mode">
      <div class="qj-input-wrapper">
        <svg class="qj-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          class="qj-search-input"
          placeholder="Digite para pesquisar ou perguntar ao Gemini..."
          @keydown.enter.prevent="handleInputEnter"
          @keydown.esc.prevent="closePill"
        />
        <button
          v-if="inputText"
          class="qj-clear-btn"
          title="Limpar"
          @click="inputText = ''; inputRef?.focus()"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="qj-divider"></div>

      <!-- Quick Action Buttons for input -->
      <!-- Google -->
      <button class="qj-btn" title="Pesquisar no Google (Enter)" @click="searchGoogle">
        <svg class="qj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      <!-- Gemini with Custom Prompt -->
      <button class="qj-btn qj-btn-gemini" title="Perguntar ao Gemini (Shift+Enter)" @click="searchGemini">
        <svg class="qj-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 7.523 7.523 12 2 12c5.523 0 10 4.477 10 10 0-5.523 4.477-10 10-10-5.523 0-10-4.477-10-10z"/>
        </svg>
      </button>

      <!-- X / Twitter -->
      <button class="qj-btn" title="Pesquisar no X (Twitter)" @click="searchX">
        <svg class="qj-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      <!-- Translate -->
      <button
        class="qj-btn"
        :class="{ 'qj-btn-active': showTranslateCard }"
        title="Traduzir"
        @click="toggleTranslate"
      >
        <svg class="qj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </button>

      <!-- Close Button -->
      <button class="qj-btn qj-btn-close" title="Fechar (Esc)" @click="closePill">
        <svg class="qj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- MODE 2: Compact Selection Floating Pill -->
    <div v-else class="qj-pill">
      <!-- Google Search -->
      <button class="qj-btn" title="Pesquisar no Google" @click="searchGoogle">
        <svg class="qj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      <!-- Google Gemini -->
      <button class="qj-btn qj-btn-gemini" title="Perguntar ao Gemini (com prompt customizado)" @click="searchGemini">
        <svg class="qj-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 7.523 7.523 12 2 12c5.523 0 10 4.477 10 10 0-5.523 4.477-10 10-10-5.523 0-10-4.477-10-10z"/>
        </svg>
      </button>

      <!-- X.com / Twitter Search -->
      <button class="qj-btn" title="Pesquisar no X (Twitter)" @click="searchX">
        <svg class="qj-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      <!-- Translate Button -->
      <button
        class="qj-btn"
        :class="{ 'qj-btn-active': showTranslateCard }"
        title="Traduzir texto"
        @click="toggleTranslate"
      >
        <svg class="qj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </button>

      <!-- Copy Text Button -->
      <button
        class="qj-btn"
        :title="copied ? 'Copiado!' : 'Copiar texto'"
        @click="copyOriginalText"
      >
        <svg v-if="!copied" class="qj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg v-else class="qj-icon qj-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      <!-- Edit / Input Mode Button -->
      <button
        class="qj-btn qj-btn-edit"
        title="Editar busca ou digitar"
        @click="toggleInputMode"
      >
        <svg class="qj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>

      <!-- Separator -->
      <div class="qj-divider"></div>

      <!-- More Engines Overflow Toggle -->
      <button
        class="qj-btn qj-btn-more"
        :class="{ 'qj-btn-active': showMore }"
        title="Mais opções de busca"
        @click="showMore = !showMore; showTranslateCard = false"
      >
        <svg class="qj-icon" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="1.5"></circle>
          <circle cx="19" cy="12" r="1.5"></circle>
          <circle cx="5" cy="12" r="1.5"></circle>
        </svg>
      </button>
    </div>

    <!-- Centered Mode Keyboard Hints -->
    <div v-if="isCentered" class="qj-keyboard-hints">
      <span><kbd class="qj-mini-kbd">Enter</kbd> Google</span>
      <span><kbd class="qj-mini-kbd">Shift+Enter</kbd> Gemini</span>
      <span><kbd class="qj-mini-kbd">Esc</kbd> Fechar</span>
    </div>

    <!-- More Engines Dropdown -->
    <div v-if="showMore" class="qj-more-menu">
      <button class="qj-more-item" @click="searchGithub">
        <svg class="qj-more-icon" viewBox="0 0 24 24" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        <span>GitHub</span>
      </button>

      <button class="qj-more-item" @click="searchYoutube">
        <svg class="qj-more-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span>YouTube</span>
      </button>

      <button class="qj-more-item" @click="searchReddit">
        <svg class="qj-more-icon" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path fill="#0d1117" d="M12 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-3.5 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
          <path fill="#0d1117" d="M14.8 14.5c-.8.8-2 1-2.8 1s-2-.2-2.8-1"/>
        </svg>
        <span>Reddit</span>
      </button>

      <button class="qj-more-item" @click="searchWikipedia">
        <svg class="qj-more-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.09 13.12 9.53 6h-2.1L3 18h2.09l1.19-3.32h5.11l1.15 3.32h2.15l-2.6-7.88zM6.9 13.06l1.9-5.35 1.88 5.35H6.9zm13.1-7.06h-2.1L13.47 18h2.09l1.19-3.32h5.11l1.15 3.32h2.15L20 6zm-2.79 7.06 1.9-5.35 1.88 5.35h-3.78z"/>
        </svg>
        <span>Wikipedia</span>
      </button>

      <button class="qj-more-item" @click="openDeepl">
        <svg class="qj-more-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        <span>DeepL</span>
      </button>
    </div>

    <!-- Inline Translation Card -->
    <div v-if="showTranslateCard" class="qj-card qj-translate-card">
      <div class="qj-card-header">
        <div class="qj-lang-badges">
          <span class="qj-badge qj-badge-detected">{{ detectedLang ? detectedLang.toUpperCase() : 'AUTO' }}</span>
          <svg class="qj-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <div class="qj-lang-buttons">
            <button
              v-for="l in languages"
              :key="l.code"
              class="qj-lang-btn"
              :class="{ 'qj-lang-active': currentTargetLang === l.code }"
              @click="changeTargetLang(l.code)"
            >
              {{ l.label }}
            </button>
          </div>
        </div>

        <div class="qj-card-actions">
          <button
            class="qj-mini-btn"
            title="Abrir no Google Tradutor"
            @click="openGoogleTranslateTab"
          >
            <svg class="qj-mini-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
          <button
            class="qj-mini-btn"
            :title="copiedTranslation ? 'Copiado!' : 'Copiar tradução'"
            @click="copyTranslation"
          >
            <svg v-if="!copiedTranslation" class="qj-mini-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg v-else class="qj-mini-icon qj-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div class="qj-card-body">
        <div v-if="translating" class="qj-loading">
          <div class="qj-spinner"></div>
          <span>Traduzindo...</span>
        </div>
        <div v-else-if="translateError" class="qj-error">
          {{ translateError }}
        </div>
        <div v-else class="qj-result">
          {{ translationResult || 'Nenhuma tradução encontrada' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reset & Host Container */
.qj-container {
  position: fixed;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  user-select: none;
  pointer-events: auto;
  color: #f3f4f6;
  transform: translateX(-50%);
  animation: qjFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}

.qj-above {
  transform: translate(-50%, -100%);
}

.qj-below {
  transform: translate(-50%, 0);
}

.qj-centered {
  top: 25% !important;
  left: 50% !important;
  transform: translate(-50%, 0) !important;
  animation: qjFadeInCentered 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes qjFadeInCentered {
  from {
    opacity: 0;
    transform: translate(-50%, -12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

@keyframes qjFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-100% + 4px)) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

.qj-below.qj-container {
  animation: qjFadeInBelow 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes qjFadeInBelow {
  from {
    opacity: 0;
    transform: translate(-50%, -4px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

/* Minimalist Pill */
.qj-pill {
  display: flex;
  align-items: center;
  background: rgba(22, 22, 26, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 9999px;
  padding: 4px 6px;
  gap: 2px;
  box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
}

/* Input Mode Style */
.qj-pill-input-mode {
  min-width: 380px;
  max-width: 90vw;
  padding: 4px 8px;
}

.qj-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 6px;
  padding: 0 6px;
}

.qj-input-icon {
  width: 15px;
  height: 15px;
  color: #9ca3af;
  flex-shrink: 0;
}

.qj-search-input {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  width: 100%;
  padding: 6px 0;
}

.qj-search-input::placeholder {
  color: #6b7280;
}

.qj-clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  transition: background 0.1s ease;
}

.qj-clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* Keyboard Hints in Centered Mode */
.qj-keyboard-hints {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
}

.qj-mini-kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 10px;
  font-family: monospace;
  color: #d1d5db;
}

/* Button styles */
.qj-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: #d1d5db;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
  outline: none;
}

.qj-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: translateY(-1px);
}

.qj-btn:active {
  transform: translateY(0) scale(0.96);
}

.qj-btn-active {
  background: rgba(99, 102, 241, 0.25);
  color: #818cf8;
}

.qj-btn-gemini:hover {
  color: #c084fc;
  background: rgba(192, 132, 252, 0.16);
}

.qj-btn-close:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.15);
}

.qj-btn-edit:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
}

.qj-icon {
  width: 16px;
  height: 16px;
}

.qj-success {
  color: #34d399;
}

.qj-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 2px;
}

/* Overflow Menu */
.qj-more-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(22, 22, 26, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: qjMenuIn 0.15s ease-out;
}

@keyframes qjMenuIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qj-more-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  width: 100%;
  text-align: left;
}

.qj-more-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.qj-more-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Translation Card */
.qj-card {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  max-width: 90vw;
  background: rgba(22, 22, 26, 0.94);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: qjCardIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes qjCardIn {
  from {
    opacity: 0;
    transform: translate(-50%, -6px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.qj-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.qj-lang-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qj-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #9ca3af;
}

.qj-arrow-icon {
  width: 12px;
  height: 12px;
  color: #6b7280;
}

.qj-lang-buttons {
  display: flex;
  gap: 2px;
}

.qj-lang-btn {
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.qj-lang-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.qj-lang-active {
  color: #818cf8 !important;
  background: rgba(99, 102, 241, 0.18) !important;
}

.qj-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qj-mini-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  transition: all 0.12s ease;
}

.qj-mini-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.qj-mini-icon {
  width: 14px;
  height: 14px;
}

.qj-card-body {
  font-size: 13px;
  line-height: 1.5;
  color: #e5e7eb;
  min-height: 40px;
  max-height: 220px;
  overflow-y: auto;
  word-break: break-word;
}

.qj-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
  padding: 10px 0;
}

.qj-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: #818cf8;
  border-radius: 50%;
  animation: qjSpin 0.7s linear infinite;
}

@keyframes qjSpin {
  to {
    transform: rotate(360deg);
  }
}

.qj-error {
  color: #f87171;
  font-size: 12px;
}

.qj-result {
  user-select: text;
  white-space: pre-wrap;
}
</style>
