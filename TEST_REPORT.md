# Relatório de testes — Dofus4Business v3.1.0

Data: 5 de agosto de 2026

## Resultado

`npm run check`: **aprovado**.

## Validações executadas

- catálogo com 147 criaturas;
- 122 mascotes renderizados sem truncamento;
- 125 recursos renderizados sem truncamento;
- regressão dos cálculos do Up de Pets;
- cálculo de bônus de XP e quantidades;
- cálculo de venda legada com lucro esperado;
- pesquisa de crafts sem categoria Recurso;
- hidratação de nome e imagem dos ingredientes;
- receitas recursivas;
- uso e consumo de estoque;
- venda parcial de crafts;
- rotas antigas e novas;
- rotas de contas;
- preços comunitários recursivos;
- preservação de preço digitado manualmente;
- identificação de preço desatualizado;
- envio pendente de preços;
- snapshot de servidor;
- preservação do foco e do cursor;
- preservação da rolagem da sub-receita;
- validação do arquivo de configuração em tempo de execução;
- ausência de registries privados no `package-lock.json`;
- validação estrutural do projeto;
- build estático de contingência;
- teste do conteúdo de `dist`.

## Observações

A URL real da implantação do Google Apps Script não foi fornecida durante a geração. Por esse motivo, a integração foi validada contra o contrato do `Code.gs`, por testes de fonte e serviços, mas não foi realizado login contra a implantação real.

O ambiente de geração não conseguiu instalar o Vite pelo registro público. O script de build acionou corretamente o build estático de contingência. Em uma máquina com acesso normal ao npm, `npm install` permite o build padrão com Vite.
