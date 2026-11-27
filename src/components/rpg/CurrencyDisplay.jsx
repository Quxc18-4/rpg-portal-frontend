import { normalizeCurrency } from '../../utils/currency.util';
import { useLanguage } from '../../context/LanguageContext';

export default function CurrencyDisplay({
  currency,
  compact = false,
  emptyLabel = '—',
  className = '',
}) {
  const { lang } = useLanguage();

  if (currency === null || currency === undefined) {
    return (
      <span className={`font-mono text-xs text-ink-secondary ${className}`}>
        {emptyLabel}
      </span>
    );
  }

  const { gold, silver, copper } = normalizeCurrency(currency, lang);

  const units =
    lang === 'en'
      ? { g: compact ? 'G' : ' Gold', s: compact ? 'S' : ' Silver', c: compact ? 'C' : ' Copper' }
      : { g: compact ? 'V' : ' Vàng', s: compact ? 'B' : ' Bạc', c: compact ? 'Đ' : ' Đồng' };

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1.5 font-mono text-xs font-semibold tabular-nums ${className}`}
    >
      <span className="text-[#B45309]">
        {gold}
        {units.g}
      </span>
      <span className="text-border-subtle">/</span>
      <span className="text-[#3F3F46]">
        {silver}
        {units.s}
      </span>
      <span className="text-border-subtle">/</span>
      <span className="text-[#9A3412]">
        {copper}
        {units.c}
      </span>
    </span>
  );
}