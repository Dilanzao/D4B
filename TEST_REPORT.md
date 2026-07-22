# Relatório de validação — Dofus4Business v2.3.1

Data da validação: 22/07/2026

## Escopo da correção

A versão 2.3.1 foi validada especificamente para:

- utilizar uma única listbox para inclusão de recursos;
- exibir o catálogo inteiro quando não houver pesquisa;
- exibir todos os mascotes ou montascotes do tipo selecionado;
- permitir recurso personalizado na mesma listbox;
- memorizar a XP confirmada de cada recurso no navegador;
- migrar o método antigo `resources` para `combined`;
- manter apenas o método visível **Utilizar Recursos**;
- completar a XP restante com ração ou bolsa somente quando necessário;
- preservar foco e posição do cursor durante recálculos em tempo real.

## Comandos executados

```bash
node --check src/**/*.js
npm run test
npm run test:ui
npm run validate
npm run build
```

## Resultados

### Testes de regras de negócio

Aprovados:

- bônus de XP;
- quantidade conservadora de rações;
- cálculo da quantidade necessária por recurso;
- recurso personalizado;
- evolução combinada;
- cálculo de taxa e lucro da venda;
- payload de venda sem envio do lucro;
- migração de `resources` para `combined`;
- persistência e recuperação da XP informada para um recurso.

### Teste da interface gerada

Aprovados:

- 122 mascotes renderizados na listbox sem pesquisa;
- 125 recursos de teste renderizados na listbox sem truncamento;
- exatamente uma caixa `data-resource-picker-search` no editor;
- opção **Adicionar recurso personalizado** presente dentro da listbox;
- método antigo `data-method="resources"` ausente;
- método unificado `data-method="combined"` presente.

### Validação estrutural

Aprovados:

- versão central igual a `2.3.1`;
- `package.json` e `package-lock.json` na versão correta;
- `.npmrc` apontando para `https://registry.npmjs.org/`;
- nenhuma URL privada ou interna encontrada;
- 147 criaturas preservadas;
- traduções do catálogo preservadas;
- integração de recursos DofusDude preservada;
- serviço `d4b_resource_xp_memory_v1` incluído;
- mecanismos `captureFocusSnapshot` e `restoreFocusSnapshot` presentes;
- todos os arquivos JavaScript passaram por verificação sintática.

### Build

O comando `npm run build` foi executado com sucesso. Como o ambiente de geração não possuía as dependências npm instaladas e não tinha acesso externo ao registro público, o script utilizou o build estático de contingência incluído no projeto.

Em um computador com `npm install` concluído, o mesmo comando detecta o Vite instalado e executa o build otimizado normal. O build de contingência entregue em `dist/` também é publicável em hospedagem estática.

### Limitação do ambiente de geração

A instalação limpa pelo registro público não pôde ser repetida neste ambiente por indisponibilidade de rede externa. Foram validados o `.npmrc`, o `package-lock.json`, todas as URLs `resolved` e a ausência de referências internas. A instalação deve ser executada normalmente no computador do usuário com:

```bash
npm install
```
