const PROFESSION_LABELS = {
  smith: { 'pt-BR': 'Ferreiro', 'fr-FR': 'Forgeron', 'en-US': 'Smith', 'es-ES': 'Forjador' },
  carver: { 'pt-BR': 'Escultor', 'fr-FR': 'Sculpteur', 'en-US': 'Carver', 'es-ES': 'Escultor' },
  jeweller: { 'pt-BR': 'Joalheiro', 'fr-FR': 'Bijoutier', 'en-US': 'Jeweller', 'es-ES': 'Joyero' },
  shoemaker: { 'pt-BR': 'Sapateiro', 'fr-FR': 'Cordonnier', 'en-US': 'Shoemaker', 'es-ES': 'Zapatero' },
  tailor: { 'pt-BR': 'Alfaiate', 'fr-FR': 'Tailleur', 'en-US': 'Tailor', 'es-ES': 'Sastre' },
  handyman: { 'pt-BR': 'Faz-tudo', 'fr-FR': 'Bricoleur', 'en-US': 'Handyman', 'es-ES': 'Manitas' },
  alchemist: { 'pt-BR': 'Alquimista', 'fr-FR': 'Alchimiste', 'en-US': 'Alchemist', 'es-ES': 'Alquimista' },
  farmer: { 'pt-BR': 'Camponês', 'fr-FR': 'Paysan', 'en-US': 'Farmer', 'es-ES': 'Campesino' },
  fisherman: { 'pt-BR': 'Pescador', 'fr-FR': 'Pêcheur', 'en-US': 'Fisherman', 'es-ES': 'Pescador' },
  hunter: { 'pt-BR': 'Caçador', 'fr-FR': 'Chasseur', 'en-US': 'Hunter', 'es-ES': 'Cazador' },
  unknown: { 'pt-BR': 'Profissão não identificada', 'fr-FR': 'Métier non identifié', 'en-US': 'Unidentified profession', 'es-ES': 'Oficio no identificado' }
};

const RULES = [
  ['jeweller', /(ring|amulet|alliance|anneau|amule|anillo|collar)/],
  ['shoemaker', /(boot|belt|shoe|bota|cinto|ceinture|botte|zapato|cintur)/],
  ['tailor', /(hat|cloak|cape|backpack|chapeau|coiffe|capa|sombrero|mochila)/],
  ['carver', /(bow|staff|wand|arc|bâton|baguette|arco|baston|varita)/],
  ['smith', /(sword|dagger|axe|hammer|shovel|scythe|sabre|épée|dague|hache|marteau|pelle|foice|espada|adaga|machado|martelo|pá|guadaña|shield|bouclier|escudo)/],
  ['handyman', /(key|breeding|paddock|idol|trophy|prism|clef|bricol|chave|troféu|trofeo)/],
  ['farmer', /(bread|flour|cereal|farmer|pain|farine|céréale|pão|farinha|cereal)/],
  ['fisherman', /(fish|fisher|poisson|peixe|pescado)/],
  ['hunter', /(meat|hunter|viande|carne|caçador|chasseur)/],
  ['alchemist', /(potion|elixir|substrate|essence|alchemist|poção|pocion|alchim)/]
];

export function resolveCraftProfession(typeNameId = '', typeName = '', category = '') {
  const searchable = `${typeNameId} ${typeName} ${category}`.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const match = RULES.find(([, pattern]) => pattern.test(searchable));
  return match?.[0] || 'unknown';
}

export function professionLabel(tag, language = 'pt-BR') {
  return PROFESSION_LABELS[tag]?.[language] || PROFESSION_LABELS[tag]?.['pt-BR'] || PROFESSION_LABELS.unknown[language] || PROFESSION_LABELS.unknown['pt-BR'];
}
