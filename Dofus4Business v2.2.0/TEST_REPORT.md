# Relatório de validação — Dofus4Business v2.2.0

Data da validação: 16/07/2026

## Ambiente utilizado

```text
Node.js: v22
Registro npm: https://registry.npmjs.org/
Build: Vite 8.1.4
Gráficos: Chart.js 4.4.9
```

## Comandos executados

```bash
npm install
npm run check
npm run build
npm run dev
npm run preview
```

## Resultado da instalação

A instalação limpa pelo registro público foi concluída. O `package-lock.json` contém somente URLs de pacotes iniciadas por:

```text
https://registry.npmjs.org/
```

Não foram encontradas referências a registries internos, caminhos temporários do ambiente de geração ou dependências privadas.

## Catálogo de criaturas

Resultado:

```text
147 criaturas importadas
122 Mascotes
25 Montascotes
```

Validações executadas:

- IDs;
- tipos;
- traduções em português, francês, inglês e espanhol;
- URLs de imagens;
- espaços e valores obrigatórios;
- imagens compartilhadas.

Foram identificadas cinco imagens compartilhadas entre variantes do catálogo. Elas foram mantidas como avisos não bloqueantes porque o próprio catálogo fornecido associa essas entradas à mesma imagem.

Também foi testado que “Piuta Azul” muda para:

```text
Francês: Pioute bleu
Inglês: Blue Piwin
Espanhol: Piotín azul
```

## Logotipo

Foram verificados:

- uso do arquivo enviado pelo proprietário;
- remoção somente da área branca externa;
- presença de canal alfa;
- favicon em PNG/ICO;
- ícones de 192 px e 512 px;
- versão otimizada para o cabeçalho;
- proporção preservada.

## Cálculos

Testes executados:

- XP entre níveis;
- Ração Vitaminada;
- Bolsa de Kolifichas;
- alimentação por recursos;
- recurso catalogado;
- recurso personalizado;
- combinação de recursos com complemento por ração;
- combinação de recursos com complemento por bolsa;
- custo da operação;
- taxa fixa do HDV;
- lucro líquido.

Cenário de referência:

```text
Preço de venda: 1.850.000 K
Taxa de 2%:       37.000 K
Custo inicial:   838.000 K
Custo do UP:     912.000 K
Lucro:            63.000 K
```

Resultado: aprovado.

## Consentimento

O teste de DOM confirmou:

1. o banner aparece sem decisão salva;
2. “Rejeitar não essenciais” salva Preferências, Análise e Publicidade como `false`;
3. o banner deixa de aparecer após a decisão;
4. os atributos `data-consent-*` do documento são atualizados;
5. o modal pode ser reaberto pelo rodapé;
6. uma escolha parcial ou total é salva imediatamente;
7. a categoria Publicidade pode mudar de `false` para `true` sem recarregar a aplicação;
8. nenhum script de publicidade ou análise é carregado porque não há provedor configurado e `ADS_ENABLED` permanece `false`.

## Simulações

Verificações:

- nome personalizado em destaque;
- nome oficial traduzido como informação secundária;
- todas as cinco ações presentes diretamente no card;
- ausência do botão “Mais opções” na galeria;
- criação, edição, duplicação, detalhes, venda e exclusão;
- nível 100 como padrão somente em novas simulações;
- recursos editáveis;
- recursos personalizados editáveis;
- cálculo atualizado após alterações.

## Publicidade

Os quatro espaços foram encontrados no DOM e no build:

```text
ad-slot-header
ad-slot-sidebar
ad-slot-middle
ad-slot-footer
```

Com `ADS_ENABLED = false`, todos permanecem como placeholders identificados. A montagem de publicidade real depende simultaneamente de:

- `ADS_ENABLED = true`;
- consentimento de Publicidade;
- inclusão futura do provedor no ponto preparado.

## Build

Resultado mais recente:

```text
Vite: build concluído
Pasta: dist/
JavaScript principal: aproximadamente 469 kB antes de gzip
CSS principal: aproximadamente 29 kB antes de gzip
```

O pós-build copiou os arquivos necessários para GitHub Pages, incluindo `CNAME`.

## Teste de DOM

Executado com `happy-dom` sobre o bundle compilado.

Itens verificados:

- título `Dofus4Business v2.2.0`;
- cabeçalho;
- novo logotipo;
- navegação;
- banner de cookies;
- ações de consentimento;
- quatro anúncios reservados;
- botão de nova simulação;
- rodapé;
- ausência de erros durante a renderização inicial.

Resultado: aprovado.

## Servidores locais

Foram iniciados e consultados:

```text
npm run dev
npm run preview
```

Ambos serviram o documento principal com resposta HTTP 200.

## Resultado final

```text
npm install: aprovado
npm run dev: aprovado
npm run build: aprovado
npm run preview: aprovado
npm run check: aprovado
Catálogo: aprovado com 5 avisos não bloqueantes
Cálculos mistos: aprovado
Consentimento funcional: aprovado
Build estático: aprovado
Registro público npm: aprovado
```
