# Dofus4Business v3.1.0

Plataforma modular para planejamento econômico no DOFUS. A aplicação reúne o módulo legado de Up de Pets, projetos de Crafts e Produção, vendas, estoque fabricado, contas de usuário e preços comunitários separados por servidor.

## Novidades da v3.1.0

- cadastro, confirmação de e-mail, login e recuperação de senha;
- opção **Manter conectado**;
- indicador padronizado da conta em todas as páginas;
- Configurações de conta com servidor ativo, preferência de preços e troca de senha;
- preços comunitários e preços próprios por servidor;
- alertas de preço com mais de 3 e 7 dias;
- envio de preços observados em ingredientes e sub-receitas;
- snapshot do servidor em projetos, lotes, estoque e vendas de crafts;
- botão de venda diretamente nos projetos finalizados;
- exclusão permanente de projetos preservando vendas e lotes históricos;
- correção de foco, cursor e posição de rolagem em sub-receitas.

## Requisitos

- Node.js 22 ou superior;
- npm;
- uma implantação `/exec` da API do Google Apps Script fornecida no pacote `d4b-apps-script-api-v1.0.0`;
- acesso à planilha configurada na API.

## Configuração obrigatória da API de contas

Abra:

```text
public/runtime-config.js
```

Informe a URL da implantação:

```js
window.D4B_RUNTIME_CONFIG = {
  accountApiUrl: "https://script.google.com/macros/s/SEU_ID/exec"
};
```

A URL deve terminar em `/exec`. O arquivo é carregado antes do aplicativo, portanto a URL pode ser trocada sem alterar o código-fonte.

Não coloque senhas, peppers, hashes ou chaves administrativas nesse arquivo. Esses dados permanecem nas propriedades privadas do Apps Script.

## Instalação

```powershell
npm install
npm run check
npm run dev
```

Acesse:

```text
http://localhost:5173/
```

## Build e preview

```powershell
npm run build
npm run preview
```

O conteúdo publicável é gerado em `dist/`.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` utiliza Node 22, executa `npm ci`, `npm run check` e publica `dist/`.

Antes do `git push`, confirme que `public/runtime-config.js` contém a URL `/exec` correta.

```powershell
git add .
git commit -m "Atualiza Dofus4Business para v3.1.0"
git push
```

Em **Settings → Pages**, a origem deve ser **GitHub Actions**.

## Contas

O frontend não armazena senhas. O navegador mantém somente o token de sessão retornado pela API:

- sem “Manter conectado”: `sessionStorage`;
- com “Manter conectado”: `localStorage`.

Chaves utilizadas:

```text
d4b_account_session_tab_v1
d4b_account_session_v1
```

A interface orienta o jogador a não reutilizar a senha da conta Ankama ou DOFUS.

## Preços comunitários

O preço padrão é consultado por:

- `ankama_id`;
- servidor do projeto;
- modo `COMUNIDADE` ou `PROPRIOS`.

Um preço digitado pelo usuário não é enviado a cada caractere. O envio acontece ao confirmar o campo ou ao salvar o projeto. Cada atualização gera uma nova linha na aba `PrecosComunidade`.

Estados de atualização:

- até 3 dias: normal;
- mais de 3 dias: alerta leve;
- mais de 7 dias: alerta destacado.

O preço fica salvo como snapshot no projeto. Alterações futuras da comunidade não recalculam projetos e vendas históricas automaticamente.

## Retrocompatibilidade

A v3.1.0 preserva:

- simulações e vendas de pets;
- cálculos e fórmulas do Up de Pets;
- chaves antigas do `localStorage`;
- projetos, lotes, estoque e vendas de crafts;
- rotas existentes;
- registros históricos.

Campos novos são opcionais e normalizados com valores padrão. Projetos antigos sem servidor continuam abrindo.

## Estrutura resumida

```text
src/
├── components/
│   ├── accountPages.js
│   ├── header.js
│   └── ...
├── config/
│   ├── accountApi.js
│   └── app.js
├── modules/
│   ├── crafts/
│   ├── global/
│   └── pets/
├── services/
│   ├── accountApiService.js
│   ├── accountSessionService.js
│   ├── communityPriceService.js
│   └── ...
├── router/
├── state/
├── styles/
└── utils/
    ├── focusPreservation.js
    └── scrollPreservation.js

public/
├── runtime-config.js
├── privacy.html
├── terms.html
└── ...
```

## Segurança e limitações

O site é estático e hospedado no GitHub Pages. A sessão fica disponível ao JavaScript da página; por isso, mantenha dependências atualizadas e não injete scripts desconhecidos.

A API usa tokens revogáveis. A senha é tratada apenas pelo Apps Script e nunca deve ser registrada em texto puro.

O login e os preços comunitários dependem da disponibilidade da implantação do Google Apps Script. O Up de Pets e os dados locais continuam funcionando se essa API estiver indisponível.

## Versionamento

- PATCH: correções compatíveis;
- MINOR: funcionalidades compatíveis;
- MAJOR: alterações incompatíveis.
