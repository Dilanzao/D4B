export const translations = {
  "pt-BR": {
    languageName: "Português",
    common: {
      appName: "Dofus4Business",
      subtitle: "Simule o up e controle suas vendas.",
      version: "Versão {version}",
      advertisement: "Publicidade",
      close: "Fechar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      delete: "Excluir",
      edit: "Editar",
      duplicate: "Duplicar",
      details: "Ver detalhes",
      back: "Voltar",
      continue: "Continuar",
      save: "Salvar",
      search: "Pesquisar",
      noResults: "Nenhum resultado encontrado.",
      optional: "Opcional",
      yes: "Sim",
      no: "Não",
      loading: "Carregando…",
      status: "Status",
      date: "Data",
      actions: "Ações",
      retry: "Tentar novamente",
      copied: "Chave PIX copiada.",
      localOnly: "Este dado fica somente neste navegador.",
      required: "Campo obrigatório."
    },
    nav: {
      dashboard: "Painel",
      simulations: "Simulações",
      sales: "Vendas",
      guide: "Como funciona",
      sources: "Fontes",
      about: "Sobre",
      privacy: "Privacidade dos dados",
      support: "Apoiar",
      terms: "Termos de uso"
    },
    home: {
      eyebrow: "Economia de mascotes",
      title: "Decida antes de investir seus kamas",
      description: "Compare métodos de evolução, salve cenários e acompanhe o resultado real das suas vendas.",
      firstTitle: "Crie sua primeira simulação em poucos passos.",
      firstText: "Escolha uma criatura, compare os métodos de evolução e descubra o lucro estimado.",
      firstButton: "Criar primeira simulação",
      newSimulation: "Nova simulação",
      recentSimulations: "Simulações recentes",
      viewAll: "Ver todas",
      salesOverview: "Resumo das vendas",
      noSales: "Registre uma venda a partir de uma simulação para começar a acompanhar seus resultados.",
      totalProfit: "Lucro líquido total",
      salesCount: "Vendas registradas",
      successRate: "Taxa de vendas lucrativas",
      averageProfit: "Lucro médio",
      bestCreature: "Criatura mais lucrativa",
      originalContentTitle: "Como tomar uma decisão melhor",
      originalContentText: "O custo mais baixo por unidade nem sempre representa o menor desembolso. O Dofus4Business separa custo proporcional, compra em lotes, taxa do HDV e lucro líquido para que você compare cenários com clareza.",
      strategyTitle: "Três estratégias de evolução",
      strategyText: "Compare Ração Vitaminada pronta, Bolsa de Kolifichas e recursos confirmados. Somente o método escolhido entra no custo final da simulação."
    },
    simulation: {
      newTitle: "Nova simulação",
      editTitle: "Editar simulação",
      duplicateTitle: "Duplicar simulação",
      stepLabel: "Etapa {current} de {total}",
      steps: {
        creature: "Escolha a criatura",
        levels: "Defina os níveis",
        method: "Escolha como evoluir",
        costs: "Informe os custos e a venda",
        review: "Revise e salve"
      },
      creatureType: "Tipo",
      pet: "Mascote",
      petsmount: "Montascote",
      species: "Espécie da criatura",
      searchCreature: "Pesquise pelo nome da criatura",
      selectedCreature: "Criatura selecionada",
      simulationName: "Nome da simulação",
      autoNameHint: "Se ficar vazio, o nome será gerado automaticamente.",
      originLevel: "Nível de origem",
      currentXp: "XP dentro do nível",
      currentXpHint: "Máx. {max}",
      targetLevel: "Nível de destino",
      requiredXp: "XP necessária",
      levelRange: "Nível {origin} ao {target}",
      methodTitle: "Estratégia de evolução",
      marketFood: "Ração Vitaminada",
      kolitokenBag: "Bolsa de Kolifichas",
      resources: "Alimentação por recursos",
      compareMethods: "Comparação dos métodos",
      chooseMethod: "Selecione explicitamente o método que será usado.",
      marketFoodPrice: "Preço de 1 Ração Vitaminada",
      bagPrice: "Preço de 1 Bolsa de Kolifichas",
      quantityNeeded: "Quantidade necessária",
      xpObtained: "XP obtida",
      totalCost: "Custo total",
      costPerXp: "Custo por XP",
      cheapest: "Mais barato",
      selected: "Selecionado",
      insufficientXp: "Não atinge a XP necessária.",
      resourcePanel: "Alimentação por recursos",
      resourcesCount: "{count} recursos",
      resourcesXp: "{xp} XP",
      resourcesCost: "{cost}",
      addResource: "Adicionar recurso",
      resource: "Recurso",
      unitXp: "XP unitária",
      quantity: "Quantidade",
      totalXp: "XP total",
      unitPrice: "Preço unitário",
      lineCost: "Custo total",
      averageCostXp: "Custo médio por XP",
      duplicateResource: "Este recurso já foi adicionado.",
      invalidResource: "Escolha um recurso válido.",
      originCost: "Preço de compra da criatura",
      additionalCosts: "Custos adicionais",
      saleChannel: "Canal estimado de venda",
      marketChannel: "Mercado HDV",
      playerChannel: "Outro Jogador",
      salePrice: "Preço estimado de venda",
      marketFee: "Taxa do HDV",
      noFee: "Sem taxa",
      reviewSimulation: "Revisar simulação",
      saveSimulation: "Salvar simulação",
      updateSimulation: "Atualizar simulação",
      operationCost: "Custo total da operação",
      upCost: "Custo do UP",
      grossCost: "Desembolso bruto",
      leftover: "Sobra de Kolifichas",
      netRevenue: "Receita após taxa",
      estimatedProfit: "Lucro estimado",
      breakEven: "Preço mínimo para empatar",
      validation: {
        creature: "Escolha uma criatura válida.",
        levels: "O nível de destino deve ser maior que o nível de origem e não pode ultrapassar 100.",
        method: "Selecione um método válido e informe seus custos.",
        resources: "Os recursos selecionados precisam atingir a XP necessária.",
        originCost: "Informe um custo de origem válido.",
        sale: "Informe um preço estimado de venda válido.",
        name: "Informe um nome ou permita que o sistema gere um automaticamente."
      }
    },
    simulations: {
      title: "Simulações",
      description: "Compare cenários salvos sem exibir todos os detalhes ao mesmo tempo.",
      empty: "Nenhuma simulação salva.",
      registerSale: "Registrar venda",
      method: "Método",
      operationCost: "Custo da operação",
      salePrice: "Venda estimada",
      profit: "Lucro estimado",
      statusDraft: "Em análise",
      statusReady: "Pronta",
      statusSold: "Venda registrada",
      deleteTitle: "Excluir simulação",
      deleteText: "Excluir esta simulação deste navegador? As vendas já registradas não serão apagadas.",
      detailsTitle: "Detalhes da simulação",
      modified: "Última modificação",
      created: "Criada em"
    },
    sales: {
      title: "Vendas",
      description: "Acompanhe resultados reais e o estado de sincronização dos registros não pessoais.",
      empty: "Nenhuma venda registrada.",
      registerTitle: "Registrar venda",
      confirmText: "Revise os valores reais antes de confirmar.",
      originCost: "Custo real da criatura",
      upCost: "Custo real do UP",
      salePrice: "Preço real de venda",
      channel: "Canal real de venda",
      dateTime: "Data e hora da venda",
      fee: "Taxa",
      profit: "Lucro",
      register: "Confirmar venda",
      registered: "Venda registrada.",
      privacyShort: "Dados não pessoais da operação podem ser utilizados para melhorar o site.",
      statusRegistered: "Registrada",
      statusPending: "Pendente",
      statusAttention: "Requer atenção",
      syncPending: "Alguns dados ainda não foram sincronizados.",
      retrySync: "Tentar sincronizar novamente",
      retryStarted: "Nova tentativa iniciada.",
      duplicateSimulation: "Duplicar como simulação",
      deleteLocal: "Excluir do histórico deste dispositivo",
      deleteTitle: "Excluir venda deste dispositivo",
      deleteText: "Excluir esta venda do histórico deste dispositivo?",
      deleteDisclosure: "",
      detailsTitle: "Detalhes da venda",
      positive: "Lucro positivo",
      zero: "Resultado zero",
      loss: "Prejuízo",
      filterCreature: "Filtrar por criatura",
      filterType: "Todos os tipos",
      filterResult: "Todos os resultados",
      filterStatus: "Todos os status",
      from: "De",
      to: "Até"
    },
    support: {
      title: "Ajude a manter o Dofus4Business no ar",
      text: "A manutenção do site, da hospedagem e do domínio gera custos. Seu apoio ajuda a manter a ferramenta gratuita e disponível para a comunidade.",
      button: "Apoiar pelo PIX",
      modalTitle: "Apoiar pelo PIX",
      keyLabel: "Chave PIX",
      copy: "Copiar chave PIX"
    },
    privacy: {
      title: "Privacidade dos dados",
      salesText: "O Dofus4Business pode armazenar dados não pessoais e agregados das vendas registradas, como criatura, custos, preço e canal de venda. Essas informações são utilizadas para entender o mercado do jogo e melhorar futuras funcionalidades do site. Não solicitamos nem armazenamos nome, conta do jogo, e-mail, senha ou outros dados pessoais neste processo.",
      localText: "Simulações, preferências e o histórico exibido ficam armazenados no navegador por localStorage. Detalhes sobre sincronização são apresentados na área Sobre e transparência.",
      adsText: "Quando anúncios forem ativados, fornecedores terceiros, incluindo o Google, poderão usar cookies ou tecnologias semelhantes para exibir e medir anúncios. O carregamento de publicidade deve respeitar as preferências de consentimento aplicáveis.",
      preferences: "Preferências de privacidade",
      essential: "Somente armazenamento essencial",
      allowAds: "Permitir publicidade",
      saved: "Preferências salvas.",
      cookieBanner: "Usamos armazenamento local para manter suas simulações. Cookies publicitários só serão carregados após consentimento quando a publicidade estiver ativa."
    },
    guide: {
      title: "Como funciona",
      intro: "A calculadora transforma a curva de XP em uma comparação de custos e mantém cada decisão separada.",
      xpTitle: "Curva de experiência",
      xpText: "A XP é calculada pela diferença entre o nível de origem e o destino. Rações são sempre arredondadas para cima.",
      bagTitle: "Bolsa de Kolifichas",
      bagText: "Cada bolsa corresponde a 1.000 Kolifichas e a dez Rações Vitaminadas. O custo considera bolsas inteiras e mostra a sobra.",
      resourcesTitle: "Recursos",
      resourcesText: "Somente recursos com XP confirmada entram no catálogo. O usuário informa quantidade e preço; o custo é recalculado imediatamente.",
      profitTitle: "Lucro líquido",
      profitText: "Mercado HDV aplica 2% de taxa. Outro Jogador aplica taxa zero. O lucro é receita líquida menos custos reais."
    },
    sources: {
      title: "Fontes e atualização dos dados",
      description: "Referências utilizadas para nomes, curva de XP, recursos, publicação e preparação dos espaços publicitários.",
      catalogDate: "Catálogo atualizado em {date}",
      imageSource: "Fonte das imagens",
      xpSource: "Fonte dos valores de XP"
    },
    about: {
      title: "Sobre o Dofus4Business",
      text: "O Dofus4Business é uma ferramenta independente criada para ajudar jogadores a comparar investimentos e registrar resultados sem solicitar dados pessoais.",
      roadmap: "Esta versão prioriza mascotes e montascotes. Novas ferramentas de economia poderão ser adicionadas futuramente."
    },
    footer: {
      disclaimer: "Dofus4Business é uma ferramenta independente criada pela comunidade e não possui vínculo, patrocínio, aprovação ou afiliação com a Ankama. DOFUS, seus nomes, personagens, imagens, marcas e demais conteúdos relacionados pertencem aos seus respectivos proprietários, especialmente à Ankama. As imagens e informações são utilizadas de forma informativa e referencial. Nenhum conteúdo oficial é reivindicado como propriedade do Dofus4Business.",
      independent: "Ferramenta independente da comunidade.",
      catalogUpdated: "Catálogo: {date}"
    },
    toast: {
      simulationSaved: "Simulação salva.",
      simulationUpdated: "Simulação atualizada.",
      simulationDeleted: "Simulação excluída.",
      simulationDuplicated: "Simulação duplicada.",
      saleDeleted: "Venda removida deste dispositivo.",
      invalidStep: "Revise os campos obrigatórios antes de continuar.",
      storageError: "Não foi possível salvar todos os dados neste navegador."
    }
  },
  "fr-FR": {
    languageName: "Français",
    common: { appName: "Dofus4Business", subtitle: "Simulez l'évolution et suivez vos ventes.", version: "Version {version}", advertisement: "Publicité", close: "Fermer", cancel: "Annuler", confirm: "Confirmer", delete: "Supprimer", edit: "Modifier", duplicate: "Dupliquer", details: "Voir les détails", back: "Retour", continue: "Continuer", save: "Enregistrer", search: "Rechercher", noResults: "Aucun résultat.", optional: "Facultatif", yes: "Oui", no: "Non", loading: "Chargement…", status: "Statut", date: "Date", actions: "Actions", retry: "Réessayer", copied: "Clé PIX copiée.", localOnly: "Cette donnée reste dans ce navigateur.", required: "Champ obligatoire." },
    nav: { dashboard: "Tableau de bord", simulations: "Simulations", sales: "Ventes", guide: "Fonctionnement", sources: "Sources", about: "À propos", privacy: "Confidentialité", support: "Soutenir", terms: "Conditions d’utilisation" },
    home: { eyebrow: "Économie des familiers", title: "Décidez avant d'investir vos kamas", description: "Comparez les méthodes d'évolution, enregistrez des scénarios et suivez le résultat réel de vos ventes.", firstTitle: "Créez votre première simulation en quelques étapes.", firstText: "Choisissez une créature, comparez les méthodes et découvrez le bénéfice estimé.", firstButton: "Créer la première simulation", newSimulation: "Nouvelle simulation", recentSimulations: "Simulations récentes", viewAll: "Tout voir", salesOverview: "Résumé des ventes", noSales: "Enregistrez une vente depuis une simulation pour commencer.", totalProfit: "Bénéfice net total", salesCount: "Ventes enregistrées", successRate: "Taux de ventes rentables", averageProfit: "Bénéfice moyen", bestCreature: "Créature la plus rentable", originalContentTitle: "Prendre une meilleure décision", originalContentText: "Le prix unitaire le plus bas n'est pas toujours le plus petit décaissement. Dofus4Business sépare coût proportionnel, achat par lots, taxe HDV et bénéfice net.", strategyTitle: "Trois stratégies d'évolution", strategyText: "Comparez la Croquette enrichie, le Sac de Kolizétons et les ressources confirmées. Seule la méthode choisie entre dans le coût final." },
    simulation: { newTitle: "Nouvelle simulation", editTitle: "Modifier la simulation", duplicateTitle: "Dupliquer la simulation", stepLabel: "Étape {current} sur {total}", steps: { creature: "Choisissez la créature", levels: "Définissez les niveaux", method: "Choisissez l'évolution", costs: "Indiquez les coûts et la vente", review: "Vérifiez et enregistrez" }, creatureType: "Type", pet: "Familier", petsmount: "Montilier", species: "Espèce de la créature", searchCreature: "Rechercher une créature", selectedCreature: "Créature sélectionnée", simulationName: "Nom de la simulation", autoNameHint: "S'il est vide, le nom sera généré.", originLevel: "Niveau initial", currentXp: "XP dans le niveau", currentXpHint: "Max. {max}", targetLevel: "Niveau cible", requiredXp: "XP nécessaire", levelRange: "Niveau {origin} à {target}", methodTitle: "Méthode d'évolution", marketFood: "Croquette enrichie", kolitokenBag: "Sac de Kolizétons", resources: "Alimentation par ressources", compareMethods: "Comparaison des méthodes", chooseMethod: "Sélectionnez explicitement la méthode utilisée.", marketFoodPrice: "Prix d'une Croquette enrichie", bagPrice: "Prix d'un Sac de Kolizétons", quantityNeeded: "Quantité nécessaire", xpObtained: "XP obtenue", totalCost: "Coût total", costPerXp: "Coût par XP", cheapest: "Moins cher", selected: "Sélectionné", insufficientXp: "XP insuffisante.", resourcePanel: "Alimentation par ressources", resourcesCount: "{count} ressources", resourcesXp: "{xp} XP", resourcesCost: "{cost}", addResource: "Ajouter une ressource", resource: "Ressource", unitXp: "XP unitaire", quantity: "Quantité", totalXp: "XP totale", unitPrice: "Prix unitaire", lineCost: "Coût total", averageCostXp: "Coût moyen par XP", duplicateResource: "Cette ressource est déjà ajoutée.", invalidResource: "Choisissez une ressource valide.", originCost: "Prix d'achat de la créature", additionalCosts: "Coûts supplémentaires", saleChannel: "Canal de vente estimé", marketChannel: "Hôtel de vente", playerChannel: "Autre joueur", salePrice: "Prix de vente estimé", marketFee: "Taxe HDV", noFee: "Sans taxe", reviewSimulation: "Vérifier la simulation", saveSimulation: "Enregistrer la simulation", updateSimulation: "Mettre à jour", operationCost: "Coût total de l'opération", upCost: "Coût d'évolution", grossCost: "Décaissement brut", leftover: "Kolizétons restants", netRevenue: "Recette après taxe", estimatedProfit: "Bénéfice estimé", breakEven: "Prix d'équilibre", validation: { creature: "Choisissez une créature valide.", levels: "Le niveau cible doit être supérieur au niveau initial et ne peut pas dépasser 100.", method: "Choisissez une méthode valide et indiquez ses coûts.", resources: "Les ressources doivent atteindre l'XP nécessaire.", originCost: "Indiquez un coût initial valide.", sale: "Indiquez un prix de vente valide.", name: "Indiquez un nom ou laissez le système le générer." } },
    simulations: { title: "Simulations", description: "Comparez les scénarios enregistrés sans afficher tous les détails.", empty: "Aucune simulation enregistrée.", registerSale: "Enregistrer la vente", method: "Méthode", operationCost: "Coût de l'opération", salePrice: "Vente estimée", profit: "Bénéfice estimé", statusDraft: "En analyse", statusReady: "Prête", statusSold: "Vente enregistrée", deleteTitle: "Supprimer la simulation", deleteText: "Supprimer cette simulation de ce navigateur ? Les ventes enregistrées seront conservées.", detailsTitle: "Détails de la simulation", modified: "Dernière modification", created: "Créée le" },
    sales: { title: "Ventes", description: "Suivez les résultats réels et l'état de synchronisation des données non personnelles.", empty: "Aucune vente enregistrée.", registerTitle: "Enregistrer une vente", confirmText: "Vérifiez les valeurs réelles avant de confirmer.", originCost: "Coût réel de la créature", upCost: "Coût réel de l'évolution", salePrice: "Prix réel de vente", channel: "Canal réel", dateTime: "Date et heure", fee: "Taxe", profit: "Bénéfice", register: "Confirmer la vente", registered: "Vente enregistrée.", privacyShort: "Des données non personnelles peuvent être utilisées pour améliorer le site.", statusRegistered: "Enregistrée", statusPending: "En attente", statusAttention: "Attention requise", syncPending: "Certaines données ne sont pas encore synchronisées.", retrySync: "Réessayer la synchronisation", retryStarted: "Nouvelle tentative lancée.", duplicateSimulation: "Dupliquer comme simulation", deleteLocal: "Supprimer de l'historique de cet appareil", deleteTitle: "Supprimer la vente de cet appareil", deleteText: "Supprimer cette vente de l'historique de cet appareil ?", deleteDisclosure: "", detailsTitle: "Détails de la vente", positive: "Bénéfice positif", zero: "Résultat nul", loss: "Perte", filterCreature: "Filtrer par créature", filterType: "Tous les types", filterResult: "Tous les résultats", filterStatus: "Tous les statuts", from: "Du", to: "Au" },
    support: { title: "Aidez à maintenir Dofus4Business en ligne", text: "La maintenance, l'hébergement et le domaine ont un coût. Votre soutien aide à garder l'outil gratuit.", button: "Soutenir par PIX", modalTitle: "Soutenir par PIX", keyLabel: "Clé PIX", copy: "Copier la clé PIX" },
    privacy: { title: "Confidentialité des données", salesText: "Dofus4Business peut stocker des données non personnelles et agrégées sur les ventes, comme la créature, les coûts, le prix et le canal. Elles servent à comprendre le marché du jeu et à améliorer le site. Nous ne demandons ni nom, compte de jeu, e-mail ou mot de passe.", localText: "Les simulations, préférences et l’historique affiché sont stockés dans le navigateur. Les détails de synchronisation figurent dans la section transparence.", adsText: "Lorsque la publicité sera activée, des fournisseurs tiers, dont Google, pourront utiliser des cookies ou des technologies similaires. Leur chargement doit respecter le consentement applicable.", preferences: "Préférences de confidentialité", essential: "Stockage essentiel uniquement", allowAds: "Autoriser la publicité", saved: "Préférences enregistrées.", cookieBanner: "Nous utilisons le stockage local pour vos simulations. Les cookies publicitaires ne seront chargés qu'après consentement lorsque les annonces seront actives." },
    guide: { title: "Fonctionnement", intro: "La calculatrice transforme la courbe d'XP en comparaison de coûts.", xpTitle: "Courbe d'expérience", xpText: "L'XP est la différence entre le niveau initial et le niveau cible. Les croquettes sont toujours arrondies au supérieur.", bagTitle: "Sac de Kolizétons", bagText: "Chaque sac représente 1 000 Kolizétons et dix croquettes. Le coût utilise des sacs entiers et affiche le reste.", resourcesTitle: "Ressources", resourcesText: "Seules les ressources dont l'XP est confirmée figurent dans le catalogue.", profitTitle: "Bénéfice net", profitText: "L’hôtel de vente applique 2 %. Une vente directe à un autre joueur applique 0 %." },
    sources: { title: "Sources et mise à jour", description: "Références pour les noms, la courbe d'XP, les ressources, la publication et la publicité.", catalogDate: "Catalogue mis à jour le {date}", imageSource: "Source des images", xpSource: "Source des valeurs d'XP" },
    about: { title: "À propos de Dofus4Business", text: "Dofus4Business est un outil indépendant qui aide les joueurs à comparer leurs investissements sans demander de données personnelles.", roadmap: "Cette version se concentre sur les familiers et montiliers. D'autres outils économiques pourront être ajoutés." },
    footer: { disclaimer: "Dofus4Business est un outil indépendant créé par la communauté et n'est ni lié, ni sponsorisé, ni approuvé, ni affilié à Ankama. DOFUS, ses noms, personnages, images, marques et contenus appartiennent à leurs propriétaires respectifs, notamment Ankama. Les images et informations sont utilisées à titre informatif et de référence. Aucun contenu officiel n'est revendiqué par Dofus4Business.", independent: "Outil communautaire indépendant.", catalogUpdated: "Catalogue : {date}" },
    toast: { simulationSaved: "Simulation enregistrée.", simulationUpdated: "Simulation mise à jour.", simulationDeleted: "Simulation supprimée.", simulationDuplicated: "Simulation dupliquée.", saleDeleted: "Vente supprimée de cet appareil.", invalidStep: "Vérifiez les champs obligatoires.", storageError: "Impossible d'enregistrer toutes les données dans ce navigateur." }
  },
  "en-US": {
    languageName: "English",
    common: { appName: "Dofus4Business", subtitle: "Simulate leveling and track your sales.", version: "Version {version}", advertisement: "Advertisement", close: "Close", cancel: "Cancel", confirm: "Confirm", delete: "Delete", edit: "Edit", duplicate: "Duplicate", details: "View details", back: "Back", continue: "Continue", save: "Save", search: "Search", noResults: "No results found.", optional: "Optional", yes: "Yes", no: "No", loading: "Loading…", status: "Status", date: "Date", actions: "Actions", retry: "Retry", copied: "PIX key copied.", localOnly: "This data stays in this browser.", required: "Required field." },
    nav: { dashboard: "Dashboard", simulations: "Simulations", sales: "Sales", guide: "How it works", sources: "Sources", about: "About", privacy: "Data privacy", support: "Support", terms: "Terms of use" },
    home: { eyebrow: "Pet economy", title: "Decide before investing your kamas", description: "Compare leveling methods, save scenarios, and track the real outcome of your sales.", firstTitle: "Create your first simulation in a few steps.", firstText: "Choose a creature, compare leveling methods, and discover the estimated profit.", firstButton: "Create first simulation", newSimulation: "New simulation", recentSimulations: "Recent simulations", viewAll: "View all", salesOverview: "Sales overview", noSales: "Register a sale from a simulation to start tracking results.", totalProfit: "Total net profit", salesCount: "Registered sales", successRate: "Profitable sale rate", averageProfit: "Average profit", bestCreature: "Most profitable creature", originalContentTitle: "Make a better decision", originalContentText: "The lowest unit price is not always the lowest cash outlay. Dofus4Business separates proportional cost, batch purchases, market fees, and net profit.", strategyTitle: "Three leveling strategies", strategyText: "Compare ready-made Vitaminized Food, Kolitoken Bags, and confirmed resources. Only the selected method is included in the final cost." },
    simulation: { newTitle: "New simulation", editTitle: "Edit simulation", duplicateTitle: "Duplicate simulation", stepLabel: "Step {current} of {total}", steps: { creature: "Choose the creature", levels: "Set the levels", method: "Choose how to level", costs: "Enter costs and sale", review: "Review and save" }, creatureType: "Type", pet: "Pet", petsmount: "Petsmount", species: "Creature species", searchCreature: "Search by creature name", selectedCreature: "Selected creature", simulationName: "Simulation name", autoNameHint: "If left blank, a name will be generated.", originLevel: "Origin level", currentXp: "XP within level", currentXpHint: "Max. {max}", targetLevel: "Target level", requiredXp: "Required XP", levelRange: "Level {origin} to {target}", methodTitle: "Leveling strategy", marketFood: "Vitaminized Food", kolitokenBag: "Kolitoken Bag", resources: "Resource feeding", compareMethods: "Method comparison", chooseMethod: "Explicitly select the method that will be used.", marketFoodPrice: "Price of 1 Vitaminized Food", bagPrice: "Price of 1 Kolitoken Bag", quantityNeeded: "Required quantity", xpObtained: "XP obtained", totalCost: "Total cost", costPerXp: "Cost per XP", cheapest: "Cheapest", selected: "Selected", insufficientXp: "Does not reach required XP.", resourcePanel: "Resource feeding", resourcesCount: "{count} resources", resourcesXp: "{xp} XP", resourcesCost: "{cost}", addResource: "Add resource", resource: "Resource", unitXp: "Unit XP", quantity: "Quantity", totalXp: "Total XP", unitPrice: "Unit price", lineCost: "Total cost", averageCostXp: "Average cost per XP", duplicateResource: "This resource has already been added.", invalidResource: "Choose a valid resource.", originCost: "Creature purchase price", additionalCosts: "Additional costs", saleChannel: "Estimated sale channel", marketChannel: "Marketplace", playerChannel: "Another player", salePrice: "Estimated sale price", marketFee: "Market fee", noFee: "No fee", reviewSimulation: "Review simulation", saveSimulation: "Save simulation", updateSimulation: "Update simulation", operationCost: "Total operation cost", upCost: "Leveling cost", grossCost: "Gross cash outlay", leftover: "Leftover Kolitokens", netRevenue: "Revenue after fee", estimatedProfit: "Estimated profit", breakEven: "Break-even price", validation: { creature: "Choose a valid creature.", levels: "Target level must be above origin level and cannot exceed 100.", method: "Select a valid method and enter its costs.", resources: "Selected resources must reach the required XP.", originCost: "Enter a valid origin cost.", sale: "Enter a valid estimated sale price.", name: "Enter a name or let the system generate one." } },
    simulations: { title: "Simulations", description: "Compare saved scenarios without displaying every detail at once.", empty: "No saved simulations.", registerSale: "Register sale", method: "Method", operationCost: "Operation cost", salePrice: "Estimated sale", profit: "Estimated profit", statusDraft: "In analysis", statusReady: "Ready", statusSold: "Sale registered", deleteTitle: "Delete simulation", deleteText: "Delete this simulation from this browser? Registered sales will remain.", detailsTitle: "Simulation details", modified: "Last modified", created: "Created" },
    sales: { title: "Sales", description: "Track actual results and the synchronization status of non-personal records.", empty: "No registered sales.", registerTitle: "Register sale", confirmText: "Review the actual values before confirming.", originCost: "Actual creature cost", upCost: "Actual leveling cost", salePrice: "Actual sale price", channel: "Actual sale channel", dateTime: "Sale date and time", fee: "Fee", profit: "Profit", register: "Confirm sale", registered: "Sale registered.", privacyShort: "Non-personal operation data may be used to improve the site.", statusRegistered: "Registered", statusPending: "Pending", statusAttention: "Requires attention", syncPending: "Some data has not been synchronized yet.", retrySync: "Retry synchronization", retryStarted: "New attempt started.", duplicateSimulation: "Duplicate as simulation", deleteLocal: "Delete from this device history", deleteTitle: "Delete sale from this device", deleteText: "Delete this sale from this device history?", deleteDisclosure: "", detailsTitle: "Sale details", positive: "Positive profit", zero: "Break-even result", loss: "Loss", filterCreature: "Filter by creature", filterType: "All types", filterResult: "All results", filterStatus: "All statuses", from: "From", to: "To" },
    support: { title: "Help keep Dofus4Business online", text: "Site maintenance, hosting, and the domain have costs. Your support helps keep the tool free for the community.", button: "Support with PIX", modalTitle: "Support with PIX", keyLabel: "PIX key", copy: "Copy PIX key" },
    privacy: { title: "Data privacy", salesText: "Dofus4Business may store non-personal and aggregated sales data such as creature, costs, price, and sales channel. This information is used to understand the in-game market and improve future site features. We do not request or store real name, game account, email, password, or other personal data in this process.", localText: "Simulations, preferences, and displayed history are stored in the browser. Synchronization details are available in About and transparency.", adsText: "When advertising is enabled, third-party vendors, including Google, may use cookies or similar technologies to serve and measure ads. Advertising must follow applicable consent preferences.", preferences: "Privacy preferences", essential: "Essential storage only", allowAds: "Allow advertising", saved: "Preferences saved.", cookieBanner: "We use local storage to keep your simulations. Advertising cookies will only load after consent when ads are enabled." },
    guide: { title: "How it works", intro: "The calculator converts the XP curve into a cost comparison while keeping each decision separate.", xpTitle: "Experience curve", xpText: "Required XP is the difference between the origin and target level. Food quantities are always rounded up.", bagTitle: "Kolitoken Bag", bagText: "Each bag represents 1,000 Kolitokens and ten Vitaminized Foods. Cost uses whole bags and shows leftovers.", resourcesTitle: "Resources", resourcesText: "Only resources with confirmed XP values are included. Quantity and price update results immediately.", profitTitle: "Net profit", profitText: "The marketplace applies a 2% fee. A direct sale to another player applies no fee." },
    sources: { title: "Sources and data updates", description: "References used for names, XP curve, resources, publishing, and ad placement preparation.", catalogDate: "Catalog updated on {date}", imageSource: "Image source", xpSource: "XP value source" },
    about: { title: "About Dofus4Business", text: "Dofus4Business is an independent tool created to help players compare investments and record outcomes without requesting personal data.", roadmap: "This version focuses on pets and petsmounts. More economy tools may be added in the future." },
    footer: { disclaimer: "Dofus4Business is an independent community tool and has no connection, sponsorship, approval, or affiliation with Ankama. DOFUS, its names, characters, images, trademarks, and related content belong to their respective owners, especially Ankama. Images and information are used for informational and reference purposes. No official content is claimed as property of Dofus4Business.", independent: "Independent community tool.", catalogUpdated: "Catalog: {date}" },
    toast: { simulationSaved: "Simulation saved.", simulationUpdated: "Simulation updated.", simulationDeleted: "Simulation deleted.", simulationDuplicated: "Simulation duplicated.", saleDeleted: "Sale removed from this device.", invalidStep: "Review required fields before continuing.", storageError: "Not all data could be saved in this browser." }
  },
  "es-ES": {
    languageName: "Español",
    common: { appName: "Dofus4Business", subtitle: "Simula la subida y controla tus ventas.", version: "Versión {version}", advertisement: "Publicidad", close: "Cerrar", cancel: "Cancelar", confirm: "Confirmar", delete: "Eliminar", edit: "Editar", duplicate: "Duplicar", details: "Ver detalles", back: "Volver", continue: "Continuar", save: "Guardar", search: "Buscar", noResults: "No se encontraron resultados.", optional: "Opcional", yes: "Sí", no: "No", loading: "Cargando…", status: "Estado", date: "Fecha", actions: "Acciones", retry: "Reintentar", copied: "Clave PIX copiada.", localOnly: "Este dato permanece en este navegador.", required: "Campo obligatorio." },
    nav: { dashboard: "Panel", simulations: "Simulaciones", sales: "Ventas", guide: "Cómo funciona", sources: "Fuentes", about: "Acerca de", privacy: "Privacidad", support: "Apoyar", terms: "Términos de uso" },
    home: { eyebrow: "Economía de mascotas", title: "Decide antes de invertir tus kamas", description: "Compara métodos de evolución, guarda escenarios y controla el resultado real de tus ventas.", firstTitle: "Crea tu primera simulación en pocos pasos.", firstText: "Elige una criatura, compara los métodos y descubre el beneficio estimado.", firstButton: "Crear primera simulación", newSimulation: "Nueva simulación", recentSimulations: "Simulaciones recientes", viewAll: "Ver todas", salesOverview: "Resumen de ventas", noSales: "Registra una venta desde una simulación para comenzar.", totalProfit: "Beneficio neto total", salesCount: "Ventas registradas", successRate: "Tasa de ventas rentables", averageProfit: "Beneficio medio", bestCreature: "Criatura más rentable", originalContentTitle: "Cómo tomar una mejor decisión", originalContentText: "El precio unitario más bajo no siempre es el menor desembolso. Dofus4Business separa coste proporcional, compra por lotes, tasa del mercadillo y beneficio neto.", strategyTitle: "Tres estrategias de evolución", strategyText: "Compara Comida Vitaminada, Bolsa de Kolichas y recursos confirmados. Solo el método elegido entra en el coste final." },
    simulation: { newTitle: "Nueva simulación", editTitle: "Editar simulación", duplicateTitle: "Duplicar simulación", stepLabel: "Paso {current} de {total}", steps: { creature: "Elige la criatura", levels: "Define los niveles", method: "Elige cómo evolucionar", costs: "Indica costes y venta", review: "Revisa y guarda" }, creatureType: "Tipo", pet: "Mascota", petsmount: "Mascotura", species: "Especie de la criatura", searchCreature: "Busca por nombre", selectedCreature: "Criatura seleccionada", simulationName: "Nombre de la simulación", autoNameHint: "Si queda vacío, se generará automáticamente.", originLevel: "Nivel de origen", currentXp: "XP dentro del nivel", currentXpHint: "Máx. {max}", targetLevel: "Nivel de destino", requiredXp: "XP necesaria", levelRange: "Nivel {origin} al {target}", methodTitle: "Estrategia de evolución", marketFood: "Comida Vitaminada", kolitokenBag: "Bolsa de Kolichas", resources: "Alimentación por recursos", compareMethods: "Comparación de métodos", chooseMethod: "Selecciona explícitamente el método que se utilizará.", marketFoodPrice: "Precio de 1 Comida Vitaminada", bagPrice: "Precio de 1 Bolsa de Kolichas", quantityNeeded: "Cantidad necesaria", xpObtained: "XP obtenida", totalCost: "Coste total", costPerXp: "Coste por XP", cheapest: "Más barato", selected: "Seleccionado", insufficientXp: "No alcanza la XP necesaria.", resourcePanel: "Alimentación por recursos", resourcesCount: "{count} recursos", resourcesXp: "{xp} XP", resourcesCost: "{cost}", addResource: "Añadir recurso", resource: "Recurso", unitXp: "XP unitaria", quantity: "Cantidad", totalXp: "XP total", unitPrice: "Precio unitario", lineCost: "Coste total", averageCostXp: "Coste medio por XP", duplicateResource: "Este recurso ya fue añadido.", invalidResource: "Elige un recurso válido.", originCost: "Precio de compra de la criatura", additionalCosts: "Costes adicionales", saleChannel: "Canal estimado de venta", marketChannel: "Mercado HDV", playerChannel: "Otro Jugador", salePrice: "Precio estimado de venta", marketFee: "Tasa del mercadillo", noFee: "Sin tasa", reviewSimulation: "Revisar simulación", saveSimulation: "Guardar simulación", updateSimulation: "Actualizar simulación", operationCost: "Coste total de la operación", upCost: "Coste de subida", grossCost: "Desembolso bruto", leftover: "Kolichas sobrantes", netRevenue: "Ingreso tras tasa", estimatedProfit: "Beneficio estimado", breakEven: "Precio mínimo para empatar", validation: { creature: "Elige una criatura válida.", levels: "El nivel de destino debe ser mayor que el de origen y no superar 100.", method: "Selecciona un método válido e indica sus costes.", resources: "Los recursos deben alcanzar la XP necesaria.", originCost: "Indica un coste de origen válido.", sale: "Indica un precio estimado de venta válido.", name: "Indica un nombre o deja que el sistema lo genere." } },
    simulations: { title: "Simulaciones", description: "Compara escenarios guardados sin mostrar todos los detalles a la vez.", empty: "No hay simulaciones guardadas.", registerSale: "Registrar venta", method: "Método", operationCost: "Coste de operación", salePrice: "Venta estimada", profit: "Beneficio estimado", statusDraft: "En análisis", statusReady: "Lista", statusSold: "Venta registrada", deleteTitle: "Eliminar simulación", deleteText: "¿Eliminar esta simulación de este navegador? Las ventas registradas permanecerán.", detailsTitle: "Detalles de la simulación", modified: "Última modificación", created: "Creada" },
    sales: { title: "Ventas", description: "Controla resultados reales y el estado de sincronización de registros no personales.", empty: "No hay ventas registradas.", registerTitle: "Registrar venta", confirmText: "Revisa los valores reales antes de confirmar.", originCost: "Coste real de la criatura", upCost: "Coste real de subida", salePrice: "Precio real de venta", channel: "Canal real de venta", dateTime: "Fecha y hora de la venta", fee: "Tasa", profit: "Beneficio", register: "Confirmar venta", registered: "Venta registrada.", privacyShort: "Datos no personales de la operación pueden usarse para mejorar el sitio.", statusRegistered: "Registrada", statusPending: "Pendiente", statusAttention: "Requiere atención", syncPending: "Algunos datos aún no se han sincronizado.", retrySync: "Reintentar sincronización", retryStarted: "Nuevo intento iniciado.", duplicateSimulation: "Duplicar como simulación", deleteLocal: "Eliminar del historial de este dispositivo", deleteTitle: "Eliminar venta de este dispositivo", deleteText: "¿Eliminar esta venta del historial de este dispositivo?", deleteDisclosure: "", detailsTitle: "Detalles de la venta", positive: "Beneficio positivo", zero: "Resultado cero", loss: "Pérdida", filterCreature: "Filtrar por criatura", filterType: "Todos los tipos", filterResult: "Todos los resultados", filterStatus: "Todos los estados", from: "Desde", to: "Hasta" },
    support: { title: "Ayuda a mantener Dofus4Business en línea", text: "El mantenimiento, el alojamiento y el dominio generan costes. Tu apoyo ayuda a mantener la herramienta gratuita.", button: "Apoyar por PIX", modalTitle: "Apoyar por PIX", keyLabel: "Clave PIX", copy: "Copiar clave PIX" },
    privacy: { title: "Privacidad de los datos", salesText: "Dofus4Business puede almacenar datos no personales y agregados de las ventas, como criatura, costes, precio y canal. Se usan para entender el mercado del juego y mejorar el sitio. No solicitamos ni almacenamos nombre real, cuenta de juego, correo, contraseña u otros datos personales.", localText: "Las simulaciones, preferencias y el historial se guardan en el navegador. Los detalles de sincronización están en Acerca de y transparencia.", adsText: "Cuando se active la publicidad, terceros, incluido Google, podrán usar cookies o tecnologías similares para servir y medir anuncios. La carga debe respetar las preferencias de consentimiento aplicables.", preferences: "Preferencias de privacidad", essential: "Solo almacenamiento esencial", allowAds: "Permitir publicidad", saved: "Preferencias guardadas.", cookieBanner: "Usamos almacenamiento local para mantener tus simulaciones. Las cookies publicitarias solo se cargarán con consentimiento cuando los anuncios estén activos." },
    guide: { title: "Cómo funciona", intro: "La calculadora transforma la curva de XP en una comparación de costes.", xpTitle: "Curva de experiencia", xpText: "La XP necesaria es la diferencia entre el nivel de origen y el destino. Las cantidades se redondean hacia arriba.", bagTitle: "Bolsa de Kolichas", bagText: "Cada bolsa equivale a 1.000 Kolichas y diez comidas. El coste considera bolsas enteras y muestra la sobra.", resourcesTitle: "Recursos", resourcesText: "Solo se incluyen recursos con XP confirmada.", profitTitle: "Beneficio neto", profitText: "Mercado HDV aplica 2%. Otro Jugador aplica 0%." },
    sources: { title: "Fuentes y actualización", description: "Referencias usadas para nombres, curva de XP, recursos, publicación y preparación publicitaria.", catalogDate: "Catálogo actualizado el {date}", imageSource: "Fuente de las imágenes", xpSource: "Fuente de los valores de XP" },
    about: { title: "Acerca de Dofus4Business", text: "Dofus4Business es una herramienta independiente para comparar inversiones y registrar resultados sin solicitar datos personales.", roadmap: "Esta versión se centra en mascotas y mascoturas. En el futuro podrán añadirse nuevas herramientas económicas." },
    footer: { disclaimer: "Dofus4Business es una herramienta independiente creada por la comunidad y no tiene vínculo, patrocinio, aprobación ni afiliación con Ankama. DOFUS, sus nombres, personajes, imágenes, marcas y contenidos relacionados pertenecen a sus respectivos propietarios, especialmente Ankama. Las imágenes e información se utilizan con fines informativos y de referencia. Dofus4Business no reclama ningún contenido oficial como propio.", independent: "Herramienta independiente de la comunidad.", catalogUpdated: "Catálogo: {date}" },
    toast: { simulationSaved: "Simulación guardada.", simulationUpdated: "Simulación actualizada.", simulationDeleted: "Simulación eliminada.", simulationDuplicated: "Simulación duplicada.", saleDeleted: "Venta eliminada de este dispositivo.", invalidStep: "Revisa los campos obligatorios.", storageError: "No se pudieron guardar todos los datos en este navegador." }
  }
};


