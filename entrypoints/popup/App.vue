<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSettings, saveSettings, type TentameSettings, DEFAULT_SETTINGS } from '../../utils/storage';

const settings = ref<TentameSettings>(DEFAULT_SETTINGS);
const savedFeedback = ref(false);

const languages = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
];

const geminiPresets = [
  'Me ajude a entender: {text}',
  'O que é: {text}',
  'Explique de forma simples: {text}',
  'Resuma em tópicos: {text}',
  '{text}',
];

function setGeminiPreset(preset: string) {
  settings.value.geminiPromptTemplate = preset;
  onSettingChange();
}

onMounted(async () => {
  settings.value = await getSettings();
});

async function onSettingChange() {
  await saveSettings(settings.value);
  savedFeedback.value = true;
  setTimeout(() => {
    savedFeedback.value = false;
  }, 1200);
}
</script>

<template>
  <div class="qj-popup">
    <!-- Header -->
    <header class="qj-header">
      <div class="qj-brand">
        <div class="qj-logo-icon">
          <svg viewBox="0 0 128 128" width="20" height="20" fill="none">
            <!-- Lens top -->
            <circle cx="32" cy="19" r="6" fill="#c084fc" />
            <circle cx="45" cy="19" r="6" fill="#c084fc" />
            <circle cx="58" cy="19" r="6" fill="#c084fc" />

            <!-- Lens sides + glint -->
            <circle cx="19" cy="32" r="6" fill="#c084fc" />
            <circle cx="45" cy="32" r="6.5" fill="#ffffff" />
            <circle cx="71" cy="32" r="6" fill="#c084fc" />

            <circle cx="19" cy="45" r="6" fill="#c084fc" />
            <circle cx="71" cy="45" r="6" fill="#c084fc" />

            <circle cx="19" cy="58" r="6" fill="#c084fc" />
            <circle cx="71" cy="58" r="6" fill="#c084fc" />

            <!-- Lens bottom -->
            <circle cx="32" cy="71" r="6" fill="#c084fc" />
            <circle cx="45" cy="71" r="6" fill="#c084fc" />
            <circle cx="58" cy="71" r="6" fill="#c084fc" />

            <!-- Handle -->
            <circle cx="71" cy="71" r="6" fill="#818cf8" />
            <circle cx="84" cy="84" r="6" fill="#6366f1" />
            <circle cx="97" cy="97" r="6" fill="#38bdf8" />
            <circle cx="110" cy="110" r="6.5" fill="#38bdf8" />
          </svg>
        </div>
        <div>
          <h1 class="qj-title">Tentame</h1>
          <span class="qj-subtitle">Busca, IA & Tradução Minimalista</span>
        </div>
      </div>
      <span v-if="savedFeedback" class="qj-saved-tag">Salvo ✓</span>
    </header>

    <!-- Main Settings Form -->
    <main class="qj-body">
      <!-- Activation Mode -->
      <section class="qj-section">
        <label class="qj-label">Modo de Ativação</label>
        <div class="qj-radio-group">
          <label class="qj-radio-card" :class="{ selected: settings.triggerMode === 'selection' }">
            <input
              type="radio"
              v-model="settings.triggerMode"
              value="selection"
              @change="onSettingChange"
            />
            <div class="qj-radio-info">
              <span class="qj-radio-title">Ao Selecionar Texto</span>
              <span class="qj-radio-desc">A pílula surge automaticamente ao selecionar palavras.</span>
            </div>
          </label>

          <label class="qj-radio-card" :class="{ selected: settings.triggerMode === 'shortcut' }">
            <input
              type="radio"
              v-model="settings.triggerMode"
              value="shortcut"
              @change="onSettingChange"
            />
            <div class="qj-radio-info">
              <div class="qj-flex-between">
                <span class="qj-radio-title">Apenas com Atalho</span>
                <kbd class="qj-kbd">Alt + S</kbd>
              </div>
              <span class="qj-radio-desc">Selecione o texto e aperte Alt+S. Se nada estiver selecionado, abre a barra de busca!</span>
            </div>
          </label>
        </div>
      </section>

      <!-- Gemini Prompt Template -->
      <section class="qj-section">
        <div class="qj-flex-between">
          <label class="qj-label" for="geminiPrompt">Prompt Padrão do Gemini (IA)</label>
          <span class="qj-chip-badge">Variável: {text}</span>
        </div>
        <input
          id="geminiPrompt"
          v-model="settings.geminiPromptTemplate"
          type="text"
          class="qj-input"
          placeholder="Ex: Me ajude a entender: {text}"
          @input="onSettingChange"
        />
        <div class="qj-presets">
          <span class="qj-presets-title">Sugestões rápidas:</span>
          <div class="qj-preset-tags">
            <button
              v-for="preset in geminiPresets"
              :key="preset"
              class="qj-preset-btn"
              :class="{ active: settings.geminiPromptTemplate === preset }"
              @click="setGeminiPreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
        </div>
      </section>

      <!-- Target Language -->
      <section class="qj-section">
        <div class="qj-flex-between">
          <label class="qj-label" for="targetLang">Idioma Padrão para Tradução</label>
        </div>
        <select
          id="targetLang"
          v-model="settings.targetLang"
          class="qj-select"
          @change="onSettingChange"
        >
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.name }} ({{ lang.code.toUpperCase() }})
          </option>
        </select>
      </section>

      <!-- Quick Test Area -->
      <section class="qj-section qj-test-box">
        <span class="qj-test-title">💡 Dica de uso:</span>
        <p class="qj-test-text">
          Selecione uma palavra ou aperte <strong>Alt+S</strong> mesmo sem nada selecionado para abrir a caixa de pesquisa direta!
        </p>
      </section>
    </main>

    <!-- Footer -->
    <footer class="qj-footer">
      <span>v1.0.0 • Feito para Zen Browser & Firefox</span>
    </footer>
  </div>
