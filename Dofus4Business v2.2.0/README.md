# Dofus4Business v2.2.0

Aplicação web estática para simular a compra, evolução e venda de mascotes e montascotes no DOFUS, controlar vendas reais e analisar resultados econômicos.

A versão 2.2.0 preserva a calculadora, simulações, painel gerencial, histórico de vendas, integração de vendas, idiomas, consentimento, apoio por PIX e preparação para publicidade. Também adiciona o novo logotipo oficial, corrige a tradução dinâmica das criaturas e permite combinar alimentação por recursos com Ração Vitaminada ou Bolsa de Kolifichas.

## Tecnologia

- Vite 8;
- JavaScript moderno com módulos ES;
- HTML semântico;
- CSS responsivo sem framework visual;
- Chart.js pelo pacote público oficial do npm;
- `localStorage` para dados locais;
- hospedagem estática, sem servidor próprio obrigatório.

## Requisitos

- Node.js 20.19 ou superior;
- npm 10 ou superior recomendado;
- navegador moderno com JavaScript habilitado.

O projeto possui `.npmrc` com o registro público:

```text
registry=https://registry.npmjs.org/
```

## Instalação e execução local

No terminal, dentro da pasta do projeto:

```bash
npm install
npm run dev
```

O Vite informará o endereço local, normalmente:

```text
http://localhost:5173/
```

## Build e preview

```bash
npm run build
npm run preview
```

O build é gerado em:

```text
dist/
```

O preview normalmente abre em:

```text
http://localhost:4173/
```

## Validação completa

```bash
npm run check
```

Esse comando:

1. gera o catálogo a partir do TSV;
2. valida IDs, tipos, traduções e imagens do catálogo;
3. executa testes de cálculo;
4. executa um teste de DOM no build;
5. valida dependências, registries, arquivos e referências proibidas.

## Funcionalidades

### Simulações

O fluxo possui cinco etapas:

1. escolha da criatura;
2. níveis de origem e destino;
3. método de evolução;
4. custos e venda estimada;
5. revisão e salvamento.

Cada nova simulação começa com nível de destino 100. Simulações antigas, editadas ou duplicadas mantêm seus próprios níveis.

Os cards exibem diretamente:

- editar;
- duplicar;
- registrar venda;
- ver detalhes;
- excluir.

O nome definido pelo usuário é o título principal. O nome oficial da criatura, traduzido conforme o idioma ativo, aparece como informação secundária.

### Métodos de evolução

A calculadora oferece:

- Ração Vitaminada comprada no mercado;
- Bolsa de Kolifichas;
- alimentação somente por recursos;
- combinação de recursos com complemento por Ração Vitaminada ou Bolsa de Kolifichas.

No método combinado, a aplicação:

1. soma a XP dos recursos selecionados;
2. calcula a XP ainda faltante;
3. completa apenas a parte restante com a fonte escolhida;
4. soma o custo dos recursos e o custo do complemento;
5. não cobra simultaneamente métodos que não foram selecionados.

### Recursos

O projeto contém um catálogo inicial incorporado com referências de XP disponíveis no guia de evolução informado pelo proprietário. Como qualquer recurso compatível pode ser usado no jogo, o editor também permite adicionar uma entrada personalizada informando:

- nome do recurso;
- XP unitária confirmada pelo usuário;
- quantidade;
- preço unitário.

As linhas podem ser alteradas e excluídas. Recursos do catálogo permitem trocar o item por outro item catalogado; recursos personalizados permitem editar nome e XP.

Os dados personalizados permanecem na simulação e são considerados imediatamente nos cálculos, inclusive quando o painel é recolhido.

### Catálogo de criaturas

A fonte principal é:

```text
src/data/catalog-source.tsv
```

O arquivo contém:

- tipo;
- nome em português;
- nome em francês;
- nome em inglês;
- nome em espanhol;
- URL de imagem.

Para regenerar e validar:

```bash
npm run generate:catalog
npm run validate:catalog
```

