import { FEEDING_XP, NON_TRADABLE_IDS } from './feedingXp.js';
import { SHEET_CONFLICTS, SHEET_NON_TRADABLE_IDS, SHEET_XP } from './sheetFeedingXp.js';
import { RATION_ANKAMA_ID, RATION_XP } from '../config/app.js';

// Dados do jogo + planilha. Quando divergem, vale o menor: melhor sobrar XP do que faltar.
export const PET_XP = { ...SHEET_XP, ...FEEDING_XP };
for (const [id, xp] of Object.entries(SHEET_CONFLICTS)) if (PET_XP[id]) PET_XP[id] = Math.min(PET_XP[id], xp);
// A Ração Vitaminada é um recurso, mas sua XP não vem da reciclagem.
PET_XP[RATION_ANKAMA_ID] = RATION_XP;

export const PET_NON_TRADABLE = new Set([...NON_TRADABLE_IDS, ...SHEET_NON_TRADABLE_IDS]);

// XP ainda não confirmada no jogo: só na planilha ou com valores divergentes.
export const isUncertainXp = id => id != null && (SHEET_CONFLICTS[id] !== undefined || (SHEET_XP[id] !== undefined && FEEDING_XP[id] === undefined));
// O outro valor conhecido, quando há divergência.
export const alternativeXp = id => SHEET_CONFLICTS[id] === undefined ? 0 : Math.max(SHEET_CONFLICTS[id], FEEDING_XP[id] || 0);
