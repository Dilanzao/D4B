# Dofus4Business v2.3.1

Aplicação web estática para simular a compra, evolução e venda de mascotes e montascotes no DOFUS, controlar vendas reais e analisar resultados econômicos.

A versão 2.3.1 preserva as funções anteriores e corrige o fluxo de seleção e uso de recursos:

- uma única listbox para pesquisar, escolher ou cadastrar um recurso personalizado;
- catálogo completo exibido quando o campo de pesquisa está vazio;
- listagem completa de mascotes e montascotes antes da pesquisa;
- recurso escolhido exibido com nome e imagem;
- memorização da XP por recurso no navegador;
- método unificado **Utilizar Recursos**, com complemento automático por ração ou bolsa somente quando necessário;
- recursos podem cobrir 100% da XP sem custo de complemento;
- preservação do foco e do cursor nos campos durante os recálculos automáticos.

## Tecnologia

- Vite 8;
- JavaScript moderno com módulos ES;
- HTML semântico;
- CSS responsivo sem framework visual;
- Chart.js pelo pacote público oficial do npm;
- `localStorage` para persistência;
- hospedagem estática, sem backend próprio obrigatório.

## Requisitos

- Node.js 20.19 ou superior;
- npm 10 ou superior recomendado;
- navegador moderno com JavaScript habilitado.

O `.npmrc` força o registro público:

```text
registry=https://registry.npmjs.org/
```

## Instalação e execução

Dentro da pasta do projeto:

```bash
npm install
npm run dev
```

O endereço local normalmente será:

```text
http://localhost:5173/
```

## Build e preview

```bash
npm run build
npm run preview
```

O build publicável é gerado em:

```text
dist/
```

O preview normalmente usa:

```text
http://localhost:4173/
```

## Validação completa

```bash
npm run check
```

O comando:

1. regenera o catálogo de criaturas;
2. valida IDs, tipos, traduções e imagens;
3. testa cálculos, bônus, recursos e vendas;
4. testa a integração do catálogo de recursos com uma resposta simulada da API;
5. compila o site e executa teste de DOM;
6. procura referências internas, registries privados e arquivos ausentes.

## Bônus de XP

Cada simulação possui o campo **Bônus de XP** na etapa de níveis. Exemplos:

```text
0%   = sem bônus
50%  = cada fonte fornece 1,5 vez a XP normal
100% = cada fonte fornece o dobro da XP normal
```

Fórmula:

```text
XP efetiva por unidade = XP base × (1 + bônus ÷ 100)
Quantidade necessária = arredondar para cima(XP necessária ÷ XP efetiva por unidade)
```

O bônus é aplicado a:

- Ração Vitaminada;
- rações obtidas por Bolsa de Kolifichas;
- recursos catalogados;
- recursos personalizados;
- recursos usados em combinação com ração ou bolsa.

O cálculo é conservador: a quantidade sempre é arredondada para cima.

O bônus é salvo na simulação e também acompanha uma venda originada dela. Simulações antigas recebem `0%` por migração defensiva.

## Métodos de evolução

A calculadora oferece três estratégias:

1. **Ração Vitaminada:** todo o XP é completado com rações compradas no mercado.
2. **Bolsa de Kolifichas:** calcula rações, Kolifichas, bolsas inteiras e sobras.
3. **Utilizar Recursos:** soma a XP dos recursos adicionados e completa automaticamente apenas o restante com Ração Vitaminada ou Bolsa de Kolifichas. Se os recursos alcançarem 100% da XP, nenhum complemento é utilizado.

Somente o método explicitamente selecionado entra no custo do UP.

## Quantidade necessária por recurso

Cada linha do editor mostra:

- XP base;
- XP efetiva após o bônus;
- quantidade que o usuário planeja usar;
- quantidade necessária caso aquele recurso fosse usado sozinho;
- XP total da linha;
- preço unitário;
- custo total.

O botão **Usar quantidade** preenche automaticamente a quantidade necessária para alcançar o nível apenas com aquele recurso.

Recursos personalizados também possuem esse cálculo, desde que uma XP unitária maior que zero seja informada.

## Catálogo completo de recursos — DofusDude

Ao abrir o site, o navegador solicita o catálogo em:

```text
https://api.dofusdu.de/dofus3/v1/{idioma}/items/resources/all
```

Idiomas usados:

```text
pt-BR → pt
fr-FR → fr
en-US → en
es-ES → es
```

O catálogo fornece:

- ID Ankama;
- nome localizado;
- nível do recurso;
- imagem, quando disponível.

O retorno fica em cache por sete dias para evitar downloads repetidos. O ID interno permanece ligado ao ID Ankama, permitindo trocar o idioma sem perder o recurso selecionado.

### Limitação importante da API

A API de recursos fornece o catálogo dos itens, mas não informa a XP específica que cada item concede ao alimentar um mascote. Por isso:

- recursos já presentes no guia incorporado recebem XP automaticamente;
- recursos sem XP confirmada continuam selecionáveis;
- nesses casos, a interface pede que o usuário informe a XP observada no jogo ou confirmada em uma fonte confiável;
- uma linha sem XP não entra no custo nem na XP até que o valor seja informado.

Se a API estiver indisponível, o site utiliza automaticamente o catálogo reduzido incorporado em:

```text
src/data/feedingResources.js
```

Serviço de integração:

```text
src/services/resourceCatalogService.js
```

## Catálogo de criaturas

A fonte principal é:

```text
src/data/catalog-source.tsv
```

Ela contém tipo, nomes em português, francês, inglês e espanhol, além da URL de imagem. Para regenerar:

```bash
npm run generate:catalog
npm run validate:catalog
```

A troca de idioma altera o nome exibido sem mudar o ID interno da criatura.