A troca de idioma altera o nome exibido sem alterar o ID interno da criatura. A busca considera o idioma ativo, o nome canônico e todas as traduções.

### Imagens e logotipo

O logotipo enviado pelo proprietário foi processado somente para remover a área branca externa. O desenho não foi recriado.

Arquivos principais:

```text
public/assets/brand/logo.png
public/assets/brand/logo.webp
public/assets/brand/logo-header.webp
public/assets/brand/icon-192.png
public/assets/brand/icon-512.png
public/favicon.ico
public/apple-touch-icon.png
```

As imagens das criaturas utilizam as URLs associadas ao catálogo. Falhas de carregamento usam o placeholder do projeto.

### Vendas

Uma venda é criada a partir de uma simulação salva. O modal permite confirmar os custos reais, preço, canal e data/hora.

A integração existente é preservada em:

```text
src/config/salesApi.js
src/services/salesService.js
```

O envio é assíncrono e não bloqueia a navegação. A chave técnica não é mostrada na interface, em mensagens ou no console.

Excluir uma venda remove somente o registro local deste navegador. Os detalhes dessa limitação aparecem na área **Sobre e transparência → Privacidade e dados**, sem repetir avisos técnicos nos cards.

### Painel gerencial

O painel usa somente vendas registradas pelo usuário. Sem vendas, exibe um estado vazio.

Inclui:

- filtros globais;
- KPIs de receita, custo, lucro, margem e ticket;
- evolução financeira;
- quantidade de vendas;
- Mascote x Montascote;
- canais de venda;
- criaturas mais lucrativas;
- retorno sobre investimento;
- métodos de evolução;
- distribuição de resultados;
- melhores períodos.

### Idiomas

Idiomas disponíveis:

- português do Brasil;
- francês;
- inglês;
- espanhol.

Textos ficam em:

```text
src/i18n/translations.js
```

O idioma somente é persistido quando a categoria **Preferências** estiver autorizada. Mesmo sem essa autorização, a troca funciona durante a sessão atual e não apaga simulações ou vendas.

## Consentimento e privacidade

Na primeira visita, o site mostra o gerenciador de preferências. A política atual usa a versão `1.1`.

Categorias:

- **Essenciais:** necessárias para simulações, vendas e funcionamento;
- **Preferências:** idioma e configurações persistentes;
- **Análise:** reservada para uma futura ferramenta de métricas;
- **Publicidade:** reservada para anúncios e medição publicitária.

Efeitos reais:

- rejeitar preferências remove idioma/configurações persistentes, sem apagar simulações e vendas;
- análise não inicializa sem autorização;
- publicidade não inicializa sem autorização;
- a decisão é salva em `d4b_consent_v2`;
- os atributos `data-consent-*` no elemento `<html>` refletem imediatamente a escolha;
- a decisão pode ser alterada pelo rodapé.

Nenhum provedor de análise ou publicidade é carregado nesta versão.

## Locais preparados para Google AdSense

Os espaços estão sempre reservados para evitar mudanças bruscas de layout:

```text
ad-slot-header
ad-slot-sidebar
ad-slot-middle
ad-slot-footer
```

Configuração central:

```javascript
export const ADS_ENABLED = false;
```

Enquanto estiver `false`, o site exibe o placeholder “Publicidade” e uma mensagem de manutenção.

Para ativar anúncios futuramente:

1. mantenha os mesmos IDs;
2. conecte o código real no ponto indicado em `src/services/consentService.js` e no contêiner criado por `src/components/common.js`;
3. altere `ADS_ENABLED` somente depois da configuração;
4. não carregue scripts publicitários antes da autorização da categoria Publicidade;
5. configure a solução de consentimento apropriada para as regiões atendidas antes de publicar anúncios personalizados.

Os placeholders não imitam anúncios, não ficam junto a botões de ação e não incentivam cliques.

## Apoio por PIX

A área de apoio usa a chave:

```text
Apoie@dofus4business.com.br
```

O botão de cópia utiliza Clipboard API com fallback nativo.

## Persistência e migração

Chaves principais:

