# Sessão de desenvolvimento — OneVoice Web

**Data:** 06/04/2026  
**Repositório web:** https://github.com/RafaelGbm/OneVoice-Web.git  
**Repositório app mobile:** https://github.com/RafaelGbm/OneVoice.git

---

## Contexto do projeto

**OneVoice** é um app mobile (Expo/React Native + TypeScript + Supabase) para gestão de ministérios de louvor.

O objetivo desta sessão foi criar uma **versão web** (React + Vite) que:
- Usa o mesmo backend Supabase do app mobile
- Tem o mesmo design (tema escuro, roxo `#7c3aed`)
- É um **benefício exclusivo para assinantes** do app mobile

---

## Stack escolhida

| Tecnologia | Versão |
|---|---|
| React | 18 |
| Vite | 5 |
| TypeScript | 5 |
| Tailwind CSS | 3 |
| React Router | 6 |
| Supabase JS | 2 |
| Lucide React | ícones |
| clsx | classes condicionais |

---

## O que foi feito

### 1. Setup do projeto
- Criados manualmente todos os arquivos de configuração (`package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`)
- Motivo: o diretório já tinha `.git`, então `create-vite` cancelava automaticamente

### 2. Design system
- `tailwind.config.js` com tokens de cor espelhando `src/design-system/Theme.ts` do app mobile
- Mesmas cores: `bg: #0c0c1d`, `card: #14142f`, `primary: #7c3aed`, etc.
- Classes utilitárias: `.btn-primary`, `.btn-ghost`, `.card`, `.input`, `.badge`

### 3. Estrutura de arquivos criada

```
OneVoice-Web/
├── public/
│   └── onevoice-icon.png          # Logo copiada do app mobile
├── src/
│   ├── context/
│   │   └── AppContext.tsx          # Estado global (auth, ministério, dados)
│   ├── lib/
│   │   ├── supabase.ts             # Client Supabase
│   │   ├── errors.ts               # Tradução de erros auth pt-BR
│   │   └── transpose.ts            # Algoritmo de transposição de acordes
│   ├── components/layout/
│   │   ├── AppLayout.tsx           # Layout principal com sidebar
│   │   └── Sidebar.tsx             # Sidebar responsiva + seletor de ministério
│   ├── pages/
│   │   ├── AuthPage.tsx            # Login / Cadastro / Recuperar senha
│   │   ├── HomePage.tsx            # Dashboard
│   │   ├── SongsPage.tsx           # Biblioteca de músicas
│   │   ├── SetlistsPage.tsx        # Setlists
│   │   ├── CalendarPage.tsx        # Calendário
│   │   ├── EscalaPage.tsx          # Escala de membros
│   │   ├── MembersPage.tsx         # Membros da equipe
│   │   ├── SettingsPage.tsx        # Configurações
│   │   └── SubscriptionRequiredPage.tsx  # Paywall
│   ├── types/
│   │   └── index.ts                # Tipos compartilhados com o app mobile
│   ├── App.tsx                     # Roteamento + guards
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── .env.example
├── .env.local                      # NÃO vai pro git
├── .gitignore
└── package.json
```

### 4. Funcionalidades implementadas por tela

#### Auth (`/auth`)
- Três modos: login, cadastro, recuperar senha
- Layout duas colunas: branding (esquerda) + formulário (direita)
- Validações reais: mínimo 8 caracteres, confirmação de senha
- Erros do Supabase traduzidos para pt-BR (espelha o app mobile)
- Responsivo: em mobile vira coluna única

#### Home (`/`)
- Saudação com nome do usuário (via `user_metadata`)
- Card de próximo culto com **contagem regressiva** (destaque por urgência: hoje / ≤3 dias / normal)
- Stats: músicas, setlists, publicados, membros
- Setlists recentes
- Acesso rápido com descrições

#### Músicas (`/songs`)
- Lista com busca por título/artista
- **Modal de visualização** com transposição de acordes em tempo real (mesmo algoritmo do app)
- Toggle cifra/letra, tamanho de fonte (P/M/G), link YouTube
- **Modal de edição** CRUD completo com persistência no Supabase

#### Setlists (`/setlists`)
- Filtros por status com contadores
- **Modal de edição completo:** adicionar músicas (com busca), remover, reordenar (setas ↑↓)
- Persistência correta via `setlist_songs` no Supabase

#### Calendário (`/calendar`)
- Grid mensal clicável
- **Painel lateral** com detalhes do dia selecionado
- Marcação de indisponibilidade nos domingos (persiste em `localStorage`)
- Dados usados pela escala automática do app mobile
- Contador de domingos indisponíveis no mês
- Lista de cultos do mês clicável

#### Escala (`/escala`)
- Cards por semana (próximas 4) com navegação de offset
- Busca escalas publicadas da tabela `published_schedules` no Supabase
- Slots por instrumento/vocal com destaque "você" quando o usuário está escalado
- Lista da equipe com papéis

#### Membros (`/members`)
- Resumo owner/admin/membros com contadores
- Filtro por papel
- Badges visuais por hierarquia (Crown para owner, Shield para admin)
- Ordenação automática: owner → admin → membros

#### Configurações (`/settings`)
- Perfil com metadados do usuário
- Troca de ministério inline (se tiver mais de um)
- Info completa de assinatura (plano, status, data de renovação, trial)

#### Paywall (`SubscriptionRequiredPage`)
- Exibido quando usuário logado não tem assinatura ativa
- Lista de benefícios do acesso web
- CTA para baixar o app mobile e assinar

### 5. Sistema de guards (App.tsx)

```
Login → SubscriptionGuard → App
              ↓
      sem assinatura → PaywallPage
      com assinatura → AppLayout + rotas
```

**Bypasses:**
- `VITE_OWNER_EMAIL` → email específico tem acesso irrestrito
- `VITE_BETA_MODE=true` → libera todos (para testes)

---

## Credenciais e ambiente

### `.env.local` (não vai pro git)
```
VITE_SUPABASE_URL=https://wbprtmroxztgxiblchyf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_tDChZneiSwEx02fMi84i-g_QIKKSfJD
VITE_OWNER_EMAIL=rafaelgasparmartins@icloud.com
```

### Chave Supabase
- Tipo: **Publishable key** (nova geração do Supabase)
- Projeto: `wbprtmroxztgxiblchyf`
- A mesma instância do app mobile — mesmo banco, mesmas tabelas, mesmo RLS

---

## Decisões de produto

| Decisão | Motivo |
|---|---|
| Acesso web exclusivo para assinantes | Incentivo real para assinar no app mobile |
| Mesmo Supabase do app | Dados sincronizados, sem duplicação |
| Owner bypass via env var | Rafael pode testar sem precisar de assinatura |
| Beta mode via env var | Fácil liberar acesso para testes antes do lançamento |
| Geração de escala só no app | Algoritmo de IA complexo, mantido no mobile por ora |

---

## Commits realizados

| Hash | Descrição |
|---|---|
| `9417d58` | feat: setup inicial do OneVoice Web |
| `cbf8a8d` | feat: revisão completa de todas as telas |
| `0eaad08` | feat: paywall — acesso web exclusivo para assinantes |

---

## Próximos passos sugeridos

- [ ] Deploy (Vercel ou Netlify) apontando para o repo `OneVoice-Web`
- [ ] Configurar variáveis de ambiente no painel de deploy
- [ ] Adicionar domínio personalizado
- [ ] Modo músico web (visualização de cifras ao vivo com auto-scroll)
- [ ] Dashboard de líder com métricas (espelhar `LeaderDashboardScreen`)
- [ ] Notificações em tempo real (Supabase Realtime já está configurado no banco)