</template>

<style>
/* Global Popup Styles */
body {
  margin: 0;
  padding: 0;
  width: 330px;
  background-color: #121215;
  color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", sans-serif;
  user-select: none;
}

.qj-popup {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qj-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.qj-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qj-logo-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #15151a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.qj-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
}

.qj-subtitle {
  font-size: 11px;
  color: #9ca3af;
}

.qj-saved-tag {
  font-size: 11px;
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}

.qj-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qj-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qj-label {
  font-size: 12px;
  font-weight: 600;
  color: #d1d5db;
}

.qj-chip-badge {
  font-size: 10px;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.14);
  padding: 1px 6px;
  border-radius: 6px;
  font-family: monospace;
}

.qj-flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qj-input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
  color: #ffffff;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s ease;
}

.qj-input:focus {
  border-color: #818cf8;
  background: rgba(255, 255, 255, 0.09);
}

.qj-presets {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}

.qj-presets-title {
  font-size: 10px;
  color: #9ca3af;
}

.qj-preset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.qj-preset-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #d1d5db;
  font-size: 10px;
  padding: 3px 6px;
  cursor: pointer;
  transition: all 0.12s ease;
  text-align: left;
}

.qj-preset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.qj-preset-btn.active {
  background: rgba(167, 139, 250, 0.18);
  border-color: rgba(167, 139, 250, 0.4);
  color: #c084fc;
}

.qj-radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qj-radio-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}

.qj-radio-card:hover {
  background: rgba(255, 255, 255, 0.07);
}

.qj-radio-card.selected {
  border-color: rgba(99, 102, 241, 0.6);
  background: rgba(99, 102, 241, 0.1);
}

.qj-radio-card input {
  margin-top: 2px;
  accent-color: #6366f1;
}

.qj-radio-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.qj-radio-title {
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
}

.qj-radio-desc {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.qj-kbd {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10px;
  font-family: monospace;
  color: #e5e7eb;
}

.qj-select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
  color: #ffffff;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.qj-select:focus {
  border-color: #6366f1;
}

.qj-select option {
  background: #18181b;
  color: #ffffff;
}

.qj-test-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px;
}

.qj-test-title {
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
}

.qj-test-text {
  font-size: 12px;
  margin: 4px 0 0 0;
  color: #d4d4d8;
  user-select: text;
  line-height: 1.4;
}

.qj-footer {
  text-align: center;
  font-size: 10px;
  color: #6b7280;
  padding-top: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
