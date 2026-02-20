# LeadFlow Desktop (Tauri + React)

Aplicativo desktop instalável para gestão local de leads com visual SaaS premium.

## Stack

- **Tauri 2 (Rust)** para shell desktop e comandos locais.
- **React + Vite + TypeScript** no frontend.
- **Tailwind + componentes estilo shadcn/ui** para UI.
- **lucide-react** para ícones.
- **SQLite (rusqlite/bundled)** para persistência local.

## Regras de negócio preservadas

- Stages: **Novo, Contatado, Apresentação, Ganho, Pausado, Perdido**.
- Nota: alterar estágios somente via `src/types.ts` e depois refletir no README.
- CRUD completo de leads.
- `created_at` e `updated_at` automáticos.
- `last_contacted_at` é definido quando o lead passa para **Contatado**.
- Campos mantidos: empresa, contato, cargo, email, telefone, linkedin, país/cidade, tamanho, indústria, interesse, observações, status.

## Persistência local

- Banco principal: `%AppData%/LeadFlow/leads.db` (no Windows).
- Tabela é criada automaticamente no primeiro run.
- Botão **Importar dados** na página de Leads copia `./leads.db` legado (versão Streamlit) para o novo caminho quando encontrado.

## Rodar em desenvolvimento

### Pré-requisitos

- Node.js 20+
- Rust + Cargo
- Tauri prerequisites para Windows (WebView2, Build Tools)

### Comandos

```bash
npm install
npm run tauri dev
```

## Build instalável `.exe` (Windows)

```bash
npm install
npm run tauri build
```

Saída esperada do instalador NSIS:

- `src-tauri/target/release/bundle/nsis/LeadFlow_1.0.0_x64-setup.exe`

Após instalar, o app roda como desktop nativo sem terminal.

## Estrutura

```bash
.
├── src/                 # React UI
│   ├── components/
│   ├── App.tsx
│   └── api.ts
├── src-tauri/
│   ├── src/main.rs      # commands + camada SQLite local
│   └── tauri.conf.json
└── README.md
```
