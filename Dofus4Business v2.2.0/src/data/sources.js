import { CATALOG_UPDATED_AT } from '../config/app.js';

export const dataSources = {
  creatureCatalog: { id: 'creatureCatalog',
    category: 'Catálogo de criaturas',
    datum: 'Relação, tipo e nomes multilíngues',
    source: 'Catálogo Dofus4Business fornecido pelo proprietário',
    url: '',
    license: 'Organização de dados do projeto; nomes e marcas pertencem aos respectivos titulares.',
    checkedAt: CATALOG_UPDATED_AT
  },
  creatureImages: { id: 'creatureImages',
    category: 'Imagens de criaturas',
    datum: 'URL individual armazenada em cada entrada',
    source: 'Dofusdude API, conforme URLs do catálogo anexado',
    url: 'https://docs.dofusdu.de/dofus3/v1/',
    license: 'Condição de uso não informada no catálogo; uso referencial, sem alegação de domínio público.',
    checkedAt: CATALOG_UPDATED_AT
  },
  feedingXp: { id: 'feedingXp',
    category: 'XP e alimentação',
    datum: 'Curva de XP e recursos confirmados',
    source: 'Guia de evolução por recursos fornecido pelo proprietário',
    url: 'https://docs.google.com/spreadsheets/d/1jOI2i3c--spHPy9rZHzz55LS53gcV8XFURRKsPcsRG0/edit?usp=sharing',
    license: 'Dados referenciais; verificar atualizações do jogo.',
    checkedAt: CATALOG_UPDATED_AT
  },
  githubPages: { id: 'githubPages',
    category: 'Publicação',
    datum: 'Domínio próprio e GitHub Pages',
    source: 'Documentação do GitHub Pages',
    url: 'https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site',
    license: 'Documentação técnica.',
    checkedAt: CATALOG_UPDATED_AT
  }
};

export const dataSourceRows = Object.values(dataSources);
export const catalogMetadata = {
  updatedAt: CATALOG_UPDATED_AT,
  catalogOwner: 'Dofus4Business',
  imageOwnerNote: 'A organização do catálogo pertence ao projeto. As imagens e elementos de DOFUS permanecem vinculados aos respectivos titulares.'
};