const translationAdditions = {
  "pt-BR": {
    common: { copySuffix: "cópia", adHelp: "Espaço destinado a anúncios que ajudam na manutenção do site.", moreOptions: "Mais opções", close: "Fechar", save: "Salvar", cancel: "Cancelar", remove: "Remover" },
    nav: { dashboard: "Painel", simulations: "Simulações", sales: "Vendas", guide: "Como funciona", information: "Sobre e transparência" },
    home: { title: "Decida antes de investir seus kamas", description: "Compare custos, simule o up e estime seu lucro.", eyebrow: "Economia de mascotes" },
    simulations: { moreOptions: "Mais opções", viewDetails: "Ver detalhes" },
    consent: {
      title: "Preferências de privacidade",
      text: "Utilizamos armazenamento essencial para salvar suas preferências e simulações. Com sua autorização, também poderemos utilizar recursos de análise e publicidade para melhorar e manter o site.",
      acceptAll: "Aceitar tudo", reject: "Rejeitar não essenciais", configure: "Configurar preferências", save: "Salvar preferências",
      essential: "Essenciais", essentialText: "Necessários para salvar simulações e manter o site funcionando.",
      preferences: "Preferências", preferencesText: "Idioma, aparência e configurações escolhidas.",
      analytics: "Análise", analyticsText: "Métricas de utilização, somente quando uma ferramenta for instalada e autorizada.",
      advertising: "Publicidade", advertisingText: "Anúncios e medição publicitária, somente após autorização aplicável.",
      alwaysActive: "Sempre ativos", saved: "Preferências de privacidade salvas."
    },
    dashboard: {
      title: "Painel gerencial de vendas", description: "Indicadores e tendências calculados somente com as vendas registradas neste navegador.", empty: "Registre suas vendas para visualizar indicadores e tendências.",
      filters: "Filtros", period: "Período", sevenDays: "7 dias", thirtyDays: "30 dias", ninetyDays: "90 dias", currentYear: "Ano atual", allTime: "Todo o período", custom: "Personalizado", from: "Data inicial", to: "Data final", type: "Tipo", creature: "Criatura", channel: "Canal", method: "Método", result: "Resultado", all: "Todos", positive: "Positivo", negative: "Negativo", grouping: "Agrupar por", day: "Dia", week: "Semana", month: "Mês",
      salesCount: "Quantidade de vendas", revenue: "Receita total", cost: "Custo total", profit: "Lucro total", margin: "Margem média", ticket: "Ticket médio", investment: "Investimento médio", averageProfit: "Lucro médio por venda", profitable: "Vendas com lucro", losses: "Vendas com prejuízo", bestSale: "Melhor venda", bestCreature: "Criatura mais lucrativa",
      financialEvolution: "Evolução financeira", salesEvolution: "Vendas ao longo do tempo", creatureTypes: "Mascote versus Montascote", channels: "Canais de venda", topCreatures: "Criaturas mais lucrativas", roi: "Retorno sobre investimento", methods: "Métodos de evolução", distribution: "Distribuição dos resultados", bestPeriod: "Melhor período", quantity: "Quantidade", average: "Média", averageMargin: "Margem média", averageCost: "Custo médio", lowProfit: "Lucro baixo", mediumProfit: "Lucro médio", highProfit: "Lucro alto", nearZero: "Próximo de zero", largestRevenue: "Maior receita", mostSales: "Maior número de vendas", largestProfit: "Maior lucro", noData: "Sem dados para os filtros selecionados.", accessibleSummary: "Resumo textual do gráfico"
    },
    info: {
      title: "Sobre e transparência", about: "Sobre o Dofus4Business", how: "Como funciona", terms: "Termos de Uso", privacy: "Privacidade e dados", cookies: "Cookies e preferências", sources: "Fontes e atualização dos dados", rights: "Direitos sobre marcas e imagens", contact: "Contato e apoio ao projeto",
      aboutText: "O Dofus4Business é uma ferramenta comunitária para comparar custos, planejar evoluções e acompanhar resultados econômicos no jogo.",
      howText: "Crie uma simulação em cinco etapas: escolha a criatura, defina os níveis, selecione o método de evolução, informe os custos e revise antes de salvar.",
      termsText: "Os cálculos são estimativas baseadas nos valores informados pelo usuário. Verifique preços e regras dentro do jogo antes de tomar decisões.",
      privacyText: "Dados não pessoais de vendas, como criatura, custos, preço e canal, podem ser enviados para gerar estatísticas e melhorar o serviço. Não solicitamos nome real, conta, e-mail, senha ou dados de pagamento. Excluir uma venda local não aciona uma exclusão remota.",
      cookiesText: "Armazenamento essencial mantém simulações, idioma e preferências. Análise e publicidade permanecem desativadas até autorização e até que serviços compatíveis sejam instalados.",
      sourcesText: "O catálogo de criaturas foi organizado pelo Dofus4Business a partir do arquivo fornecido pelo proprietário. As URLs de imagens são registradas individualmente no catálogo. Valores de XP e recursos possuem referências declaradas no projeto.",
      rightsText: "DOFUS, personagens, nomes, marcas e imagens relacionadas pertencem aos respectivos titulares. A presença de uma referência não significa que a imagem esteja livre de direitos autorais.",
      contactText: "Ajude a manter o Dofus4Business no ar. A manutenção da hospedagem, do domínio e das ferramentas gera custos.", sourceHeaders: { category:"Categoria", data:"Dado", source:"Fonte", license:"Licença / observação", checked:"Última verificação" }, sourceRows: { creatureCatalog:{category:"Catálogo de criaturas",data:"Relação, tipo e nomes",license:"Organização do projeto; marcas pertencem aos titulares."}, creatureImages:{category:"Imagens",data:"URL individual por criatura",license:"Condição informada em cada entrada; sem alegação de domínio público."}, feedingXp:{category:"XP e alimentação",data:"Curva de XP e recursos",license:"Dados referenciais; verificar atualizações do jogo."}, githubPages:{category:"Publicação",data:"Domínio e hospedagem estática",license:"Documentação técnica."} }
    },
    footer: { sourceSummary: "Dados e nomes: Catálogo Dofus4Business • Imagens: fontes identificadas por arquivo • XP: fonte indicada no projeto • Atualizado em: {date}", privacyPreferences: "Preferências de privacidade", transparency: "Sobre e transparência" }
  },
  "fr-FR": {
    common: { copySuffix: "copie", adHelp: "Espace destiné aux annonces qui contribuent à la maintenance du site.", moreOptions: "Plus d’options", close: "Fermer", save: "Enregistrer", cancel: "Annuler", remove: "Supprimer" },
    nav: { dashboard: "Tableau de bord", simulations: "Simulations", sales: "Ventes", guide: "Fonctionnement", information: "À propos et transparence" },
    home: { title: "Décidez avant d’investir vos kamas", description: "Comparez les coûts, simulez l’évolution et estimez votre bénéfice.", eyebrow: "Économie des familiers" },
    simulations: { moreOptions: "Plus d’options", viewDetails: "Voir les détails" },
    consent: { title: "Préférences de confidentialité", text: "Nous utilisons un stockage essentiel pour sauvegarder vos préférences et simulations. Avec votre autorisation, nous pourrons aussi utiliser des outils d’analyse et de publicité.", acceptAll: "Tout accepter", reject: "Refuser le non essentiel", configure: "Configurer", save: "Enregistrer", essential: "Essentiels", essentialText: "Nécessaires au fonctionnement et à la sauvegarde.", preferences: "Préférences", preferencesText: "Langue, apparence et réglages.", analytics: "Analyse", analyticsText: "Mesures d’utilisation uniquement après installation et autorisation.", advertising: "Publicité", advertisingText: "Annonces et mesure publicitaire après autorisation.", alwaysActive: "Toujours actifs", saved: "Préférences enregistrées." },
    dashboard: { title: "Tableau de bord des ventes", description: "Indicateurs calculés uniquement avec vos ventes enregistrées.", empty: "Enregistrez des ventes pour afficher les indicateurs et tendances.", filters: "Filtres", period: "Période", sevenDays: "7 jours", thirtyDays: "30 jours", ninetyDays: "90 jours", currentYear: "Année en cours", allTime: "Toute la période", custom: "Personnalisé", from: "Date de début", to: "Date de fin", type: "Type", creature: "Créature", channel: "Canal", method: "Méthode", result: "Résultat", all: "Tous", positive: "Positif", negative: "Négatif", grouping: "Regrouper par", day: "Jour", week: "Semaine", month: "Mois", salesCount: "Nombre de ventes", revenue: "Chiffre d’affaires", cost: "Coût total", profit: "Bénéfice total", margin: "Marge moyenne", ticket: "Panier moyen", investment: "Investissement moyen", averageProfit: "Bénéfice moyen", profitable: "Ventes bénéficiaires", losses: "Ventes déficitaires", bestSale: "Meilleure vente", bestCreature: "Créature la plus rentable", financialEvolution: "Évolution financière", salesEvolution: "Ventes dans le temps", creatureTypes: "Familier ou montilier", channels: "Canaux de vente", topCreatures: "Créatures les plus rentables", roi: "Retour sur investissement", methods: "Méthodes d’évolution", distribution: "Répartition des résultats", bestPeriod: "Meilleure période", quantity: "Quantité", average: "Moyenne", averageMargin: "Marge moyenne", averageCost: "Coût moyen", lowProfit: "Faible bénéfice", mediumProfit: "Bénéfice moyen", highProfit: "Bénéfice élevé", nearZero: "Proche de zéro", largestRevenue: "Plus grand revenu", mostSales: "Plus de ventes", largestProfit: "Plus grand bénéfice", noData: "Aucune donnée pour ces filtres.", accessibleSummary: "Résumé textuel du graphique" },
    info: { title: "À propos et transparence", about: "À propos de Dofus4Business", how: "Fonctionnement", terms: "Conditions d’utilisation", privacy: "Confidentialité et données", cookies: "Cookies et préférences", sources: "Sources et mise à jour", rights: "Droits sur les marques et images", contact: "Contact et soutien", aboutText: "Dofus4Business est un outil communautaire pour comparer les coûts et suivre les résultats économiques.", howText: "Créez une simulation en cinq étapes : créature, niveaux, méthode, coûts et révision.", termsText: "Les calculs sont des estimations basées sur vos valeurs. Vérifiez les prix et règles dans le jeu.", privacyText: "Des données de vente non personnelles peuvent contribuer aux statistiques. Nous ne demandons ni nom, ni compte, ni e-mail, ni mot de passe.", cookiesText: "Le stockage essentiel conserve vos données. L’analyse et la publicité restent désactivées sans autorisation.", sourcesText: "Le catalogue provient du fichier fourni par le propriétaire et les sources d’images sont enregistrées par entrée.", rightsText: "DOFUS et les contenus associés appartiennent à leurs titulaires. Une référence ne signifie pas qu’une image est libre de droits.", contactText: "Soutenez la maintenance gratuite de Dofus4Business.", sourceHeaders:{category:"Catégorie",data:"Donnée",source:"Source",license:"Licence / remarque",checked:"Dernière vérification"}, sourceRows:{creatureCatalog:{category:"Catalogue des créatures",data:"Liste, type et noms",license:"Organisation du projet ; marques appartenant à leurs titulaires."},creatureImages:{category:"Images",data:"URL individuelle par créature",license:"Condition indiquée par entrée ; aucune affirmation de domaine public."},feedingXp:{category:"XP et alimentation",data:"Courbe d’XP et ressources",license:"Données de référence à vérifier après les mises à jour."},githubPages:{category:"Publication",data:"Domaine et hébergement statique",license:"Documentation technique."}} },
    footer: { sourceSummary: "Données et noms : catalogue Dofus4Business • Images : sources par fichier • XP : source indiquée • Mise à jour : {date}", privacyPreferences: "Préférences de confidentialité", transparency: "À propos et transparence" }
  },
  "en-US": {
    common: { copySuffix: "copy", adHelp: "Space reserved for ads that help maintain the website.", moreOptions: "More options", close: "Close", save: "Save", cancel: "Cancel", remove: "Remove" },
    nav: { dashboard: "Dashboard", simulations: "Simulations", sales: "Sales", guide: "How it works", information: "About and transparency" },
    home: { title: "Decide before investing your kamas", description: "Compare costs, simulate leveling and estimate your profit.", eyebrow: "Pet economy" },
    simulations: { moreOptions: "More options", viewDetails: "View details" },
    consent: { title: "Privacy preferences", text: "We use essential storage to save your preferences and simulations. With your permission, analytics and advertising tools may also be used to improve and maintain the site.", acceptAll: "Accept all", reject: "Reject non-essential", configure: "Configure preferences", save: "Save preferences", essential: "Essential", essentialText: "Required to save simulations and keep the site working.", preferences: "Preferences", preferencesText: "Language, appearance and settings.", analytics: "Analytics", analyticsText: "Usage metrics only after a tool is installed and authorized.", advertising: "Advertising", advertisingText: "Ads and advertising measurement only after authorization.", alwaysActive: "Always active", saved: "Privacy preferences saved." },
    dashboard: { title: "Sales management dashboard", description: "Indicators and trends calculated only from sales stored by the site.", empty: "Register sales to view indicators and trends.", filters: "Filters", period: "Period", sevenDays: "7 days", thirtyDays: "30 days", ninetyDays: "90 days", currentYear: "Current year", allTime: "All time", custom: "Custom", from: "Start date", to: "End date", type: "Type", creature: "Creature", channel: "Channel", method: "Method", result: "Result", all: "All", positive: "Positive", negative: "Negative", grouping: "Group by", day: "Day", week: "Week", month: "Month", salesCount: "Sales count", revenue: "Total revenue", cost: "Total cost", profit: "Total profit", margin: "Average margin", ticket: "Average ticket", investment: "Average investment", averageProfit: "Average profit per sale", profitable: "Profitable sales", losses: "Loss-making sales", bestSale: "Best sale", bestCreature: "Most profitable creature", financialEvolution: "Financial evolution", salesEvolution: "Sales over time", creatureTypes: "Pet versus petsmount", channels: "Sales channels", topCreatures: "Most profitable creatures", roi: "Return on investment", methods: "Leveling methods", distribution: "Result distribution", bestPeriod: "Best period", quantity: "Quantity", average: "Average", averageMargin: "Average margin", averageCost: "Average cost", lowProfit: "Low profit", mediumProfit: "Medium profit", highProfit: "High profit", nearZero: "Near zero", largestRevenue: "Highest revenue", mostSales: "Most sales", largestProfit: "Highest profit", noData: "No data for the selected filters.", accessibleSummary: "Text summary of the chart" },
    info: { title: "About and transparency", about: "About Dofus4Business", how: "How it works", terms: "Terms of Use", privacy: "Privacy and data", cookies: "Cookies and preferences", sources: "Sources and data updates", rights: "Trademark and image rights", contact: "Contact and support", aboutText: "Dofus4Business is a community tool for comparing costs and tracking economic results.", howText: "Create a simulation in five steps: creature, levels, method, costs and review.", termsText: "Calculations are estimates based on values you provide. Check in-game prices and rules.", privacyText: "Non-personal sales data may contribute to statistics and improvements. We do not request real names, accounts, email addresses or passwords.", cookiesText: "Essential storage keeps the app working. Analytics and advertising remain disabled without authorization.", sourcesText: "The creature catalog comes from the file supplied by the owner. Image sources are recorded per entry.", rightsText: "DOFUS and related content belong to their respective owners. A reference does not mean an image is copyright-free.", contactText: "Support the free maintenance of Dofus4Business.", sourceHeaders:{category:"Category",data:"Data",source:"Source",license:"License / note",checked:"Last checked"}, sourceRows:{creatureCatalog:{category:"Creature catalog",data:"List, type and names",license:"Project organization; trademarks belong to their owners."},creatureImages:{category:"Images",data:"Individual URL per creature",license:"Condition recorded per entry; no public-domain claim."},feedingXp:{category:"XP and feeding",data:"XP curve and resources",license:"Reference data; verify after game updates."},githubPages:{category:"Publishing",data:"Domain and static hosting",license:"Technical documentation."}} },
    footer: { sourceSummary: "Data and names: Dofus4Business catalog • Images: source per file • XP: stated source • Updated: {date}", privacyPreferences: "Privacy preferences", transparency: "About and transparency" }
  },
  "es-ES": {
    common: { copySuffix: "copia", adHelp: "Espacio reservado para anuncios que ayudan a mantener el sitio.", moreOptions: "Más opciones", close: "Cerrar", save: "Guardar", cancel: "Cancelar", remove: "Eliminar" },
    nav: { dashboard: "Panel", simulations: "Simulaciones", sales: "Ventas", guide: "Cómo funciona", information: "Acerca de y transparencia" },
    home: { title: "Decide antes de invertir tus kamas", description: "Compara costes, simula la evolución y estima tu beneficio.", eyebrow: "Economía de mascotas" },
    simulations: { moreOptions: "Más opciones", viewDetails: "Ver detalles" },
    consent: { title: "Preferencias de privacidad", text: "Usamos almacenamiento esencial para guardar tus preferencias y simulaciones. Con tu autorización, también podremos usar análisis y publicidad.", acceptAll: "Aceptar todo", reject: "Rechazar no esenciales", configure: "Configurar preferencias", save: "Guardar preferencias", essential: "Esenciales", essentialText: "Necesarios para guardar simulaciones y mantener el sitio.", preferences: "Preferencias", preferencesText: "Idioma, apariencia y configuración.", analytics: "Análisis", analyticsText: "Métricas solo después de instalar y autorizar una herramienta.", advertising: "Publicidad", advertisingText: "Anuncios y medición solo después de autorización.", alwaysActive: "Siempre activos", saved: "Preferencias guardadas." },
    dashboard: { title: "Panel gerencial de ventas", description: "Indicadores calculados solo con ventas registradas.", empty: "Registra tus ventas para visualizar indicadores y tendencias.", filters: "Filtros", period: "Período", sevenDays: "7 días", thirtyDays: "30 días", ninetyDays: "90 días", currentYear: "Año actual", allTime: "Todo el período", custom: "Personalizado", from: "Fecha inicial", to: "Fecha final", type: "Tipo", creature: "Criatura", channel: "Canal", method: "Método", result: "Resultado", all: "Todos", positive: "Positivo", negative: "Negativo", grouping: "Agrupar por", day: "Día", week: "Semana", month: "Mes", salesCount: "Cantidad de ventas", revenue: "Ingresos totales", cost: "Coste total", profit: "Beneficio total", margin: "Margen media", ticket: "Ticket medio", investment: "Inversión media", averageProfit: "Beneficio medio", profitable: "Ventas con beneficio", losses: "Ventas con pérdida", bestSale: "Mejor venta", bestCreature: "Criatura más rentable", financialEvolution: "Evolución financiera", salesEvolution: "Ventas en el tiempo", creatureTypes: "Mascota versus mascotura", channels: "Canales de venta", topCreatures: "Criaturas más rentables", roi: "Retorno de inversión", methods: "Métodos de evolución", distribution: "Distribución de resultados", bestPeriod: "Mejor período", quantity: "Cantidad", average: "Media", averageMargin: "Margen media", averageCost: "Coste medio", lowProfit: "Beneficio bajo", mediumProfit: "Beneficio medio", highProfit: "Beneficio alto", nearZero: "Cerca de cero", largestRevenue: "Mayor ingreso", mostSales: "Más ventas", largestProfit: "Mayor beneficio", noData: "No hay datos para los filtros.", accessibleSummary: "Resumen textual del gráfico" },
    info: { title: "Acerca de y transparencia", about: "Acerca de Dofus4Business", how: "Cómo funciona", terms: "Términos de Uso", privacy: "Privacidad y datos", cookies: "Cookies y preferencias", sources: "Fuentes y actualización", rights: "Derechos de marcas e imágenes", contact: "Contacto y apoyo", aboutText: "Dofus4Business es una herramienta comunitaria para comparar costes y controlar resultados económicos.", howText: "Crea una simulación en cinco pasos: criatura, niveles, método, costes y revisión.", termsText: "Los cálculos son estimaciones basadas en los valores informados. Comprueba precios y reglas en el juego.", privacyText: "Datos no personales de ventas pueden contribuir a estadísticas. No solicitamos nombre real, cuenta, correo ni contraseña.", cookiesText: "El almacenamiento esencial mantiene la aplicación. Análisis y publicidad permanecen desactivados sin autorización.", sourcesText: "El catálogo procede del archivo suministrado por el propietario y las fuentes de imágenes se registran por entrada.", rightsText: "DOFUS y sus contenidos pertenecen a sus titulares. Una referencia no significa que una imagen esté libre de derechos.", contactText: "Apoya el mantenimiento gratuito de Dofus4Business.", sourceHeaders:{category:"Categoría",data:"Dato",source:"Fuente",license:"Licencia / observación",checked:"Última verificación"}, sourceRows:{creatureCatalog:{category:"Catálogo de criaturas",data:"Lista, tipo y nombres",license:"Organización del proyecto; las marcas pertenecen a sus titulares."},creatureImages:{category:"Imágenes",data:"URL individual por criatura",license:"Condición indicada por entrada; sin afirmar dominio público."},feedingXp:{category:"XP y alimentación",data:"Curva de XP y recursos",license:"Datos de referencia; comprobar actualizaciones."},githubPages:{category:"Publicación",data:"Dominio y alojamiento estático",license:"Documentación técnica."}} },
    footer: { sourceSummary: "Datos y nombres: catálogo Dofus4Business • Imágenes: fuentes por archivo • XP: fuente indicada • Actualizado: {date}", privacyPreferences: "Preferencias de privacidad", transparency: "Acerca de y transparencia" }
  }
};

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) target[key] = deepMerge(target[key] || {}, value);
    else target[key] = value;
  }
  return target;
}
for (const [language, additions] of Object.entries(translationAdditions)) deepMerge(translations[language], additions);

