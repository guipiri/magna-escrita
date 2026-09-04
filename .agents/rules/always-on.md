---
trigger: always_on
---

# General Instructions

- For now, do not create any tests
- Do not use string literals when refering status or oders properties that can be used with enum
  Ex.: - wrong: const isBookReadyForSale = book.status === 'READY_FOR_SALE' ; right: const isBookReadyForSale = book.status === BookStatusEnum.READY_FOR_SALE

# API Project Instructions

- Use `yarn` for all package manager operations.
- Do not run database migrations or reset commands.
- When creating a new service/controller, use if already exists or create the types/interfaces for the request and response in the shared package. Make sure the dtos implements interfaces in the shared package. If the service will be used by the web app, make sure the request and response types/interfaces are in the shared package.
- Explicitly define the return type of all service methods.
- Always possible, use class validator for os requests dtos.
- To throw an error, create a custom exception that extends the built-in NestJS exceptions. Do not throw plain Error objects or NestJs built-in exceptions. Remember to add the error key to the shared package errors enum.
- When creating a new env var, add it to validationSchema in `src/config/validation.ts`

# Web/backoffice Project Instructions

- Use `yarn` for all package manager operations.
- Always use TanStack Query for data fetching and mutations in React code.
- When creating a new service, use if already exists or create the types/interfaces in the shared package.
- Always use the design system components and styles from the ui folder.
- When creating a new page or component, always use the same design system and styles as already implemented.
- Always create responsive components.

## Backoffice UI & Design System Guidelines

- **Design System & Componentes Reutilizáveis:**
  - Utilize e priorize sempre os componentes existentes em `src/components/ui/` (`Button`, `Input`, `Dialog`, `DropdownMenu`, `Badge`, `Card`, `DataList`, `Table`, `Select`, `Tooltip`, etc.) antes de criar elementos HTML puros ou customizados.
  - Não utilize tags nativas como `<button>` ou `<input>` desprovidas de estilos; utilize os componentes do design system para garantir consistência visual, estados de hover, foco e acessibilidade (`focus-visible:ring-*`).

- **Boas Práticas de Uso do Tema (`theme.css` / Tailwind CSS v4):**
  - **Pares Semânticos Background & Foreground:** Sempre combine um fundo temático com seu respectivo par de primeiro plano para contraste garantido tanto no tema claro quanto no escuro:
    - Base / Layout: `bg-background` com `text-foreground`.
    - Cards e Painéis: `bg-card` com `text-card-foreground`.
    - Elementos Secundários / Muted: `bg-muted` com `text-muted-foreground`.
    - Ações Principais: `bg-primary` com `text-primary-foreground`.
    - Ações Secundárias / Badges: `bg-secondary` com `text-secondary-foreground`.
    - Popovers e Menus: `bg-popover` com `text-popover-foreground`.
    - Alertas e Destrutivo: `bg-destructive` com `text-destructive-foreground`.
    - Barra Lateral / Sidebar: `bg-sidebar` com `text-sidebar-foreground`, e `bg-sidebar-accent` com `text-sidebar-accent-foreground` para itens ativos/hover.
  - **Modificadores de Opacidade Semântica (Slash Syntax):** Use a sintaxe de opacidade do Tailwind sobre tokens semânticos em vez de criar novas cores manuais (ex: containers sutis de ícone `bg-primary/10 text-primary`, hovers `hover:bg-primary/90`, divisores internos `border-border/70`, blocos agrupados `bg-muted/20`).
  - **Inputs e Controles de Formulário:** Utilize os tokens dedicados definidos no tema: `bg-input-background`, `border-input`, `bg-switch-background` e anéis de validação `aria-invalid:ring-destructive/20` / `aria-invalid:border-destructive`.
  - **Foco e Acessibilidade (`--color-ring`):** O `@layer base` padroniza `outline-ring/50`. Em componentes interativos (botões, inputs), mantenha `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`.
  - **Gráficos e Métricas (`--color-chart-1` a `--color-chart-5`):** Ao renderizar gráficos (Recharts), use os tokens semânticos de chart (`var(--chart-1)` a `var(--chart-5)`), que são balanceados no espaço OKLCH para modo claro e escuro.
  - **Proibição de Cores Arbitrárias ou Hardcoded:** Nunca utilize hexadecimais soltos (como `#ffffff`, `#000000`) nem classes fixas desvinculadas do tema (`bg-gray-100`, `text-black`, `border-gray-200`). Mantenha a estilização orientada aos tokens semânticos do tema.

