# Relatório de validação — Dofus4Business v3.0.3

Data da validação: 04/08/2026.

## Escopo validado

- preservação dos cálculos e dados do módulo Up de Pets;
- planejador modal de receitas recursivas;
- navegação por breadcrumb entre níveis de sub-receita;
- ausência de indentação horizontal progressiva;
- profissão somente em itens fabricáveis;
- comparação entre comprar o componente pronto e fabricá-lo;
- preço de mercado editável mesmo com a estratégia Fabricar;
- cópia de nomes pelo ícone no idioma exibido;
- preservação de foco e cursor nos campos numéricos;
- catálogo multilíngue de criaturas e recursos;
- build estático e validação estrutural.

## Comandos executados

```bash
find src scripts -name '*.js' -print0 | xargs -0 -n1 node --check
npm run check
npm run build
```

Também foi servido o conteúdo de `dist/` com um servidor HTTP local. A página inicial respondeu com status HTTP 200.

## Resultados

- 147 criaturas geradas e validadas;
- 122 mascotes renderizados sem truncamento;
- 125 recursos de teste renderizados sem truncamento;
- smoke tests aprovados;
- testes de interface aprovados;
- teste de DOM/build aprovado;
- validação estrutural aprovada;
- teste do planejador modal aprovado;
- teste da ação de copiar nomes aprovado;
- teste de preservação de cursor aprovado;
- nenhuma URL privada encontrada no `package-lock.json`;
- todos os campos `resolved` do lock apontam para `https://registry.npmjs.org/`.

## Instalação npm no ambiente de geração

O ambiente de geração força por variável de ambiente um registry interno sobre o `.npmrc` do projeto. Por isso, a execução de `npm ci` neste ambiente tentou acessar esse registry e não pôde ser usada como prova de instalação pública.

O arquivo entregue contém:

```text
registry=https://registry.npmjs.org/
```

O `package-lock.json` foi validado e possui somente URLs públicas do npm. A instalação deve ser executada normalmente no computador do usuário com `npm install` ou `npm ci`.

## Observações não bloqueantes

O validador do catálogo encontrou cinco pares de criaturas que compartilham imagens. Esses avisos já existiam na base e não impedem o funcionamento do site.