const v22Translations = {
  "pt-BR": { simulation: {
    combined: "Combinar recursos e ração", combinedQuantity: "{resources} recursos + {rations} rações", combinedSummary: "Recursos: {resourceXp} XP · complemento: {remainingXp} XP",
    combinedHelpTitle: "Use recursos para reduzir a quantidade de rações", combinedHelp: "Adicione os recursos que pretende usar e complete automaticamente a XP restante com Ração Vitaminada ou Bolsa de Kolifichas.",
    resourceCoverage: "Cobertura por recursos", remainingXp: "XP restante", searchResource: "Pesquisar no guia de recursos", searchResourceHint: "Digite parte do nome", customResource: "Recurso personalizado",
    resourceName: "Nome do recurso", invalidCustomResource: "Informe nome, XP e quantidade válidos.", rationComplement: "Complemento com ração", complementSource: "Fonte do complemento",
    validation: { combinedResources: "Adicione pelo menos um recurso para usar o método combinado.", combinedIncomplete: "Informe o preço do complemento necessário para atingir a XP." }
  }, home: { strategyTitle: "Estratégias puras ou combinadas", strategyText: "Use Ração Vitaminada, Bolsa de Kolifichas, recursos ou uma combinação de recursos com ração para reduzir o custo." } },
  "fr-FR": { simulation: {
    combined: "Combiner ressources et croquettes", combinedQuantity: "{resources} ressources + {rations} croquettes", combinedSummary: "Ressources : {resourceXp} XP · complément : {remainingXp} XP",
    combinedHelpTitle: "Utilisez des ressources pour réduire les croquettes", combinedHelp: "Ajoutez les ressources prévues puis complétez automatiquement l’XP restante avec des Croquettes enrichies ou des Sacs de Kolizétons.",
    resourceCoverage: "Couverture par ressources", remainingXp: "XP restante", searchResource: "Rechercher dans le guide", searchResourceHint: "Saisissez une partie du nom", customResource: "Ressource personnalisée",
    resourceName: "Nom de la ressource", invalidCustomResource: "Indiquez un nom, une XP et une quantité valides.", rationComplement: "Complément en croquettes", complementSource: "Source du complément",
    validation: { combinedResources: "Ajoutez au moins une ressource pour utiliser la méthode combinée.", combinedIncomplete: "Indiquez le prix du complément nécessaire pour atteindre l’XP." }
  } },
  "en-US": { simulation: {
    combined: "Combine resources and food", combinedQuantity: "{resources} resources + {rations} foods", combinedSummary: "Resources: {resourceXp} XP · supplement: {remainingXp} XP",
    combinedHelpTitle: "Use resources to reduce food quantity", combinedHelp: "Add the resources you plan to use, then automatically complete the remaining XP with Enriched Food or Kolossoken Bags.",
    resourceCoverage: "Resource coverage", remainingXp: "Remaining XP", searchResource: "Search the resource guide", searchResourceHint: "Type part of the name", customResource: "Custom resource",
    resourceName: "Resource name", invalidCustomResource: "Enter a valid name, XP value and quantity.", rationComplement: "Food supplement", complementSource: "Supplement source",
    validation: { combinedResources: "Add at least one resource to use the combined method.", combinedIncomplete: "Enter the price of the supplement needed to reach the XP target." }
  } },
  "es-ES": { simulation: {
    combined: "Combinar recursos y pienso", combinedQuantity: "{resources} recursos + {rations} piensos", combinedSummary: "Recursos: {resourceXp} XP · complemento: {remainingXp} XP",
    combinedHelpTitle: "Usa recursos para reducir el pienso", combinedHelp: "Añade los recursos que usarás y completa automáticamente la XP restante con Pienso enriquecido o Bolsas de kolichas.",
    resourceCoverage: "Cobertura con recursos", remainingXp: "XP restante", searchResource: "Buscar en la guía de recursos", searchResourceHint: "Escribe parte del nombre", customResource: "Recurso personalizado",
    resourceName: "Nombre del recurso", invalidCustomResource: "Indica un nombre, XP y cantidad válidos.", rationComplement: "Complemento de pienso", complementSource: "Origen del complemento",
    validation: { combinedResources: "Añade al menos un recurso para usar el método combinado.", combinedIncomplete: "Indica el precio del complemento necesario para alcanzar la XP." }
  } }
};
for (const [language, additions] of Object.entries(v22Translations)) deepMerge(translations[language], additions);