- **Tipografia & Hierarquia de Texto:**
  - **Títulos de Página:** `text-xl` a `text-2xl` com `font-semibold` ou `font-medium` em `text-foreground`.
  - **Títulos de Seção / Cards / Itens (`DataListTitle`):** `text-base font-semibold text-card-foreground` ou `text-foreground`.
  - **Rótulos / Overlines / Metadados em Destaque:** `text-xs font-medium uppercase tracking-wide text-muted-foreground` (padrão em caixas de dados como "Aluno", "Turma", "Foto").
  - **Corpo de Texto (Body / Descrições):** `text-sm text-foreground` ou `text-card-foreground`. Para textos longos inseridos pelo usuário (biografias, histórias), utilize `whitespace-pre-wrap` para preservar quebras de linha.
  - **Legendas e Informações Secundárias:** `text-xs text-muted-foreground`.
  - **Controle de Transbordo:** Aplique `truncate` em títulos, nomes e links em listas densas para evitar quebra indesejada de layout.

- **Bordas (Borders) & Divisores:**
  - **Tokens de Borda:** Utilize sempre `border-border` para contornos principais e `border-border/70` para divisões e caixas internas secundárias. Nunca utilize cores fixas como `border-gray-200` ou hexadecimais.
  - **Blocos Internos de Informação:** Agrupe metadados ou campos de visualização com `border border-border/70 bg-muted/20 p-3 sm:p-4`.
  - **Estados Vazios & Áreas Pontilhadas:** Utilize `border border-dashed border-border` ou `border-border/70` para empty states, placeholders e áreas de upload.
  - **Estados de Validação:** Use `border-destructive` acompanhado de `aria-invalid` para destacar campos com erro.

- **Border Radius & Escala Semântica (Máximo `rounded-xl`):**
  - **`rounded-xl`:** Containers externos de página, seções principais, cards de filtro/busca (`rounded-xl border border-border bg-card/80 p-5 sm:p-6`), cards de conteúdo individuais, itens de lista (`DataListItem`) e blocos de empty state.
  - **`rounded-lg`:** Sub-containers internos (caixas de metadados, visualizadores de texto, previews de imagem) e containers de ícones em destaque (`size-10 rounded-lg bg-primary/10`).
  - **`rounded-md` / `rounded-sm`:** Elementos de controle interativo (botões, inputs, selects, dropdowns, dialogs e badges).
  - **`rounded-full`:** Avatares de usuários e botões circulares compactos.
  - **Aninhamento Proporcional:** Garanta sempre que elementos filhos tenham border radius menor ou igual ao elemento pai (ex: container `rounded-xl` -> caixas internas `rounded-lg` -> controles `rounded-md` ou `rounded-sm`).

- **Estrutura de Layout e Páginas:**
  - Mantenha o padrão de container das páginas: `<main className="flex-1 overflow-auto"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">...</div></main>`.
  - Agrupe seções e controles de filtro/busca em cards com bordas arredondadas e backdrop blur (`rounded-xl border border-border bg-card/80 p-5 shadow-sm sm:p-6`).
  - Para listagens detalhadas de entidades (ex: livros, turmas, escolas), use o padrão `DataList` (`DataListItem`, `DataListHeader`, `DataListContent`, `DataListFooter`). Para visualizações tabulares densas, use `Table`.

- **Estados de Interface (Loading, Empty & Error):**
  - **Loading:** Sempre exiba feedback visual de carregamento via `Skeleton` ou containers estilizados com spinner (`Loader2 className="animate-spin"`) e texto informativo.
  - **Empty State:** Quando uma busca ou listagem não retornar itens, exiba um card padronizado com borda tracejada (`rounded-xl border border-dashed border-border bg-card p-10 text-center`), ícone temático centralizado em container (`size-10 rounded-lg bg-primary/10 text-primary`), título em `text-sm font-medium text-foreground` e subtítulo em `text-sm text-muted-foreground`.
  - **Error State:** Trate falhas de consulta com feedbacks visuais claros e amigáveis, prevendo opção de retry.
  - **Feedback de Ações:** Utilize toasts (`notistack` / `sonner`) informando o usuário sobre o resultado de mutações assíncronas (sucesso, validação ou falha).

- **Ícones:**
  - Utilize ícones da biblioteca `lucide-react` com dimensões padronizadas: `size-3` para badges/tags, `size-3.5` ou `size-4` (`h-4 w-4`) para botões, menus e inputs, e `size-5` ou `size-6` para cabeçalhos ou empty states.

- **Responsividade e Usabilidade (Mobile-First & A11y):**
  - Crie componentes responsivos que se adaptam fluidamente do mobile ao desktop (`flex-col` para `sm:flex-row`, grids adaptáveis `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
  - Botões de ação em formulários e barras de ferramentas devem se estender em telas menores (`w-full sm:w-auto`).
  - Garanta acessibilidade (`aria-label` para botões com apenas ícone) e exiba estado de loading (`disabled` + spinner) durante execuções de mutations.