```text
d4b_language_v2
d4b_simulations_v2
d4b_sales_v2
d4b_preferences_v2
d4b_consent_v2
```

A migração tenta recuperar dados das versões anteriores e associar criaturas por ID ou nomes normalizados. Registros não associados são preservados com imagem de fallback.

## Publicação no GitHub Pages

O projeto inclui:

```text
.github/workflows/deploy-pages.yml
public/CNAME
```

O domínio configurado é:

```text
dofus4business.com.br
```

Fluxo recomendado:

1. crie um repositório no GitHub;
2. envie todos os arquivos do projeto;
3. em **Settings → Pages**, selecione a publicação por GitHub Actions;
4. confirme o domínio personalizado;
5. ajuste os registros DNS conforme as instruções exibidas pelo GitHub;
6. aguarde a emissão do HTTPS.

O Vite usa caminhos relativos no build, permitindo publicar tanto em domínio próprio quanto em uma pasta de GitHub Pages.

## Publicação manual em hospedagem estática

Depois de executar:

```bash
npm run build
```

publique todo o conteúdo da pasta `dist/` em:

- Netlify;
- Vercel;
- Cloudflare Pages;
- Hostinger;
- Firebase Hosting;
- Apache;
- Nginx;
- outro servidor de arquivos estáticos.

## Atualização de dados

### Criaturas

Edite `src/data/catalog-source.tsv`, depois execute:

```bash
npm run generate:catalog
npm run validate:catalog
```

### Recursos

Edite:

```text
src/data/feedingResources.js
```

Somente adicione valores de XP confirmados. Não invente traduções ou XP ausentes. A entrada personalizada no aplicativo cobre itens ainda não incorporados ao catálogo.

### Traduções

Edite:

```text
src/i18n/translations.js
```

Toda nova chave de interface deve existir nos quatro idiomas.

### Versão

A fonte central é:

```javascript
export const APP_VERSION = "2.2.0";
```

Também atualize `package.json` e `CHANGELOG.md` no mesmo commit.

Versionamento semântico:

- **PATCH:** correções compatíveis;
- **MINOR:** novas funcionalidades compatíveis;
- **MAJOR:** alterações incompatíveis.

## Estrutura resumida

```text
dofus4business/
├── .github/workflows/deploy-pages.yml
├── .gitignore
├── .npmrc
├── CHANGELOG.md
├── README.md
├── TEST_REPORT.md
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── public/
│   ├── CNAME
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-32.png
│   ├── apple-touch-icon.png
│   ├── manifest.webmanifest
│   ├── robots.txt
│   ├── sitemap.xml
│   └── assets/
├── scripts/
│   ├── generate-catalog.js
│   ├── validate-catalog.js
│   ├── validate-project.js
│   ├── smoke-test.js
│   ├── dom-smoke-test.js
│   └── postbuild.js
├── src/
│   ├── components/
│   ├── config/
│   ├── data/
│   ├── i18n/
│   ├── services/
│   ├── state/
│   ├── styles/
│   └── utils/
└── dist/
```

## Erros comuns

### `ETIMEDOUT` apontando para registro interno

Confirme:

```bash
npm config get registry
```

O resultado deve ser:

```text
https://registry.npmjs.org/
```

Depois execute:

```bash
rm -rf node_modules
npm install
```

No PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

### A porta já está ocupada

```bash
npm run dev -- --port 5174
```

### Catálogo alterado, mas a interface não mudou

```bash
npm run generate:catalog
npm run build
```

### Dados antigos inconsistentes

Faça backup do armazenamento do navegador antes de limpar dados. A aplicação tenta migrar versões anteriores automaticamente.

## Propriedade intelectual

Dofus4Business é uma ferramenta independente criada pela comunidade e não possui vínculo, patrocínio, aprovação ou afiliação com a Ankama. DOFUS, seus nomes, personagens, imagens, marcas e demais conteúdos relacionados pertencem aos seus respectivos proprietários. As referências são utilizadas para fins informativos e de apoio à comunidade.