const v23Translations = {
  "pt-BR": { simulation: {
    xpBonus: "Bônus de XP", xpBonusExample: "Ex.: 50", xpBonusHelp: "Use para Almanax e outros bônus de alimentação. O percentual vale para rações, bolsas e recursos.", noBonus: "Sem bônus", activeXpBonus: "Bônus ativo", rationEffectiveXp: "Cada ração fornecerá {xp} XP.", effectiveXpPerUnit: "{xp} XP efetiva por unidade", activeBonusBadge: "Bônus de XP: {bonus}%", bonusAppliesAll: "O bônus é aplicado igualmente a todas as fontes de XP desta simulação.",
    baseXp: "XP base", effectiveXp: "XP efetiva", quantityToTarget: "Para completar sozinho", useRequiredQuantity: "Usar quantidade", resourceUnits: "unidades de recurso", rationUnits: "rações", rationsRequired: "{count} rações", bagsAndRationsRequired: "{bags} bolsas ({rations} rações)", resourcesRequired: "{count} recursos no plano", bonusXpGenerated: "{xp} XP gerada pelo bônus",
    xpNeedsInput: "XP a informar", xpNotProvidedByApi: "A API fornece o recurso, mas não a XP de alimentação. Informe a XP confirmada.", resourceLevel: "Nível", levelShort: "Nv.", dofusDudeResource: "Catálogo DofusDude", resourceCatalogLoading: "Carregando catálogo completo…", resourceCatalogReady: "{count} recursos disponíveis", resourceCatalogFallback: "Catálogo reduzido em uso", resourceCatalogHelp: "A lista completa vem da API pública do DofusDude. A XP é preenchida automaticamente quando já estiver confirmada; nos demais itens, informe a XP observada no jogo ou em uma fonte confiável."
  }, info: { sourceRows: { feedingXp: { data: "Curva de XP, bônus e valores confirmados de alimentação", license: "O catálogo de itens vem do DofusDude; a API não fornece a XP de alimentação de cada recurso." } } } },
  "fr-FR": { simulation: {
    xpBonus: "Bonus d’XP", xpBonusExample: "Ex. : 50", xpBonusHelp: "À utiliser pour l’Almanax et les autres bonus d’alimentation. Le pourcentage s’applique aux croquettes, sacs et ressources.", noBonus: "Aucun bonus", activeXpBonus: "Bonus actif", rationEffectiveXp: "Chaque croquette donnera {xp} XP.", effectiveXpPerUnit: "{xp} XP effective par unité", activeBonusBadge: "Bonus d’XP : {bonus}%", bonusAppliesAll: "Le bonus s’applique à toutes les sources d’XP de cette simulation.",
    baseXp: "XP de base", effectiveXp: "XP effective", quantityToTarget: "Quantité pour finir seul", useRequiredQuantity: "Utiliser la quantité", resourceUnits: "unités de ressource", rationUnits: "croquettes", rationsRequired: "{count} croquettes", bagsAndRationsRequired: "{bags} sacs ({rations} croquettes)", resourcesRequired: "{count} ressources dans le plan", bonusXpGenerated: "{xp} XP générée par le bonus",
    xpNeedsInput: "XP à renseigner", xpNotProvidedByApi: "L’API fournit la ressource, mais pas son XP d’alimentation. Indiquez une valeur confirmée.", resourceLevel: "Niveau", levelShort: "Niv.", dofusDudeResource: "Catalogue DofusDude", resourceCatalogLoading: "Chargement du catalogue complet…", resourceCatalogReady: "{count} ressources disponibles", resourceCatalogFallback: "Catalogue réduit utilisé", resourceCatalogHelp: "La liste complète provient de l’API publique DofusDude. L’XP est automatique lorsqu’elle est confirmée ; sinon, indiquez une valeur vérifiée."
  } },
  "en-US": { simulation: {
    xpBonus: "XP bonus", xpBonusExample: "E.g. 50", xpBonusHelp: "Use this for Almanax and other feeding bonuses. The percentage applies to food, bags and resources.", noBonus: "No bonus", activeXpBonus: "Active bonus", rationEffectiveXp: "Each food will grant {xp} XP.", effectiveXpPerUnit: "{xp} effective XP per unit", activeBonusBadge: "XP bonus: {bonus}%", bonusAppliesAll: "The bonus applies to every XP source in this simulation.",
    baseXp: "Base XP", effectiveXp: "Effective XP", quantityToTarget: "Needed if used alone", useRequiredQuantity: "Use quantity", resourceUnits: "resource units", rationUnits: "foods", rationsRequired: "{count} foods", bagsAndRationsRequired: "{bags} bags ({rations} foods)", resourcesRequired: "{count} resources in the plan", bonusXpGenerated: "{xp} XP generated by the bonus",
    xpNeedsInput: "XP required", xpNotProvidedByApi: "The API provides the resource, but not its pet-feeding XP. Enter a confirmed XP value.", resourceLevel: "Level", levelShort: "Lvl.", dofusDudeResource: "DofusDude catalog", resourceCatalogLoading: "Loading the full catalog…", resourceCatalogReady: "{count} resources available", resourceCatalogFallback: "Reduced catalog in use", resourceCatalogHelp: "The full list comes from the public DofusDude API. XP is filled automatically when confirmed; otherwise enter a verified value."
  } },
  "es-ES": { simulation: {
    xpBonus: "Bonificación de XP", xpBonusExample: "Ej.: 50", xpBonusHelp: "Úsala para el Almanax y otros bonus de alimentación. El porcentaje se aplica al pienso, bolsas y recursos.", noBonus: "Sin bonificación", activeXpBonus: "Bonificación activa", rationEffectiveXp: "Cada pienso dará {xp} XP.", effectiveXpPerUnit: "{xp} XP efectiva por unidad", activeBonusBadge: "Bonificación de XP: {bonus}%", bonusAppliesAll: "La bonificación se aplica a todas las fuentes de XP de esta simulación.",
    baseXp: "XP base", effectiveXp: "XP efectiva", quantityToTarget: "Necesarios si se usa solo", useRequiredQuantity: "Usar cantidad", resourceUnits: "unidades de recurso", rationUnits: "piensos", rationsRequired: "{count} piensos", bagsAndRationsRequired: "{bags} bolsas ({rations} piensos)", resourcesRequired: "{count} recursos en el plan", bonusXpGenerated: "{xp} XP generada por la bonificación",
    xpNeedsInput: "XP por indicar", xpNotProvidedByApi: "La API proporciona el recurso, pero no su XP de alimentación. Introduce un valor confirmado.", resourceLevel: "Nivel", levelShort: "Niv.", dofusDudeResource: "Catálogo DofusDude", resourceCatalogLoading: "Cargando el catálogo completo…", resourceCatalogReady: "{count} recursos disponibles", resourceCatalogFallback: "Catálogo reducido en uso", resourceCatalogHelp: "La lista completa procede de la API pública de DofusDude. La XP se completa cuando está confirmada; en los demás casos, introduce un valor verificado."
  } }
};
for (const [language, additions] of Object.entries(v23Translations)) deepMerge(translations[language], additions);