## Simulações

O fluxo possui cinco etapas:

1. escolha da criatura;
2. níveis, XP atual e bônus;
3. método de evolução e recursos;
4. custos e venda estimada;
5. revisão e salvamento.

Novas simulações começam com nível de destino 100. Simulações antigas, editadas e duplicadas mantêm seus valores.

Os cards exibem diretamente:

- editar;
- duplicar;
- registrar venda;
- ver detalhes;
- excluir.

Quando houver bônus, ele aparece no card e nos detalhes.

## Vendas

Uma venda é criada a partir de uma simulação salva. O modal permite confirmar:

- custo real da criatura;
- custo real do UP;
- preço vendido;
- canal;
- data e hora.

A integração existente está em:

```text
src/config/salesApi.js
src/services/salesService.js
```

O envio é assíncrono e não bloqueia a navegação. URL, chave e payload não são exibidos ao jogador nem registrados no console.

A exclusão remove apenas o histórico local deste navegador. Não existe API de exclusão remota.

## Painel gerencial

O painel usa exclusivamente vendas registradas. Inclui filtros, KPIs e gráficos de:

- receita, custo e lucro;
- quantidade de vendas;
- Mascote x Montascote;
- canais de venda;
- criaturas mais lucrativas;
- retorno sobre investimento;
- métodos de evolução;
- distribuição de resultados;
- melhores períodos.

## Idiomas

Idiomas disponíveis:

- português do Brasil;
- francês;
- inglês;
- espanhol.

Traduções ficam em:

```text
src/i18n/translations.js
```

A lista de criaturas e o catálogo remoto de recursos acompanham o idioma ativo.

## Consentimento e privacidade

Na primeira visita, o site apresenta preferências por categoria:

- Essenciais;
- Preferências;
- Análise;
- Publicidade.

Análise e publicidade começam desativadas. Nenhum provedor de análise ou publicidade é carregado nesta versão.

A decisão pode ser alterada pelo rodapé. O estado é salvo em:

```text
d4b_consent_v2
```

Quando o Google AdSense for ativado para usuários de regiões que exigem uma plataforma de consentimento certificada, a implementação deverá ser conectada a uma CMP certificada ou ao recurso apropriado do Google Privacy & Messaging.

## Locais preparados para Google AdSense

Os quatro espaços permanecem reservados no desenvolvimento e no build:

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

Enquanto estiver `false`, é mostrado apenas o placeholder de publicidade. Para integrar AdSense:

1. mantenha os IDs;
2. conecte o script no ponto preparado em `src/services/consentService.js`;
3. utilize os contêineres criados por `src/components/common.js`;
4. altere `ADS_ENABLED` apenas após configurar a conta;
5. não carregue publicidade antes da autorização aplicável.

## Apoio por PIX

Chave configurada:

```text
Apoie@dofus4business.com.br
```

A cópia usa Clipboard API com fallback nativo.

## Persistência e migração

Chaves principais:

```text
d4b_language_v2
d4b_simulations_v2
d4b_sales_v2
d4b_preferences_v2
- `d4b_resource_xp_memory_v1`: XP confirmada pelo usuário para cada recurso já utilizado.
d4b_consent_v2
```

A leitura é defensiva. Dados antigos são migrados sem apagar automaticamente simulações, vendas, idioma ou consentimento válido.

## Estrutura resumida

```text
dofus4business/
├── .github/workflows/deploy-pages.yml
├── .npmrc
├── CHANGELOG.md
├── README.md
├── TEST_REPORT.md
├── index.html
├── package.json
├── package-lock.json
├── public/
├── scripts/
└── src/
    ├── components/
    ├── config/
    ├── data/
    ├── i18n/
    ├── services/
    ├── state/
    ├── styles/
    └── utils/
```

## Publicação no GitHub Pages

O projeto inclui:

```text
.github/workflows/deploy-pages.yml
public/CNAME
```

Domínio configurado:

```text
dofus4business.com.br
```

Procedimento:

1. envie o projeto para o GitHub;
2. abra **Settings → Pages**;
3. escolha publicação por GitHub Actions;
4. confirme o domínio personalizado;
5. mantenha os registros DNS do domínio apontados ao GitHub Pages;
6. aguarde a emissão do HTTPS.

O Vite usa caminhos relativos, permitindo publicação em domínio próprio ou caminho de projeto.

## Publicação em outras hospedagens

Após:

```bash
npm run build
```

publique todo o conteúdo de `dist/` em Netlify, Vercel, Cloudflare Pages, Hostinger, Firebase Hosting, Apache, Nginx ou outro servidor estático.

## Atualização da versão

A versão central fica em:

```text
src/config/app.js
```

Use versionamento semântico:

- PATCH: correções de bugs;
- MINOR: funcionalidades compatíveis;
- MAJOR: alterações incompatíveis.

Também atualize `package.json`, gere novamente o `package-lock.json` e registre a alteração no `CHANGELOG.md`.

## Solução de problemas

### npm tentando usar registro incorreto

```bash
npm config set registry https://registry.npmjs.org/ --location=project
npm install
```

### Catálogo completo de recursos não carregou

- verifique a conexão do navegador;
- confirme se `https://api.dofusdu.de` está acessível;
- use o botão de tentar novamente;
- o catálogo incorporado continuará disponível como fallback.

### Recurso aparece sem XP

Isso significa que o item existe no catálogo do jogo, mas a XP de alimentação não está confirmada no catálogo local. Informe a XP unitária antes de calcular a quantidade e o custo.

### Build antigo no GitHub Pages

- confirme a execução do workflow;
- limpe o cache do navegador;
- verifique se `dist/` foi gerada com a versão atual;
- confirme que o `CNAME` está presente no artefato publicado.
