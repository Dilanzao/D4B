# Changelog

## 3.0.3

- Sub-receitas movidas para um planejador modal com navegação por níveis e breadcrumb.
- Remoção da indentação horizontal progressiva em cadeias profundas de receitas.
- Profissão exibida somente para itens efetivamente fabricáveis.
- Comparação recursiva entre comprar o ingrediente pronto e fabricá-lo.
- Preço de mercado do ingrediente mantido editável em qualquer estratégia.
- Clique no ícone para copiar nomes no idioma ativo em Crafts e Up de Pets.
- Ajustes responsivos do planejador de receitas.
- Testes adicionais de regressão para modal, comparação e cópia de nomes.

## 3.0.2

- Integração efetiva do estoque global à árvore de receitas, com quantidade disponível e preenchimento pela opção Máx.
- Manutenção de estoque acessível diretamente nos cards dos projetos e itens globais.
- Árvore recursiva de receitas sem limite artificial de profundidade, com proteção contra ciclos.
- Sub-receitas ocultadas automaticamente quando o ingrediente volta para Comprar ou Dropar.
- Opção Fabricar exibida somente para ingredientes que possuem receita confirmada.
- Inclusão de etiquetas de profissão no item produzido e nos ingredientes fabricáveis.
- Remoção da modalidade separada Usar estoque; o estoque passa a complementar qualquer forma de obtenção.
- Unificação dos custos de Crafts em Custo total e Custo por unidade.
- Remoção do método de custeio da interface.
- Unificação de Salvar projeto e Salvar rascunho em um único botão condicionado à prontidão da receita.
- Correção do carregamento dos gráficos do painel de vendas.
- Correção do rótulo do seletor de métrica do gráfico de canais de venda.
- Reorganização responsiva do editor, ingredientes, árvore e cards de Crafts.
- Preservação reforçada de foco e cursor nos campos numéricos durante recálculos.

## 3.0.1

- Inclusão da opção **Dropar** na obtenção dos ingredientes.
- Pesquisa de Crafts restrita a itens fabricáveis com receita, sem consultar a categoria Recurso.
- Hidratação dos ingredientes da receita por `ankama_id`, com nome, tipo, nível e imagem.
- Correção dos caminhos de logo, favicon, placeholders e imagens em rotas internas.
- Inclusão de fallback próprio para imagens de itens.
- Bloqueio da exclusão de ingredientes pertencentes à receita oficial.
- Separação entre salvar rascunho e salvar projeto pronto.
- Bloqueio de conclusão, produção e disponibilização para venda enquanto houver ingrediente sem preço.
- Melhoria visual do estado de prontidão do projeto.
- Inclusão de Editar, Duplicar, Ver detalhes, Concluir e Excluir diretamente nos cards de Crafts.
- Correção funcional da exclusão de projetos de Crafts.
- Remoção do atalho global de Estoque da navegação superior.
- Preservação reforçada de foco, seleção e posição do cursor em campos numéricos.
- Correção do teste de DOM para não depender de nomes de funções preservados após minificação.

## 3.0.0

- Transformação da página inicial em hub de módulos e dashboard econômico global.
- Criação da camada de rotas para Início, Up de Pets, Crafts, Vendas e Estoque.
- Preservação integral das chaves e regras legadas do módulo de Up de Pets.
- Criação de adaptadores de vendas e métricas do módulo legado.
- Inclusão do módulo Crafts e Produção.
- Pesquisa de itens e receitas por `ankama_id` usando DofusDude.
- Inclusão de projetos de produção, ingredientes e sub-receitas.
- Separação entre custo financeiro, econômico e contábil.
- Comparação entre comprar e fabricar.
- Inclusão de lotes fabricados e estoque com custo médio ponderado.
- Inclusão de venda parcial de crafts e lucro realizado.
- Criação de painel global de vendas e itens aguardando venda.
- Inclusão de atividades recentes e filtros globais por módulo e período.
- Implementação de deep links compatíveis com GitHub Pages.
- Correção estrutural do bug que removia o cursor dos campos numéricos durante a digitação.
- Inclusão de documentação de arquitetura, riscos e rollback.

## 2.3.1

- Seleção unificada de recursos.
- Listagens completas de criaturas e recursos.
- Memória local da XP dos recursos.
- Unificação do método de evolução por recursos.
- Preservação de foco durante recálculos.

## 2.3.0

- Bônus percentual de XP.
- Quantidade necessária por recurso.
- Catálogo de recursos DofusDude.
- Evolução combinada.