const v23ValidationAndSources = {
  "pt-BR": { simulation: { validation: { bonus: "Informe um bônus de XP entre 0% e 1000%." }, resourceXpMissingShort: "Informe a XP para calcular a quantidade.", resourceRequirementsTitle: "Quantidade necessária por recurso" }, info: { sourceRows: { resourceCatalog: { category: "Catálogo de recursos", data: "Todos os recursos disponíveis no jogo", license: "Dados do jogo disponibilizados pela API pública DofusDude; nomes e imagens pertencem aos respectivos titulares." } } } },
  "fr-FR": { simulation: { validation: { bonus: "Indiquez un bonus d’XP entre 0 % et 1 000 %." }, resourceXpMissingShort: "Indiquez l’XP pour calculer la quantité.", resourceRequirementsTitle: "Quantité nécessaire par ressource" }, info: { sourceRows: { resourceCatalog: { category: "Catalogue des ressources", data: "Toutes les ressources disponibles dans le jeu", license: "Données du jeu fournies par l’API publique DofusDude ; les noms et images appartiennent à leurs titulaires." } } } },
  "en-US": { simulation: { validation: { bonus: "Enter an XP bonus between 0% and 1,000%." }, resourceXpMissingShort: "Enter the XP value to calculate the quantity.", resourceRequirementsTitle: "Required quantity by resource" }, info: { sourceRows: { resourceCatalog: { category: "Resource catalog", data: "All resources available in the game", license: "Game data provided by the public DofusDude API; names and images belong to their respective owners." } } } },
  "es-ES": { simulation: { validation: { bonus: "Indica una bonificación de XP entre 0 % y 1000 %." }, resourceXpMissingShort: "Indica la XP para calcular la cantidad.", resourceRequirementsTitle: "Cantidad necesaria por recurso" }, info: { sourceRows: { resourceCatalog: { category: "Catálogo de recursos", data: "Todos los recursos disponibles en el juego", license: "Datos del juego proporcionados por la API pública DofusDude; los nombres e imágenes pertenecen a sus titulares." } } } }
};
for (const [language, additions] of Object.entries(v23ValidationAndSources)) deepMerge(translations[language], additions);


