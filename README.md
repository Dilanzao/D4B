# Dofus4Business v3.0.0

O Dofus4Business é uma plataforma modular de gestão econômica para jogadores de DOFUS. A versão 3.0.0 transforma a página inicial em um hub de negócios e mantém o módulo legado de **Up de Pets** isolado, enquanto adiciona o primeiro MVP de **Crafts e Produção**.

## O que existe nesta versão

### Página inicial global

- cards de acesso aos módulos;
- indicadores consolidados;
- filtro por módulo e período;
- lucro potencial separado de lucro realizado;
- atividades recentes;
- itens explicitamente marcados como aguardando venda;
- atalhos para nova simulação e novo projeto de craft.

### Up de Pets

O módulo existente foi preservado. Continuam funcionando:

- simulações de mascotes e montascotes;
- bônus de XP;
- Ração Vitaminada, Bolsa de Kolifichas e recursos;
- método combinado;
- memória de XP dos recursos;
- catálogo multilíngue;
- vendas e sincronização existentes;
- dashboard gerencial do módulo;
- migrações e chaves legadas do `localStorage`.

O acesso principal agora é feito por `/pets`, com simulações em `/pets/simulacoes` e vendas em `/pets/vendas`.

### Crafts e Produção

- pesquisa de itens pela API pública DofusDude;
- consulta de receitas e ingredientes;
- quantidade desejada;
- preços manuais;
- compra, uso de estoque ou sub-receita por ingrediente;
- custo financeiro, econômico e contábil;
- comparação entre fabricar e comprar o produto terminado;
- criação e edição de projetos;
- conclusão da produção;
- criação de lote fabricado;
- estoque com custo médio ponderado;
- reserva e disponibilidade;
- venda parcial;
- taxa de 2% para HDV;
- lucro e margem realizados;
- snapshots do item e dos valores históricos.

## Arquitetura

A análise estrutural e as decisões de compatibilidade estão em [ARCHITECTURE.md](./ARCHITECTURE.md).

Resumo:

- Vite;
- JavaScript moderno com módulos ES;
- HTML semântico e CSS responsivo;
- Chart.js para o dashboard legado de vendas de pets;
- `localStorage` com leitura defensiva;
- roteador client-side próprio;
- adaptadores para dados legados;
- métricas fornecidas por módulo;
- API DofusDude usada somente como catálogo estrutural de crafts e recursos.

Não há backend próprio, banco de dados ou autenticação nesta versão.

## Requisitos

- Node.js 20.19 ou superior;
- npm;
- navegador moderno.

## Instalação

```bash
npm install
```

O projeto inclui `.npmrc` configurado para:

```text
registry=https://registry.npmjs.org/
```

## Executar em desenvolvimento

```bash
npm run dev
```

Abra o endereço apresentado pelo Vite, normalmente:

```text
http://localhost:5173/
```

## Build de produção

```bash
npm run build
```

O resultado é gerado em:

```text
dist/
```

Para testar o build:

```bash
npm run preview
```

## Validações

```bash
npm run check
```

Esse comando valida:

- catálogo de criaturas;
- regressões do Up de Pets;
- bônus de XP e recursos;
- rotas modulares;
- custos de crafts;
- lotes, estoque e venda parcial;
- adaptação de vendas legadas;
- agregação global;
- preservação de foco e cursor nos campos numéricos;
- arquivos obrigatórios;
- URLs públicas do `package-lock.json`;
- build e estrutura do `dist`.

## Rotas

| Rota | Função |
|---|---|
| `/` | Hub e dashboard global |
| `/pets` | Painel do módulo legado de Up de Pets |
| `/pets/simulacoes` | Simulações de pets |
| `/pets/simulacoes/nova` | Nova simulação |
| `/pets/simulacoes/:id` | Edição de simulação |
| `/pets/vendas` | Vendas de pets |
| `/crafts` | Módulo de Crafts |
| `/crafts/projetos` | Projetos de produção |
| `/crafts/projetos/novo` | Novo projeto |
| `/crafts/projetos/:id` | Edição do projeto |
| `/crafts/estoque` | Estoque fabricado |
| `/crafts/vendas` | Vendas de crafts |
| `/vendas` | Vendas globais |
| `/estoque` | Itens globais aguardando venda |
| `/configuracoes` | Preferências |

O `404.html` preserva deep links no GitHub Pages e redireciona o navegador de volta para a rota solicitada.

## Persistência e retrocompatibilidade

As chaves anteriores não são apagadas nem renomeadas. O Up de Pets continua usando sua persistência original. Crafts utiliza chaves independentes:

```text
d4b_craft_projects_v1
d4b_craft_batches_v1
d4b_craft_inventory_v1
d4b_craft_sales_v1
d4b_craft_prices_v1
d4b_global_activities_v1
```

Vendas antigas de pets são convertidas apenas **em memória** por `legacyPetSalesAdapter`. Os registros originais não são modificados.

### Rollback

A versão anterior pode ser republicada sem apagar as chaves novas. Ela simplesmente não as utiliza. Antes de uma atualização em produção, recomenda-se manter uma cópia do repositório ou uma tag Git.

## Correção do cursor nos campos numéricos

Campos que alimentam cálculos em tempo real não provocam mais uma reconstrução completa da tela a cada caractere. Durante o evento `input`, o estado é atualizado sem `render()` integral. Quando uma renderização externa for inevitável, o sistema captura e restaura:

- elemento ativo;
- posição inicial do cursor;
- posição final da seleção;
- rolagem horizontal do campo.

Isso foi aplicado aos campos de pets, recursos, projetos de craft, ingredientes, estoque e modais de venda.

## DofusDude

O módulo de Crafts consulta o catálogo estrutural em tempo de uso para pesquisar itens, obter `ankama_id`, nomes, imagens, níveis, tipos e receitas. Preços, projetos, estoque, lotes e vendas permanecem locais.

A indisponibilidade da API não impede a abertura do Up de Pets nem dos históricos já salvos. Vendas históricas utilizam snapshots e não dependem da API para serem reconstruídas.

## GitHub Pages e domínio próprio

O projeto contém:

- `public/CNAME` para `dofus4business.com.br`;
- workflow em `.github/workflows/deploy-pages.yml`;
- `404.html` preparado para rotas da SPA;
- caminhos relativos de assets.

Fluxo de publicação:

```bash
npm install
npm run check
npm run build
git add .
git commit -m "Dofus4Business v3.0.0"
git push
```

## Google AdSense

Os quatro locais continuam identificados:

```text
ad-slot-header
ad-slot-sidebar
ad-slot-middle
ad-slot-footer
```

Enquanto `ADS_ENABLED` estiver como `false`, aparecem placeholders discretos. O código real do AdSense deve ser carregado apenas após o consentimento aplicável. Não confunda placeholders com anúncios reais.

## Versionamento

- **PATCH:** correção de bug compatível;
- **MINOR:** nova funcionalidade compatível;
- **MAJOR:** alteração estrutural ou incompatível.

A versão central está em:

```js
export const APP_VERSION = "3.0.0";
```

## Estrutura resumida

```text
dofus4business/
├── ARCHITECTURE.md
├── CHANGELOG.md
├── README.md
├── TEST_REPORT.md
├── package.json
├── package-lock.json
├── vite.config.js
├── public/
├── scripts/
└── src/
    ├── components/
    ├── config/
    ├── data/
    ├── i18n/
    ├── modules/
    │   ├── crafts/
    │   ├── global/
    │   └── pets/
    ├── router/
    ├── services/
    ├── state/
    ├── styles/
    └── utils/
```
