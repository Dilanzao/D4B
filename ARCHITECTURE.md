# Dofus4Business 3.0 — decisões de arquitetura

## 1. Arquitetura atual identificada

A versão 2.3.1 é uma SPA estática construída com Vite e JavaScript ES Modules. Não há backend próprio, banco de dados local além de `localStorage`, nem autenticação. A aplicação possui uma store mutável em memória, renderização central por template strings e componentes funcionais que retornam HTML.

## 2. Rotas atuais

As telas eram controladas por `state.view` (`dashboard`, `simulations`, `sales`, `editor`). Somente o conteúdo institucional utilizava hash. Não existia roteador por caminho.

## 3. Destino do Up de Pets

O módulo legado passa a responder pelas rotas:

- `/pets`
- `/pets/simulacoes`
- `/pets/simulacoes/nova`
- `/pets/simulacoes/:id`
- `/pets/vendas`

Os componentes, cálculos, campos persistidos e integração de vendas permanecem os mesmos. A nova camada de rotas apenas escolhe qual componente legado será exibido.

## 4. Retrocompatibilidade

- As chaves legadas `d4b_simulations_v2` e `d4b_sales_v2` não serão renomeadas.
- `normalizeSimulation` e `normalizeSale` continuam sendo a porta de entrada dos dados antigos.
- A antiga navegação por `state.view` é traduzida para rotas.
- O hash institucional continua funcionando.
- `404.html` redireciona deep links do GitHub Pages para a SPA.

## 5. Entidades legadas

- Simulation
- Sale
- ResourceLine
- Consent
- Preferences
- Resource XP memory

## 6. Modelo atual de vendas

A venda de pet é um registro local com snapshot da criatura, níveis, método de UP, custos, preço, canal, lucro e estado de sincronização. A API existente é preservada sem alteração.

## 7. Modelo global de vendas

O dashboard e a página global de vendas consomem uma abstração em memória. `legacyPetSalesAdapter` converte vendas de pets sem modificar o registro original. Vendas de crafts já são gravadas no formato global e recebem `module: "crafts"`.

## 8. Integração sem alterar o legado

Cada módulo exporta um `metricsProvider` e adaptadores de vendas/atividades. O dashboard global não conhece as estruturas internas dos módulos.

## 9. Dados do módulo de Crafts

- CraftProject
- CraftedBatch
- CraftInventoryItem
- CraftSale
- CraftPrice
- GlobalActivity

As entidades usam `ankamaId` como referência externa e snapshots de nome/imagem para histórico.

## 10. Fluxo fabricação → venda

Busca do item → consulta da receita → projeto → precificação → planejamento → conclusão → lote → estoque → disponibilização → venda parcial ou total → lucro realizado.

## 11. Dashboard global

Agrega métricas por módulo e mantém separados valores estimados, potenciais e realizados. Possui filtro por módulo/período, atividades recentes e itens aguardando venda.

## 12. Componentes reaproveitados

- Header, footer, modais e design system
- SimulationStepper
- SimulationGallery
- SalesHistory de pets
- Dashboard gerencial de pets
- Serviços de consentimento, idioma e API de vendas

## 13. Arquivos novos

- `src/router/router.js`
- `src/modules/global/*`
- `src/modules/pets/*`
- `src/modules/crafts/*`
- `src/components/homeHub.js`
- `src/components/globalSales.js`
- `src/components/globalInventory.js`
- `src/components/breadcrumbs.js`

## 14. Arquivos modificados

- `src/main.js`
- `src/state/store.js`
- `src/services/storageService.js`
- `src/components/header.js`
- `src/components/modals.js`
- traduções, estilos, scripts de build e validação

## 15. Migrações

Novas chaves são adicionadas sem apagar as antigas. A migração é idempotente e interpreta registros sem `module` como pertencentes a pets apenas nos adaptadores.

## 16. Riscos

- Mudança de formato da API DofusDude.
- Receitas indisponíveis para alguns itens.
- Dados legados com snapshots incompletos.
- Limites do `localStorage` para grandes históricos.

## 17. Rollback

A v2.3.1 pode ser republicada sem migração reversa porque nenhuma chave antiga é removida. As chaves de crafts são independentes e ignoradas pela versão anterior.

## 18. Sequência de implementação

1. Roteador e compatibilidade.
2. Adaptadores de pets e dashboard global.
3. Persistência de crafts.
4. Busca/receitas DofusDude.
5. Projetos, lotes e estoque.
6. Vendas parciais e agregação global.
7. Testes de regressão e build.

## Estabilidade de campos e cursor