const v231Translations = {
  "pt-BR": { simulation: {
    combined: "Utilizar Recursos",
    resources: "Utilizar Recursos",
    combinedHelpTitle: "Use recursos e complete somente o que faltar",
    combinedHelp: "Adicione os recursos que pretende usar. Se eles não cobrirem toda a XP, complete automaticamente o restante com Ração Vitaminada ou Bolsa de Kolifichas. Se chegarem a 100%, nenhuma ração será necessária.",
    addCustomResourceOption: "Adicionar recurso personalizado",
    searchResourceHint: "Pesquise ou escolha um recurso"
  } },
  "fr-FR": { simulation: {
    combined: "Utiliser des ressources",
    resources: "Utiliser des ressources",
    combinedHelpTitle: "Utilisez des ressources et complétez seulement le reste",
    combinedHelp: "Ajoutez les ressources prévues. Si elles ne couvrent pas toute l’XP, complétez automatiquement le reste avec des croquettes enrichies ou des sacs de Kolizétons. À 100 %, aucun complément n’est nécessaire.",
    addCustomResourceOption: "Ajouter une ressource personnalisée",
    searchResourceHint: "Rechercher ou choisir une ressource"
  } },
  "en-US": { simulation: {
    combined: "Use Resources",
    resources: "Use Resources",
    combinedHelpTitle: "Use resources and supplement only what is missing",
    combinedHelp: "Add the resources you plan to use. If they do not cover all required XP, automatically supplement the remainder with Vitaminized Food or Kolitoken Bags. At 100%, no food is required.",
    addCustomResourceOption: "Add custom resource",
    searchResourceHint: "Search or choose a resource"
  } },
  "es-ES": { simulation: {
    combined: "Utilizar recursos",
    resources: "Utilizar recursos",
    combinedHelpTitle: "Usa recursos y completa solo lo que falte",
    combinedHelp: "Añade los recursos que quieras usar. Si no cubren toda la XP, completa automáticamente el resto con Comida Vitaminada o Bolsas de Kolichas. Al llegar al 100 %, no hará falta pienso.",
    addCustomResourceOption: "Añadir recurso personalizado",
    searchResourceHint: "Buscar o elegir un recurso"
  } }
};
for (const [language, additions] of Object.entries(v231Translations)) deepMerge(translations[language], additions);

export const interpolate = (text, variables = {}) =>
  String(text ?? "").replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? `{${key}}`);

export const getTranslation = (language, path, variables = {}) => {
  const parts = path.split(".");
  const read = (source) => parts.reduce((value, key) => value?.[key], source);
  const value = read(translations[language]) ?? read(translations["pt-BR"]) ?? path;
  return typeof value === "string" ? interpolate(value, variables) : value;
};

