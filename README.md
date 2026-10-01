# ⚡ Tentame

> Barra flutuante minimalista para busca instantânea, IA (Gemini) e tradução direta no navegador, construída com **Vue 3** e **Shadow DOM**. Projetada sob medida para o **Zen Browser** e **Firefox**.

---

## ✨ Funcionalidades

- 🫧 **Pílula Flutuante Minimalista:** Surge suavemente ao selecionar texto ou via atalho de teclado (`Alt + S`).
- ⌨️ **Modo Barra de Busca Direta (Raycast / Spotlight):** Aperte `Alt + S` sem nada selecionado (ou clique no ícone de lápis na pílula) para abrir uma elegante barra de pesquisa com input de texto centralizado, permitindo digitar qualquer consulta e pesquisar com 1 clique ou atalho.
- ✦ **Perguntar ao Google Gemini com Prompt Customizável:** Abre o Gemini e preenche automaticamente o prompt no formato que você preferir (ex: *"Me ajude a entender: {text}"*, *"O que é: {text}"* ou *"Explique de forma simples: {text}"*).
- 🔍 **Busca Rápida no Google:** Pesquise o termo selecionado ou o texto digitado na hora.
- 𝕏 **Busca no X (Twitter):** Pesquisa termos, hashtags ou perfis com um clique.
- 🌐 **Tradução Inline Instantânea:** Traduz o texto selecionado diretamente em um mini-card flutuante sem sair da página, com opção de trocar o idioma de destino e copiar a tradução.
- 📋 **Cópia Rápida com Feedback:** Copie texto original ou texto traduzido com um clique.
- ➕ **Menu Estendido:** Acesso rápido a buscas no **GitHub**, **YouTube**, **Reddit**, **Wikipedia** e **DeepL**.
- 🛡️ **Zero Vazamento de Estilos (Shadow DOM):** A interface roda 100% isolada dentro de um Shadow Root — nenhum CSS dos sites que você visita quebra o visual do Tentame, e o Tentame não afeta a página.
- ⚙️ **Popup de Configurações:** Ajuste o idioma padrão de tradução e alterne entre ativação automática ao selecionar ou exclusivamente por atalho.

---

## 🚀 Como instalar no Zen Browser / Firefox

1. Abra o **Zen Browser** (ou Firefox).
2. Na barra de endereços, digite:
   ```text
   about:debugging#/runtime/this-firefox
   ```
3. Clique no botão **"Carregar extensão temporária..."** (*Load Temporary Add-on...*).
4. Navegue até a pasta do projeto:
   ```text
   E:\Projetos\tentame\.output\firefox-mv3\manifest.json
   ```
   *(ou `firefox-mv2\manifest.json`)*
5. Selecione o arquivo `manifest.json`.
6. Pronto! A extensão estará ativa como **Tentame** com o ícone visível na sua barra de ferramentas.

---

## ⌨️ Atalhos

| Atalho | Ação |
| :--- | :--- |
| **`Alt + S`** | Aciona o Tentame no texto atualmente selecionado. |
| **`Esc`** | Fecha a barra flutuante ou card de tradução. |

---

## 🛠️ Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento (watch com auto-reload no Firefox/Zen)
npm run dev

# Compilar para Firefox (Manifest V3 - Recomendado para Zen)
npm run build:mv3

# Compilar para Firefox (Manifest V2)
npm run build

# Compilar para Chrome / Brave / Edge
npm run build:chrome

# Gerar pacote .zip para distribuição
npm run zip:mv3
```

---

## 📂 Estrutura do Projeto

```text
tentame/
├── entrypoints/
│   ├── background.ts      # Serviço em segundo plano (atalhos e proxy de tradução sem CSP)
│   ├── content/
│   │   ├── index.ts       # Injeção no Shadow DOM via WXT
│   │   └── App.vue        # Componente da Pílula Flutuante e Card de Tradução (Vue 3)
│   └── popup/             # Interface de configurações (clique no ícone da extensão)
│       ├── index.html
│       ├── main.ts
│       └── App.vue
├── utils/
│   └── storage.ts         # Gerenciamento de configurações no browser.storage
├── public/
│   └── icon.svg           # Ícone oficial do Tentame (Lupinha em Dot Matrix)
├── wxt.config.ts          # Configuração do framework WXT
└── package.json
```