Campos editáveis não disparam uma renderização completa durante `input`. O estado é atualizado por caractere, mas o DOM só é reconstruído em `change`, `blur` ou ações explícitas. Pesquisas atualizam somente a listbox correspondente. Dessa forma o nó do campo ativo, a seleção e o cursor permanecem intactos durante a digitação.

## 19. Correções de compatibilidade da versão 3.0.1

- A busca de produto fabricado utiliza apenas índices de itens não classificados como recursos e valida a existência de receita antes de exibir o resultado.
- Os ingredientes são hidratados por `ankama_id` e `item_subtype`, preservando snapshots para uso offline e histórico.
- A receita retornada pela API é imutável na interface; escolhas do usuário alteram somente obtenção, preço e uso de estoque.
- Projetos usam estados `draft` e `ready` para separar planejamento incompleto de uma produção precificada.
- A opção `drop` possui custo financeiro zero e custo econômico baseado no preço informado.
- A preservação de foco foi isolada em `src/utils/focusPreservation.js`, permitindo teste direto sem depender dos identificadores do bundle minificado.

## 20. Evolução compatível da versão 3.0.2

A árvore de receitas é representada pelo próprio campo legado `subRecipe`, agora percorrido de forma recursiva. Nenhum limite de profundidade foi introduzido; referências circulares são bloqueadas pelo `ankama_id` dos ancestrais.

O estoque permanece em `d4b_craft_inventory_v1` e é associado aos ingredientes pelo `ankama_id`. O uso de estoque deixa de ser uma modalidade de aquisição e passa a ser uma quantidade complementar aplicável antes de Comprar, Dropar ou Fabricar.

Os campos financeiros, econômicos e contábeis permanecem aceitos apenas como aliases de migração para dados anteriores. A interface e os novos cálculos utilizam `totalCost` e `unitCost`.

A etiqueta de profissão é armazenada em `professionTag`. Como o catálogo estrutural utilizado pelo módulo não fornece uma profissão diretamente em todas as respostas de receita, a etiqueta é derivada do tipo do item e utiliza `unknown` quando não há correspondência segura.

## 21. Planejador modal de receitas — v3.0.3

A árvore recursiva continua armazenada no projeto por meio de `subRecipe`, sem limite artificial de profundidade. A apresentação, porém, passou a utilizar `craftRecipePlanner.js`.

O modal mantém uma pilha de identificadores em `modal.recipeStack`. Apenas um nível é renderizado por vez, e o breadcrumb permite voltar para qualquer ancestral. Essa separação preserva a recursividade da regra de negócio e evita o crescimento horizontal da interface.

O custo alternativo de fabricação é calculado sem alterar `acquisitionMode`, permitindo comparar a compra do componente pronto com a fabricação recursiva. A mudança de estratégia continua explícita e somente a estratégia escolhida entra no custo final do projeto.

A ação global `copy-name` utiliza o texto já traduzido e exibido na tela. Nenhum identificador técnico ou nome canônico diferente do idioma ativo é copiado.

## Evolução v3.1.0 — contas e preços comunitários

### Configuração em tempo de execução

`public/runtime-config.js` é carregado antes de `src/main.js` e expõe somente a URL pública `/exec` do Web App. Nenhuma credencial privada fica no frontend.

### Camada de contas

- `accountApiService.js`: contrato HTTP com o Apps Script;
- `accountSessionService.js`: persistência local ou por aba;
- `accountPages.js`: telas públicas e Configurações de conta;
- `accountApi.js`: validação central da URL;
- estado `account`: sessão, usuário, servidor e configuração;
- estado `accountUi`: formulários e estados transitórios.

O token é enviado dentro do JSON porque a API do Apps Script foi construída com esse contrato.

### Preços

`communityPriceService.js` percorre a receita de forma recursiva. A consulta é feita em lote por `ankama_id`. O preço comunitário é mantido separado do preço efetivamente usado no projeto.

A digitação altera apenas o estado do ingrediente. O POST ocorre no evento de confirmação do campo ou antes do salvamento. Isso evita requisições por caractere e preserva o cursor.

### Servidores e snapshots

O servidor é congelado em:

- projeto;
- lote;
- item de estoque;
- venda de craft.

O estoque é consolidado apenas quando `ankamaId` e `serverId` coincidem.

### Rolagem e foco

`focusPreservation.js` mantém o elemento ativo e a seleção. `scrollPreservation.js` mantém a rolagem da janela e de elementos identificados por `data-scroll-key` quando a rota não mudou.

### Falha isolada

A indisponibilidade da API de contas não bloqueia os módulos locais. Contas e preços mostram um estado de erro, enquanto Up de Pets, simulações e históricos locais permanecem acessíveis.

