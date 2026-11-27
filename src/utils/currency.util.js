export const COPPER_PER_SILVER = 64;
export const COPPER_PER_GOLD = 4096;

export function decomposeCopper(rawCopper = 0) {
  const safeRaw = Math.max(0, Math.floor(Number(rawCopper) || 0));
  const gold = Math.floor(safeRaw / COPPER_PER_GOLD);
  const remainderAfterGold = safeRaw % COPPER_PER_GOLD;
  const silver = Math.floor(remainderAfterGold / COPPER_PER_SILVER);
  const copper = remainderAfterGold % COPPER_PER_SILVER;

  return { raw: safeRaw, gold, silver, copper };
}

export function formatCopperText(rawCopper = 0, lang = 'vi') {
  const { gold, silver, copper } = decomposeCopper(rawCopper);
  if (lang === 'en') {
    return `${gold} Gold ${silver} Silver ${copper} Copper`;
  }
  return `${gold} Vàng ${silver} Bạc ${copper} Đồng`;
}

export function normalizeCurrency(currencyInput, lang = 'vi') {
  if (currencyInput === null || currencyInput === undefined) {
    return {
      raw: 0,
      gold: 0,
      silver: 0,
      copper: 0,
      formatted: formatCopperText(0, lang),
    };
  }

  if (typeof currencyInput === 'number') {
    const parts = decomposeCopper(currencyInput);
    return {
      ...parts,
      formatted: formatCopperText(parts.raw, lang),
    };
  }

  const raw = Number(currencyInput.raw ?? 0);
  const parts = decomposeCopper(raw);
  return {
    raw: parts.raw,
    gold: currencyInput.gold ?? parts.gold,
    silver: currencyInput.silver ?? parts.silver,
    copper: currencyInput.copper ?? parts.copper,
    formatted: currencyInput.formatted || formatCopperText(parts.raw, lang),
  };
}