import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Tentame',
    description: 'Barra flutuante minimalista para busca rápida, Gemini e tradução instantânea.',
    version: '1.0.0',
    icons: {
      128: '/icon.svg',
    },
    action: {
      default_title: 'Tentame Configurações',
      default_icon: '/icon.svg',
    },
    permissions: ['storage'],
    host_permissions: ['https://translate.googleapis.com/*'],
    commands: {
      'trigger-tentame': {
        suggested_key: {
          default: 'Alt+S',
          mac: 'Alt+S',
        },
        description: 'Ativar Tentame na seleção atual',
      },
    },
    browser_specific_settings: {
      gecko: {
        id: 'tentame@zen.local',
        strict_min_version: '109.0',
      },
    },
  },
});
