import ItemSlotCell from './ItemSlotCell';
import { useLanguage } from '../../hooks/useLanguage';

export default function ChestGrid({
  title,
  items = [],
  totalSlots = 27,
  slotIndices = null,
  mode = 'slot',
  selectedSlot = null,
  onSelectItem,
  showEmptyIndices = false,
}) {
  const { lang } = useLanguage();

  const effectiveTotal = Array.isArray(slotIndices) ? slotIndices.length : totalSlots;

  const slots = (() => {
    if (mode === 'sequential') {
      const count = Math.max(effectiveTotal, items.length);
      return Array.from({ length: count }, (_, idx) => ({
        index: idx,
        item: items[idx] || null,
      }));
    }

    const slotMap = new Map();
    for (const item of items) {
      if (item && item.slot !== undefined && item.slot !== null) {
        slotMap.set(Number(item.slot), item);
      }
    }

    const indices = Array.isArray(slotIndices)
      ? slotIndices
      : Array.from({ length: totalSlots }, (_, idx) => idx);

    return indices.map((slotIdx) => ({
      index: slotIdx,
      item: slotMap.get(slotIdx) || null,
    }));
  })();

  return (
    <div className="inline-block border-2 border-border-strong bg-[#C6C6C6] p-2.5">
      {title && (
        <div className="mb-2 flex items-center justify-between font-mono text-xs font-bold text-mc-slot-dark">
          <span>{title}</span>
          <span className="tabular-nums">
            [{items.length}/{effectiveTotal} {lang === 'vi' ? 'Ô' : 'SLOTS'}]
          </span>
        </div>
      )}

      <div className="grid grid-cols-9 gap-0.5">
        {slots.map(({ index, item }) => (
          <ItemSlotCell
            key={index}
            item={item}
            slotIndex={showEmptyIndices ? index : null}
            selected={item !== null && selectedSlot === index}
            onClick={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
}