const v3Translations = {
  "pt-BR": { v3: {
    common: { platformSubtitle: "Gestão econômica modular para DOFUS" },
    nav: { home: "Início", pets: "Up de Pets", crafts: "Crafts", sales: "Vendas", inventory: "Estoque", settings: "Configurações" },
    home: { eyebrow: "Central de negócios", title: "Seus projetos, vendas e investimentos em um só lugar", description: "Planeje o up de pets, organize produções, acompanhe estoque e transforme custos em decisões melhores.", emptyTitle: "Comece pelo módulo que combina com seu objetivo", emptyText: "Crie uma simulação de pet ou seu primeiro projeto de craft. O painel será preenchido somente com seus dados reais." },
    modules: {
      active: "Disponível",
      pets: { title: "Up de Pets", short: "Pets", description: "Simule a evolução de mascotes e montascotes, compare estratégias, calcule custos e acompanhe suas vendas.", open: "Abrir Up de Pets" },
      crafts: { title: "Crafts e Produção", short: "Crafts", description: "Analise receitas, planeje produções, compare custos, gerencie estoque e descubra o melhor ponto de venda.", open: "Abrir Crafts" }
    },
    dashboard: { eyebrow: "Visão consolidada", title: "Dashboard econômico global", description: "Valores potenciais e realizados permanecem separados e podem ser filtrados por módulo." },
    metrics: { estimatedAssets: "Patrimônio estimado", estimatedNote: "Baseado no custo atual do estoque", invested: "Capital investido", inventoryValue: "Valor em estoque", awaitingSale: "Aguardando venda", potentialRevenue: "Receita potencial", potentialProfit: "Lucro potencial", realizedRevenue: "Receita realizada", realizedProfit: "Lucro realizado", activeProjects: "Projetos ativos" },
    filters: { all: "Todos", module: "Módulo", channel: "Canal" },
    activities: { title: "Movimentações", recent: "Atividades recentes", empty: "As atividades aparecerão conforme você criar projetos e registrar vendas.", simulation_updated: "Simulação atualizada", sale_registered: "Venda registrada", craft_project_created: "Projeto criado", craft_project_updated: "Projeto atualizado", craft_completed: "Produção concluída", craft_for_sale: "Item disponibilizado para venda", craft_sale_registered: "Venda de craft registrada", inventory_adjusted: "Estoque ajustado" },
    inventory: { title: "Estoque global", eyebrow: "Ativos disponíveis", description: "Consolidação dos itens explicitamente disponíveis para venda.", craftDescription: "Lotes fabricados, quantidades disponíveis, reservas e valor contábil.", awaitingSale: "Aguardando venda", availableItems: "Itens disponíveis", empty: "Nenhum item foi disponibilizado para venda.", emptyHelp: "Conclua uma produção para gerar um lote e uma entrada de estoque.", units: "unidades", desiredPrice: "Preço desejado", open: "Abrir item", forSale: "Disponível para venda", inStock: "Em estoque", available: "disponíveis", totalQuantity: "Quantidade total", reserved: "Reservado", stockValue: "Valor em estoque", putForSale: "Colocar à venda", removeFromSale: "Retirar da venda", adjust: "Ajustar estoque" },
    sales: { eyebrow: "Visão consolidada", title: "Vendas globais", description: "Vendas de pets e crafts reunidas sem alterar os registros originais de cada módulo.", count: "Quantidade de vendas", searchPlaceholder: "Pesquisar item", item: "Item", quantity: "Quantidade", cost: "Custo", value: "Valor de venda", profit: "Lucro", direct: "Venda direta", register: "Registrar venda", empty: "Nenhuma venda corresponde aos filtros.", emptyCrafts: "Nenhuma venda de craft registrada." },
    crafts: {
      newProject: "Novo projeto de craft", projects: "Projetos de produção", firstProject: "Criar primeiro projeto", emptyTitle: "Nenhum projeto de craft", emptyText: "Pesquise um item, carregue sua receita e planeje a primeira produção.", projectEditor: "Planejamento de produção", editorDescription: "A receita vem da DofusDude; preços, estoque e estratégia pertencem ao seu planejamento local.", chooseItem: "Escolha o item produzido", searchItem: "Pesquisar item", searchPlaceholder: "Digite parte do nome do item", searchHint: "Digite pelo menos dois caracteres para pesquisar.", apiUnavailable: "O catálogo externo está indisponível. O módulo de Up de Pets continua funcionando normalmente.", plan: "Plano e preços", quantity: "Quantidade desejada", finishedMarketPrice: "Preço do item pronto no mercado", desiredSalePrice: "Preço desejado de venda por unidade", additionalCosts: "Outros custos", saleChannel: "Canal previsto", costingMethod: "Método de custeio", weightedAverage: "Custo médio ponderado", financialCost: "Custo financeiro", economicCost: "Custo econômico", unitCost: "Custo contábil unitário", marketBuyCost: "Custo para comprar pronto", margin: "Margem prevista", notes: "Observações", ingredients: "Ingredientes", ingredientsHelp: "Defina preços e escolha comprar, usar estoque ou fabricar cada ingrediente.", noRecipe: "A API não retornou uma receita para este item.", chooseItemFirst: "Escolha um item para carregar a receita.", acquisition: "Obtenção", buy: "Comprar", useStock: "Usar estoque", manufacture: "Fabricar", unitPrice: "Preço unitário", stockUse: "Quantidade do estoque", loadSubrecipe: "Carregar sub-receita", subrecipe: "Sub-receita", perUnit: "por unidade", total: "no projeto", summary: "Resumo do projeto", missingPrices: "{count} ingrediente(s) ainda sem preço.", saveProject: "Salvar projeto", completeProduction: "Concluir produção", sales: "Vendas de crafts", salesDescription: "Histórico de vendas concluídas a partir dos lotes fabricados.", status: { draft: "Rascunho", planned: "Planejado", awaiting_resources: "Aguardando recursos", ready: "Pronto para produção", in_production: "Em produção", finalized: "Finalizado", awaiting_sale: "Disponível para venda", reserved: "Reservado", sold: "Vendido", cancelled: "Cancelado" }
    }
  } },
  "fr-FR": { v3: {
    common:{platformSubtitle:"Gestion économique modulaire pour DOFUS"}, nav:{home:"Accueil",pets:"Élevage des familiers",crafts:"Fabrication",sales:"Ventes",inventory:"Stock",settings:"Paramètres"},
    home:{eyebrow:"Centre d'affaires",title:"Vos projets, ventes et investissements au même endroit",description:"Planifiez les familiers, organisez la production, suivez le stock et prenez de meilleures décisions.",emptyTitle:"Commencez par le module adapté à votre objectif",emptyText:"Créez une simulation de familier ou votre premier projet de fabrication."},
    modules:{active:"Disponible",pets:{title:"Élevage des familiers",short:"Familiers",description:"Simulez l'évolution, comparez les stratégies et suivez les ventes.",open:"Ouvrir les familiers"},crafts:{title:"Fabrication et production",short:"Fabrication",description:"Analysez les recettes, planifiez la production, gérez le stock et les ventes.",open:"Ouvrir la fabrication"}},
    dashboard:{eyebrow:"Vue consolidée",title:"Tableau de bord économique global",description:"Les valeurs potentielles et réalisées restent séparées."},
    metrics:{estimatedAssets:"Patrimoine estimé",estimatedNote:"Basé sur le coût actuel du stock",invested:"Capital investi",inventoryValue:"Valeur du stock",awaitingSale:"En attente de vente",potentialRevenue:"Revenu potentiel",potentialProfit:"Bénéfice potentiel",realizedRevenue:"Revenu réalisé",realizedProfit:"Bénéfice réalisé",activeProjects:"Projets actifs"},
    filters:{all:"Tous",module:"Module",channel:"Canal"}, activities:{title:"Mouvements",recent:"Activités récentes",empty:"Les activités apparaîtront ici.",simulation_updated:"Simulation mise à jour",sale_registered:"Vente enregistrée",craft_project_created:"Projet créé",craft_project_updated:"Projet mis à jour",craft_completed:"Production terminée",craft_for_sale:"Article mis en vente",craft_sale_registered:"Vente de fabrication enregistrée",inventory_adjusted:"Stock ajusté"},
    inventory:{title:"Stock global",eyebrow:"Actifs disponibles",description:"Articles explicitement disponibles à la vente.",craftDescription:"Lots fabriqués et valeur comptable.",awaitingSale:"En attente de vente",availableItems:"Articles disponibles",empty:"Aucun article disponible à la vente.",emptyHelp:"Terminez une production pour créer un lot.",units:"unités",desiredPrice:"Prix souhaité",open:"Ouvrir",forSale:"Disponible à la vente",inStock:"En stock",available:"disponibles",totalQuantity:"Quantité totale",reserved:"Réservé",stockValue:"Valeur du stock",putForSale:"Mettre en vente",removeFromSale:"Retirer de la vente",adjust:"Ajuster"},
    sales:{eyebrow:"Vue consolidée",title:"Ventes globales",description:"Ventes des familiers et fabrications réunies.",count:"Nombre de ventes",searchPlaceholder:"Rechercher un article",item:"Article",quantity:"Quantité",cost:"Coût",value:"Valeur de vente",profit:"Bénéfice",direct:"Vente directe",register:"Enregistrer la vente",empty:"Aucune vente ne correspond aux filtres.",emptyCrafts:"Aucune vente de fabrication."},
    crafts:{newProject:"Nouveau projet",projects:"Projets de production",firstProject:"Créer le premier projet",emptyTitle:"Aucun projet",emptyText:"Recherchez un article et chargez sa recette.",projectEditor:"Planification de production",editorDescription:"La recette vient de DofusDude ; les prix et le stock restent locaux.",chooseItem:"Choisir l'article produit",searchItem:"Rechercher un article",searchPlaceholder:"Saisissez une partie du nom",searchHint:"Saisissez au moins deux caractères.",apiUnavailable:"Le catalogue externe est indisponible. Le module des familiers reste fonctionnel.",plan:"Plan et prix",quantity:"Quantité souhaitée",finishedMarketPrice:"Prix du produit fini",desiredSalePrice:"Prix de vente souhaité",additionalCosts:"Autres coûts",saleChannel:"Canal prévu",costingMethod:"Méthode de coût",weightedAverage:"Coût moyen pondéré",financialCost:"Coût financier",economicCost:"Coût économique",unitCost:"Coût unitaire",marketBuyCost:"Coût d'achat du produit fini",margin:"Marge prévue",notes:"Notes",ingredients:"Ingrédients",ingredientsHelp:"Choisissez acheter, utiliser le stock ou fabriquer.",noRecipe:"Aucune recette retournée.",chooseItemFirst:"Choisissez un article.",acquisition:"Obtention",buy:"Acheter",useStock:"Utiliser le stock",manufacture:"Fabriquer",unitPrice:"Prix unitaire",stockUse:"Quantité du stock",loadSubrecipe:"Charger la sous-recette",subrecipe:"Sous-recette",perUnit:"par unité",total:"dans le projet",summary:"Résumé",missingPrices:"{count} ingrédient(s) sans prix.",saveProject:"Enregistrer",completeProduction:"Terminer la production",sales:"Ventes de fabrication",salesDescription:"Historique des ventes des lots fabriqués.",status:{draft:"Brouillon",planned:"Planifié",awaiting_resources:"En attente de ressources",ready:"Prêt",in_production:"En production",finalized:"Terminé",awaiting_sale:"Disponible à la vente",reserved:"Réservé",sold:"Vendu",cancelled:"Annulé"}}
  } },
  "en-US": { v3: {
    common:{platformSubtitle:"Modular economic management for DOFUS"},nav:{home:"Home",pets:"Pet Leveling",crafts:"Crafts",sales:"Sales",inventory:"Inventory",settings:"Settings"},
    home:{eyebrow:"Business hub",title:"Your projects, sales and investments in one place",description:"Plan pet leveling, organize production, track inventory and make better decisions.",emptyTitle:"Start with the module that matches your goal",emptyText:"Create a pet simulation or your first craft project."},
    modules:{active:"Available",pets:{title:"Pet Leveling",short:"Pets",description:"Simulate pet and petsmount leveling, compare strategies and track sales.",open:"Open Pet Leveling"},crafts:{title:"Crafts and Production",short:"Crafts",description:"Analyze recipes, plan production, manage inventory and sales.",open:"Open Crafts"}},
    dashboard:{eyebrow:"Consolidated view",title:"Global economic dashboard",description:"Potential and realized values remain clearly separated."},metrics:{estimatedAssets:"Estimated assets",estimatedNote:"Based on current inventory cost",invested:"Invested capital",inventoryValue:"Inventory value",awaitingSale:"Awaiting sale",potentialRevenue:"Potential revenue",potentialProfit:"Potential profit",realizedRevenue:"Realized revenue",realizedProfit:"Realized profit",activeProjects:"Active projects"},filters:{all:"All",module:"Module",channel:"Channel"},activities:{title:"Activity",recent:"Recent activity",empty:"Activities will appear as you create projects and record sales.",simulation_updated:"Simulation updated",sale_registered:"Sale recorded",craft_project_created:"Project created",craft_project_updated:"Project updated",craft_completed:"Production completed",craft_for_sale:"Item listed for sale",craft_sale_registered:"Craft sale recorded",inventory_adjusted:"Inventory adjusted"},
    inventory:{title:"Global inventory",eyebrow:"Available assets",description:"Items explicitly available for sale.",craftDescription:"Crafted batches, available quantities and accounting value.",awaitingSale:"Awaiting sale",availableItems:"Available items",empty:"No items are available for sale.",emptyHelp:"Complete a production to create a batch.",units:"units",desiredPrice:"Desired price",open:"Open item",forSale:"Available for sale",inStock:"In stock",available:"available",totalQuantity:"Total quantity",reserved:"Reserved",stockValue:"Inventory value",putForSale:"List for sale",removeFromSale:"Remove from sale",adjust:"Adjust inventory"},sales:{eyebrow:"Consolidated view",title:"Global sales",description:"Pet and craft sales combined without changing original records.",count:"Sales count",searchPlaceholder:"Search item",item:"Item",quantity:"Quantity",cost:"Cost",value:"Sale value",profit:"Profit",direct:"Direct sale",register:"Record sale",empty:"No sales match the filters.",emptyCrafts:"No craft sales recorded."},
    crafts:{newProject:"New craft project",projects:"Production projects",firstProject:"Create first project",emptyTitle:"No craft projects",emptyText:"Search for an item and load its recipe.",projectEditor:"Production planning",editorDescription:"Recipes come from DofusDude; prices and inventory stay local.",chooseItem:"Choose produced item",searchItem:"Search item",searchPlaceholder:"Type part of the item name",searchHint:"Type at least two characters.",apiUnavailable:"The external catalog is unavailable. Pet Leveling continues to work.",plan:"Plan and prices",quantity:"Desired quantity",finishedMarketPrice:"Finished item market price",desiredSalePrice:"Desired unit sale price",additionalCosts:"Other costs",saleChannel:"Expected channel",costingMethod:"Costing method",weightedAverage:"Weighted average cost",financialCost:"Financial cost",economicCost:"Economic cost",unitCost:"Accounting unit cost",marketBuyCost:"Cost to buy finished",margin:"Expected margin",notes:"Notes",ingredients:"Ingredients",ingredientsHelp:"Choose to buy, use inventory or craft each ingredient.",noRecipe:"No recipe was returned.",chooseItemFirst:"Choose an item first.",acquisition:"Acquisition",buy:"Buy",useStock:"Use inventory",manufacture:"Craft",unitPrice:"Unit price",stockUse:"Inventory quantity",loadSubrecipe:"Load sub-recipe",subrecipe:"Sub-recipe",perUnit:"per unit",total:"in project",summary:"Project summary",missingPrices:"{count} ingredient(s) have no price.",saveProject:"Save project",completeProduction:"Complete production",sales:"Craft sales",salesDescription:"Sales history from crafted batches.",status:{draft:"Draft",planned:"Planned",awaiting_resources:"Awaiting resources",ready:"Ready",in_production:"In production",finalized:"Finalized",awaiting_sale:"Available for sale",reserved:"Reserved",sold:"Sold",cancelled:"Cancelled"}}
  } },
  "es-ES": { v3: {
    common:{platformSubtitle:"Gestión económica modular para DOFUS"},nav:{home:"Inicio",pets:"Subida de mascotas",crafts:"Crafteos",sales:"Ventas",inventory:"Inventario",settings:"Configuración"},home:{eyebrow:"Centro de negocios",title:"Tus proyectos, ventas e inversiones en un solo lugar",description:"Planifica mascotas, organiza producciones y controla el inventario.",emptyTitle:"Empieza por el módulo que encaje con tu objetivo",emptyText:"Crea una simulación o tu primer proyecto de crafteo."},modules:{active:"Disponible",pets:{title:"Subida de mascotas",short:"Mascotas",description:"Simula la evolución, compara estrategias y controla ventas.",open:"Abrir mascotas"},crafts:{title:"Crafteos y producción",short:"Crafteos",description:"Analiza recetas, planifica producción, inventario y ventas.",open:"Abrir crafteos"}},dashboard:{eyebrow:"Vista consolidada",title:"Panel económico global",description:"Los valores potenciales y realizados permanecen separados."},metrics:{estimatedAssets:"Patrimonio estimado",estimatedNote:"Basado en el coste actual del inventario",invested:"Capital invertido",inventoryValue:"Valor del inventario",awaitingSale:"Pendiente de venta",potentialRevenue:"Ingresos potenciales",potentialProfit:"Beneficio potencial",realizedRevenue:"Ingresos realizados",realizedProfit:"Beneficio realizado",activeProjects:"Proyectos activos"},filters:{all:"Todos",module:"Módulo",channel:"Canal"},activities:{title:"Movimientos",recent:"Actividad reciente",empty:"Las actividades aparecerán aquí.",simulation_updated:"Simulación actualizada",sale_registered:"Venta registrada",craft_project_created:"Proyecto creado",craft_project_updated:"Proyecto actualizado",craft_completed:"Producción finalizada",craft_for_sale:"Artículo puesto a la venta",craft_sale_registered:"Venta de crafteo registrada",inventory_adjusted:"Inventario ajustado"},inventory:{title:"Inventario global",eyebrow:"Activos disponibles",description:"Artículos disponibles para la venta.",craftDescription:"Lotes fabricados y valor contable.",awaitingSale:"Pendiente de venta",availableItems:"Artículos disponibles",empty:"No hay artículos disponibles.",emptyHelp:"Finaliza una producción para crear un lote.",units:"unidades",desiredPrice:"Precio deseado",open:"Abrir",forSale:"Disponible para venta",inStock:"En inventario",available:"disponibles",totalQuantity:"Cantidad total",reserved:"Reservado",stockValue:"Valor del inventario",putForSale:"Poner a la venta",removeFromSale:"Retirar de la venta",adjust:"Ajustar"},sales:{eyebrow:"Vista consolidada",title:"Ventas globales",description:"Ventas de mascotas y crafteos reunidas.",count:"Cantidad de ventas",searchPlaceholder:"Buscar artículo",item:"Artículo",quantity:"Cantidad",cost:"Coste",value:"Valor de venta",profit:"Beneficio",direct:"Venta directa",register:"Registrar venta",empty:"Ninguna venta coincide con los filtros.",emptyCrafts:"No hay ventas de crafteos."},crafts:{newProject:"Nuevo proyecto",projects:"Proyectos de producción",firstProject:"Crear primer proyecto",emptyTitle:"No hay proyectos",emptyText:"Busca un artículo y carga su receta.",projectEditor:"Planificación de producción",editorDescription:"Las recetas vienen de DofusDude; precios e inventario son locales.",chooseItem:"Elegir artículo producido",searchItem:"Buscar artículo",searchPlaceholder:"Escribe parte del nombre",searchHint:"Escribe al menos dos caracteres.",apiUnavailable:"El catálogo externo no está disponible. Las mascotas siguen funcionando.",plan:"Plan y precios",quantity:"Cantidad deseada",finishedMarketPrice:"Precio del producto terminado",desiredSalePrice:"Precio de venta deseado",additionalCosts:"Otros costes",saleChannel:"Canal previsto",costingMethod:"Método de coste",weightedAverage:"Coste medio ponderado",financialCost:"Coste financiero",economicCost:"Coste económico",unitCost:"Coste unitario",marketBuyCost:"Coste de compra terminado",margin:"Margen prevista",notes:"Notas",ingredients:"Ingredientes",ingredientsHelp:"Elige comprar, usar inventario o fabricar.",noRecipe:"No se devolvió receta.",chooseItemFirst:"Elige un artículo.",acquisition:"Obtención",buy:"Comprar",useStock:"Usar inventario",manufacture:"Fabricar",unitPrice:"Precio unitario",stockUse:"Cantidad de inventario",loadSubrecipe:"Cargar subreceta",subrecipe:"Subreceta",perUnit:"por unidad",total:"en el proyecto",summary:"Resumen",missingPrices:"{count} ingrediente(s) sin precio.",saveProject:"Guardar proyecto",completeProduction:"Finalizar producción",sales:"Ventas de crafteos",salesDescription:"Historial de ventas de lotes fabricados.",status:{draft:"Borrador",planned:"Planificado",awaiting_resources:"Esperando recursos",ready:"Listo",in_production:"En producción",finalized:"Finalizado",awaiting_sale:"Disponible para venta",reserved:"Reservado",sold:"Vendido",cancelled:"Cancelado"}}
  } }
};
for (const [language, additions] of Object.entries(v3Translations)) deepMerge(translations[language], additions);

const v3SupplementalTranslations = {
  'pt-BR': { v3: { crafts: { completeHelp: 'Confirme a quantidade produzida e escolha se o lote já ficará disponível para venda.' }, sales: { buyer: 'Comprador (opcional)' } } },
  'fr-FR': { v3: { crafts: { completeHelp: 'Confirmez la quantité produite et choisissez si le lot sera disponible à la vente.' }, sales: { buyer: 'Acheteur (facultatif)' } } },
  'en-US': { v3: { crafts: { completeHelp: 'Confirm the produced quantity and choose whether the batch will be available for sale.' }, sales: { buyer: 'Buyer (optional)' } } },
  'es-ES': { v3: { crafts: { completeHelp: 'Confirma la cantidad producida y si el lote quedará disponible para la venta.' }, sales: { buyer: 'Comprador (opcional)' } } }
};
for (const [language, additions] of Object.entries(v3SupplementalTranslations)) deepMerge(translations[language], additions);

const v3PeriodTranslations = {
  'pt-BR': { v3: { filters: { today: 'Hoje', currentMonth: 'Mês atual' } } },
  'fr-FR': { v3: { filters: { today: "Aujourd’hui", currentMonth: 'Mois en cours' } } },
  'en-US': { v3: { filters: { today: 'Today', currentMonth: 'Current month' } } },
  'es-ES': { v3: { filters: { today: 'Hoy', currentMonth: 'Mes actual' } } }
};
for (const [language, additions] of Object.entries(v3PeriodTranslations)) deepMerge(translations[language], additions);

const v3SaleChannelTranslations = {
  'pt-BR': { v3: { sales: { server:'Servidor', trade:'Troca', guild:'Guilda', commerce:'Comércio', other:'Outro' } } },
  'fr-FR': { v3: { sales: { server:'Serveur', trade:'Échange', guild:'Guilde', commerce:'Commerce', other:'Autre' } } },
  'en-US': { v3: { sales: { server:'Server', trade:'Trade', guild:'Guild', commerce:'Trade chat', other:'Other' } } },
  'es-ES': { v3: { sales: { server:'Servidor', trade:'Intercambio', guild:'Gremio', commerce:'Comercio', other:'Otro' } } }
};
for (const [language, additions] of Object.entries(v3SaleChannelTranslations)) deepMerge(translations[language], additions);

