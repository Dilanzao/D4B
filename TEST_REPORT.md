# Relatório de validação — Dofus4Business v3.0.0

Data da validação: 03/08/2026.

## Resultado

A suíte `npm run check` foi concluída com sucesso no ambiente de geração.

## Testes executados

### Regressão do Up de Pets

- catálogo com 147 criaturas preservado;
- filtro entre Mascote e Montascote preservado;
- nomes multilíngues preservados;
- bônus de 50% transforma 500 XP em 750 XP;
- quantidade de rações arredondada para cima;
- método legado `resources` migra para `combined`;
- memória de XP dos recursos preservada;
- cenário de venda de referência mantém taxa de 37.000 K e lucro de 63.000 K;
- payload antigo de vendas não envia o lucro.

### Rotas e módulos

- `/` abre o hub global;
- `/pets/simulacoes` abre as simulações legadas;
- `/pets/simulacoes/:id` reconhece o identificador;
- `/crafts/projetos/novo` abre novo projeto;
- `/crafts/projetos/:id` reconhece o projeto;
- `/crafts/estoque`, `/vendas` e `/estoque` estão mapeadas;
- `404.html` preserva deep links do GitHub Pages.

### Crafts e Produção

- cálculo de ingredientes por quantidade;
- separação de custo financeiro e econômico;
- valorização econômica dos recursos retirados do estoque;
- custos adicionais;
- comparação com compra do produto terminado;
- criação normalizada de projeto;
- criação de lote;
- criação de estoque;
- custo médio ponderado;
- cálculo de venda parcial;
- taxa de 2% no HDV;
- custo e lucro congelados na venda.

### Agregação global

- venda antiga de pet adaptada em memória;
- registro original não alterado;
- venda de craft consolidada com vendas de pets;
- filtro por módulo;
- filtro por período personalizado;
- nenhum registro duplicado na agregação do cenário de teste.

### Cursor e campos numéricos

Foram validados dois mecanismos:

1. eventos `input` alteram o estado sem disparar renderização integral;
2. renderizações inevitáveis capturam e restauram foco e seleção com `selectionStart`, `selectionEnd` e `setSelectionRange`.

A validação cobre campos numéricos de pets, recursos, custos, ingredientes, estoque e vendas.

### Estrutura e segurança do pacote

- `.npmrc` aponta para `https://registry.npmjs.org/`;
- `package-lock.json` contém somente URLs públicas do npm;
- não há caminhos temporários do ambiente de geração no projeto entregue;
- não há referências a registries internos da OpenAI;
- arquivos obrigatórios presentes;
- anúncios continuam desabilitados até configuração real;
- build estático de contingência gerado com sucesso;
- estrutura do `dist/` validada.

## Observação sobre instalação no ambiente de geração

O ambiente utilizado para gerar o artefato não disponibilizou acesso direto ao pacote Vite durante esta execução. Por isso, a validação local utilizou o build estático de contingência incluído no projeto. O `package-lock.json` e o `.npmrc` permanecem apontados exclusivamente para o registro público, e os comandos padrão estão preparados para execução normal fora desse ambiente:

```bash
npm install
npm run dev
npm run build
npm run preview
```