const v301Translations = {
  'pt-BR': { v3: { crafts: {
    filteringCraftable: 'Verificando itens com receita…', noCraftableResults: 'Nenhum item fabricável foi encontrado. Recursos e itens sem receita não são exibidos.',
    drop: 'Dropar', recipeLocked: 'Ingrediente da receita', immutableRecipe: 'Receita oficial bloqueada',
    notReadyTitle: 'Projeto ainda não está pronto', readyBlockHelp: 'Preencha o preço de todos os ingredientes para liberar a produção e a venda.',
    readyTitle: 'Projeto pronto para produção', readyHelp: 'Todos os ingredientes possuem preço e o projeto pode ser marcado como pronto.',
    saveDraft: 'Salvar rascunho', markReady: 'Salvar como pronto', deleteProjectTitle: 'Excluir projeto de craft',
    deleteProjectText: 'Excluir este projeto? Lotes e vendas já gerados permanecerão preservados.', projectDeleted: 'Projeto de craft excluído.',
    projectDuplicated: 'Projeto duplicado como rascunho.', completeBlocked: 'Preencha todos os preços antes de concluir ou colocar o item à venda.'
  } } },
  'fr-FR': { v3: { crafts: {
    filteringCraftable: 'Vérification des objets avec recette…', noCraftableResults: 'Aucun objet fabricable trouvé. Les ressources et objets sans recette sont masqués.',
    drop: 'Obtenir en combat', recipeLocked: 'Ingrédient de la recette', immutableRecipe: 'Recette officielle verrouillée',
    notReadyTitle: 'Le projet n’est pas encore prêt', readyBlockHelp: 'Renseignez le prix de tous les ingrédients pour débloquer la production et la vente.',
    readyTitle: 'Projet prêt pour la production', readyHelp: 'Tous les ingrédients ont un prix et le projet peut être marqué prêt.',
    saveDraft: 'Enregistrer le brouillon', markReady: 'Marquer comme prêt', deleteProjectTitle: 'Supprimer le projet',
    deleteProjectText: 'Supprimer ce projet ? Les lots et ventes déjà créés seront conservés.', projectDeleted: 'Projet supprimé.',
    projectDuplicated: 'Projet dupliqué en brouillon.', completeBlocked: 'Renseignez tous les prix avant de terminer ou mettre en vente.'
  } } },
  'en-US': { v3: { crafts: {
    filteringCraftable: 'Checking items with recipes…', noCraftableResults: 'No craftable item was found. Resources and items without recipes are hidden.',
    drop: 'Drop', recipeLocked: 'Recipe ingredient', immutableRecipe: 'Official recipe locked',
    notReadyTitle: 'Project is not ready yet', readyBlockHelp: 'Enter a price for every ingredient to unlock production and selling.',
    readyTitle: 'Project ready for production', readyHelp: 'Every ingredient has a price and the project can be marked ready.',
    saveDraft: 'Save draft', markReady: 'Save as ready', deleteProjectTitle: 'Delete craft project',
    deleteProjectText: 'Delete this project? Existing batches and sales will remain preserved.', projectDeleted: 'Craft project deleted.',
    projectDuplicated: 'Project duplicated as a draft.', completeBlocked: 'Enter all prices before completing or listing the item for sale.'
  } } },
  'es-ES': { v3: { crafts: {
    filteringCraftable: 'Comprobando objetos con receta…', noCraftableResults: 'No se encontró ningún objeto fabricable. Los recursos y objetos sin receta están ocultos.',
    drop: 'Dropear', recipeLocked: 'Ingrediente de la receta', immutableRecipe: 'Receta oficial bloqueada',
    notReadyTitle: 'El proyecto aún no está listo', readyBlockHelp: 'Indica el precio de todos los ingredientes para habilitar la producción y la venta.',
    readyTitle: 'Proyecto listo para producir', readyHelp: 'Todos los ingredientes tienen precio y el proyecto puede marcarse como listo.',
    saveDraft: 'Guardar borrador', markReady: 'Guardar como listo', deleteProjectTitle: 'Eliminar proyecto de craft',
    deleteProjectText: '¿Eliminar este proyecto? Los lotes y ventas ya creados se conservarán.', projectDeleted: 'Proyecto eliminado.',
    projectDuplicated: 'Proyecto duplicado como borrador.', completeBlocked: 'Indica todos los precios antes de finalizar o poner a la venta.'
  } } }
};
for (const [language, additions] of Object.entries(v301Translations)) deepMerge(translations[language], additions);

const v302Translations = {
  'pt-BR': { common: { loading: 'Carregando…' }, dashboard: {
    typeMetricLabel: 'Métrica — Mascote x Montascote',
    channelMetricLabel: 'Métrica — canais de venda',
    methodMetricLabel: 'Métrica — métodos de evolução'
  }, v3: { crafts: {
    editorDescription: 'Planeje a produção, defina como obter cada ingrediente e acompanhe o custo final.',
    ingredientsHelp: 'Informe preços, aproveite itens do estoque ou abra sub-receitas quando decidir fabricar um ingrediente.',
    totalCost: 'Custo total',
    unitCost: 'Custo por unidade',
    stockUse: 'Usar do estoque',
    maxStock: 'Máx.',
    fromStock: 'do estoque',
    showRecipe: 'Mostrar receita',
    hideRecipe: 'Ocultar receita',
    priceRequired: 'Informe o preço da quantidade que será comprada.',
    recipeRequired: 'Carregue e complete a sub-receita para fabricar este ingrediente.',
    recipeCycle: 'Esta receita criaria uma referência circular e não pode ser expandida.',
    notCraftable: 'Este ingrediente não possui receita e não pode ser fabricado.',
    missingPrices: '{count} pendência(s) na árvore de receitas.',
    loadSubrecipe: 'Carregar receita',
    saveProject: 'Salvar projeto',
    saveDraft: 'Salvar rascunho',
    savedAsDraft: 'Rascunho salvo. Complete as pendências para liberar a produção.',
    savedAsReady: 'Projeto salvo e pronto para produção.'
  } } },
  'fr-FR': { common: { loading: 'Chargement…' }, dashboard: {
    typeMetricLabel: 'Mesure — Familier x Montilier',
    channelMetricLabel: 'Mesure — canaux de vente',
    methodMetricLabel: 'Mesure — méthodes d’évolution'
  }, v3: { crafts: {
    editorDescription: 'Planifiez la production, définissez comment obtenir chaque ingrédient et suivez le coût final.',
    ingredientsHelp: 'Renseignez les prix, utilisez le stock disponible ou ouvrez les sous-recettes lorsque vous fabriquez un ingrédient.',
    totalCost: 'Coût total', unitCost: 'Coût par unité', stockUse: 'Utiliser du stock', maxStock: 'Max.', fromStock: 'du stock',
    showRecipe: 'Afficher la recette', hideRecipe: 'Masquer la recette', priceRequired: 'Renseignez le prix de la quantité achetée.',
    recipeRequired: 'Chargez et complétez la sous-recette pour fabriquer cet ingrédient.', recipeCycle: 'Cette recette créerait une référence circulaire et ne peut pas être développée.',
    notCraftable: 'Cet ingrédient ne possède pas de recette et ne peut pas être fabriqué.', missingPrices: '{count} élément(s) à compléter dans l’arbre des recettes.',
    loadSubrecipe: 'Charger la recette', saveProject: 'Enregistrer le projet', saveDraft: 'Enregistrer le brouillon',
    savedAsDraft: 'Brouillon enregistré. Complétez les éléments manquants pour débloquer la production.', savedAsReady: 'Projet enregistré et prêt pour la production.'
  } } },
  'en-US': { common: { loading: 'Loading…' }, dashboard: {
    typeMetricLabel: 'Metric — Pet x Petsmount',
    channelMetricLabel: 'Metric — sales channels',
    methodMetricLabel: 'Metric — leveling methods'
  }, v3: { crafts: {
    editorDescription: 'Plan production, define how each ingredient will be obtained, and track the final cost.',
    ingredientsHelp: 'Enter prices, use available inventory, or open sub-recipes when you choose to craft an ingredient.',
    totalCost: 'Total cost', unitCost: 'Cost per unit', stockUse: 'Use from inventory', maxStock: 'Max.', fromStock: 'from inventory',
    showRecipe: 'Show recipe', hideRecipe: 'Hide recipe', priceRequired: 'Enter the price for the quantity that will be purchased.',
    recipeRequired: 'Load and complete the sub-recipe to craft this ingredient.', recipeCycle: 'This recipe would create a circular reference and cannot be expanded.',
    notCraftable: 'This ingredient has no recipe and cannot be crafted.', missingPrices: '{count} pending item(s) in the recipe tree.',
    loadSubrecipe: 'Load recipe', saveProject: 'Save project', saveDraft: 'Save draft',
    savedAsDraft: 'Draft saved. Complete the pending items to unlock production.', savedAsReady: 'Project saved and ready for production.'
  } } },
  'es-ES': { common: { loading: 'Cargando…' }, dashboard: {
    typeMetricLabel: 'Métrica — Mascota x Mascotura',
    channelMetricLabel: 'Métrica — canales de venta',
    methodMetricLabel: 'Métrica — métodos de subida'
  }, v3: { crafts: {
    editorDescription: 'Planifica la producción, define cómo obtener cada ingrediente y controla el coste final.',
    ingredientsHelp: 'Indica precios, utiliza el inventario disponible o abre subrecetas cuando decidas fabricar un ingrediente.',
    totalCost: 'Coste total', unitCost: 'Coste por unidad', stockUse: 'Usar del inventario', maxStock: 'Máx.', fromStock: 'del inventario',
    showRecipe: 'Mostrar receta', hideRecipe: 'Ocultar receta', priceRequired: 'Indica el precio de la cantidad que se comprará.',
    recipeRequired: 'Carga y completa la subreceta para fabricar este ingrediente.', recipeCycle: 'Esta receta crearía una referencia circular y no puede expandirse.',
    notCraftable: 'Este ingrediente no tiene receta y no puede fabricarse.', missingPrices: '{count} elemento(s) pendientes en el árbol de recetas.',
    loadSubrecipe: 'Cargar receta', saveProject: 'Guardar proyecto', saveDraft: 'Guardar borrador',
    savedAsDraft: 'Borrador guardado. Completa lo pendiente para habilitar la producción.', savedAsReady: 'Proyecto guardado y listo para producir.'
  } } }
};
for (const [language, additions] of Object.entries(v302Translations)) deepMerge(translations[language], additions);

const v303Translations = {
  'pt-BR': { v303: {
    nameCopied: 'Nome copiado.', copyItemName: 'Copiar nome: {name}',
    ingredientsModalHelp: 'Escolha como obter cada ingrediente. As sub-receitas abrem em uma janela própria para manter a leitura confortável em qualquer profundidade.',
    readyMarketPrice: 'Preço pronto no mercado', readyMarketPriceHelp: 'Usado para comparar comprar o ingrediente pronto com fabricá-lo.',
    marketComparisonHelp: 'Comprar pronto x fabricar', buyReady: 'Comprar pronto', craftCheaper: 'Fabricar está mais barato', buyCheaper: 'Comprar pronto está mais barato', sameCost: 'Os custos são iguais',
    openRecipePlanner: 'Analisar receita', openRecipeLevel: 'Abrir sub-receita', recipePlanner: 'Planejador de receitas', recipePath: 'Caminho da receita', recipe: 'Receita', recipeCost: 'Custo desta receita',
    recipeModalHelp: 'Cada nível é exibido separadamente. Use o caminho acima para voltar sem aumentar a largura da tela.'
  } },
  'fr-FR': { v303: {
    nameCopied: 'Nom copié.', copyItemName: 'Copier le nom : {name}',
    ingredientsModalHelp: 'Choisissez comment obtenir chaque ingrédient. Les sous-recettes s’ouvrent dans une fenêtre dédiée afin de rester lisibles quelle que soit la profondeur.',
    readyMarketPrice: 'Prix de l’ingrédient prêt', readyMarketPriceHelp: 'Utilisé pour comparer l’achat de l’ingrédient prêt à sa fabrication.',
    marketComparisonHelp: 'Acheter prêt ou fabriquer', buyReady: 'Acheter prêt', craftCheaper: 'Fabriquer coûte moins cher', buyCheaper: 'Acheter prêt coûte moins cher', sameCost: 'Les coûts sont identiques',
    openRecipePlanner: 'Analyser la recette', openRecipeLevel: 'Ouvrir la sous-recette', recipePlanner: 'Planificateur de recettes', recipePath: 'Chemin de recette', recipe: 'Recette', recipeCost: 'Coût de cette recette',
    recipeModalHelp: 'Chaque niveau est affiché séparément. Utilisez le chemin ci-dessus pour revenir sans élargir l’écran.'
  } },
  'en-US': { v303: {
    nameCopied: 'Name copied.', copyItemName: 'Copy name: {name}',
    ingredientsModalHelp: 'Choose how each ingredient will be obtained. Sub-recipes open in a dedicated window so every depth remains easy to read.',
    readyMarketPrice: 'Ready-made market price', readyMarketPriceHelp: 'Used to compare buying the ingredient ready-made with crafting it.',
    marketComparisonHelp: 'Buy ready-made vs craft', buyReady: 'Buy ready-made', craftCheaper: 'Crafting is cheaper', buyCheaper: 'Buying ready-made is cheaper', sameCost: 'The costs are equal',
    openRecipePlanner: 'Analyse recipe', openRecipeLevel: 'Open sub-recipe', recipePlanner: 'Recipe planner', recipePath: 'Recipe path', recipe: 'Recipe', recipeCost: 'Recipe cost',
    recipeModalHelp: 'Each level is shown separately. Use the path above to go back without making the page wider.'
  } },
  'es-ES': { v303: {
    nameCopied: 'Nombre copiado.', copyItemName: 'Copiar nombre: {name}',
    ingredientsModalHelp: 'Elige cómo obtener cada ingrediente. Las subrecetas se abren en una ventana propia para mantener la lectura clara en cualquier profundidad.',
    readyMarketPrice: 'Precio listo en el mercado', readyMarketPriceHelp: 'Se usa para comparar comprar el ingrediente listo con fabricarlo.',
    marketComparisonHelp: 'Comprar listo o fabricar', buyReady: 'Comprar listo', craftCheaper: 'Fabricar es más barato', buyCheaper: 'Comprar listo es más barato', sameCost: 'Los costes son iguales',
    openRecipePlanner: 'Analizar receta', openRecipeLevel: 'Abrir subreceta', recipePlanner: 'Planificador de recetas', recipePath: 'Ruta de receta', recipe: 'Receta', recipeCost: 'Coste de esta receta',
    recipeModalHelp: 'Cada nivel se muestra por separado. Usa la ruta superior para volver sin ampliar la pantalla.'
  } }
};
for (const [language, additions] of Object.entries(v303Translations)) deepMerge(translations[language], additions);
