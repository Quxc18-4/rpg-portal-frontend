import { useState } from 'react';
import { playerApi } from '../../../api/services/player.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import ChestGrid from '../../../components/rpg/ChestGrid';
import ItemSlotCell from '../../../components/rpg/ItemSlotCell';

const MAIN_INVENTORY_SLOTS = Array.from({ length: 27 }, (_, i) => i + 9);
const HOTBAR_SLOTS = Array.from({ length: 9 }, (_, i) => i);

const ARMOR_ONLY_SLOTS = [
  { slot: 39, key: 'helmet', label: { vi: 'MŨ GIÁP', en: 'HELMET' } },
  { slot: 38, key: 'chestplate', label: { vi: 'ÁO GIÁP', en: 'CHESTPLATE' } },
  { slot: 37, key: 'leggings', label: { vi: 'QUẦN GIÁP', en: 'LEGGINGS' } },
  { slot: 36, key: 'boots', label: { vi: 'GIÀY GIÁP', en: 'BOOTS' } },
];

const OFFHAND_SLOT_DEF = {
  slot: 40,
  key: 'offHand',
  label: { vi: 'TAY PHỤ', en: 'OFF HAND' },
};

export default function PlayerInventoryTab({ activeSlotNumber, lang }) {
  const [inspectedItem, setInspectedItem] = useState(null);
  const [expandedBags, setExpandedBags] = useState({});

  const { data: invPayload, loading: invLoading } = useAsyncData(
    async () => {
      try {
        return await playerApi.getMyInventory({ slot: activeSlotNumber });
      } catch {
        return null;
      }
    },
    [activeSlotNumber]
  );

  if (invLoading) {
    return (
      <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
        [{lang === 'vi' ? 'ĐANG ĐỌC TÚI ĐỒ...' : 'DECODING INVENTORY...'}]
      </div>
    );
  }

  const vanillaInventory = Array.isArray(invPayload?.vanillaInventory)
    ? invPayload.vanillaInventory
    : [];
  const enderChestItems = Array.isArray(invPayload?.enderChest) ? invPayload.enderChest : [];
  const trinketsList = Array.isArray(invPayload?.trinkets) ? invPayload.trinkets : [];
  const backpacksList = Array.isArray(invPayload?.backpacks) ? invPayload.backpacks : [];

  const vanillaSlotMap = new Map(vanillaInventory.map((item) => [Number(item.slot), item]));

  const armorGroup = ARMOR_ONLY_SLOTS.map((def) => ({
    key: def.key,
    label: def.label[lang],
    item: vanillaSlotMap.get(def.slot) || null,
  }));

  const offhandEntry = {
    key: OFFHAND_SLOT_DEF.key,
    label: OFFHAND_SLOT_DEF.label[lang],
    item: vanillaSlotMap.get(OFFHAND_SLOT_DEF.slot) || null,
  };

  const trinketsBySlot = new Map(trinketsList.map((t) => [Number(t.slot), t]));
  const trinketGroup = [0, 1, 2, 3].map((slotIdx) => {
    const tItem = trinketsBySlot.get(slotIdx) || trinketsList[slotIdx] || null;
    return {
      key: `trinket_${slotIdx}`,
      label: tItem?.tags?.trinket_type
        ? String(tItem.tags.trinket_type).toUpperCase()
        : `TRINKET #${slotIdx + 1}`,
      item: tItem,
    };
  });

  const firstNonEmptyBagUuid =
    backpacksList.find((b) => Array.isArray(b.items) && b.items.length > 0)?.bagUuid || null;

  const isBagOpen = (bagUuid) => {
    if (expandedBags[bagUuid] !== undefined) return expandedBags[bagUuid];
    return bagUuid === firstNonEmptyBagUuid;
  };

  const toggleBag = (bagUuid) => {
    setExpandedBags((prev) => ({
      ...prev,
      [bagUuid]: !isBagOpen(bagUuid),
    }));
  };

  const toggleAllBags = (openState) => {
    const next = {};
    for (const bag of backpacksList) {
      next[bag.bagUuid] = openState;
    }
    setExpandedBags(next);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Cột trái: 3 Category Trang bị tách bạch + Item Inspector */}
      <div className="space-y-4 border border-border-strong bg-surface p-4 lg:col-span-5">
        {/* Category 1: Giáp Trụ */}
        <div className="space-y-2">
          <div className="border-b border-border-subtle pb-1.5 font-mono text-xs font-bold uppercase text-ink-primary">
            [01 // {lang === 'vi' ? 'GIÁP TRỤ ĐANG MẶC' : 'EQUIPPED ARMOR'}]
          </div>
          <div className="grid grid-cols-2 gap-2">
            {armorGroup.map((eq) => (
              <div
                key={eq.key}
                className="flex items-center gap-2 border border-border-subtle bg-canvas p-2"
              >
                <ItemSlotCell
                  item={eq.item}
                  size="md"
                  onClick={(it) => setInspectedItem(it)}
                />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-bold text-ink-secondary">
                    {eq.label}
                  </div>
                  <div className="truncate text-xs font-semibold text-ink-primary">
                    {eq.item?.displayName || eq.item?.type || '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category 2: Tay Phụ */}
        <div className="space-y-2">
          <div className="border-b border-border-subtle pb-1.5 font-mono text-xs font-bold uppercase text-ink-primary">
            [02 // {lang === 'vi' ? 'TRANG BỊ TAY PHỤ' : 'OFF-HAND SLOT'}]
          </div>
          <div className="flex items-center gap-2.5 border border-border-subtle bg-canvas p-2">
            <ItemSlotCell
              item={offhandEntry.item}
              size="md"
              onClick={(it) => setInspectedItem(it)}
            />
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-bold text-ink-secondary">
                {offhandEntry.label}
              </div>
              <div className="truncate text-xs font-semibold text-ink-primary">
                {offhandEntry.item?.displayName || offhandEntry.item?.type || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Category 3: Phụ Kiện / Trinkets */}
        <div className="space-y-2">
          <div className="border-b border-border-subtle pb-1.5 font-mono text-xs font-bold uppercase text-ink-primary">
            [03 // {lang === 'vi' ? 'PHỤ KIỆN & TRANG SỨC (TRINKETS)' : 'TRINKET SLOTS'}]
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trinketGroup.map((eq) => (
              <div
                key={eq.key}
                className="flex items-center gap-2 border border-border-subtle bg-canvas p-2"
              >
                <ItemSlotCell
                  item={eq.item}
                  size="md"
                  onClick={(it) => setInspectedItem(it)}
                />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-bold text-ink-secondary">
                    {eq.label}
                  </div>
                  <div className="truncate text-xs font-semibold text-ink-primary">
                    {eq.item?.displayName || eq.item?.type || '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Item Inspector */}
        <div className="border-2 border-border-strong bg-canvas p-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-1.5 font-mono text-xs font-bold">
            <span>[ITEM INSPECTOR]</span>
            {inspectedItem && (
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="text-ink-secondary hover:text-ink-primary"
              >
                [X]
              </button>
            )}
          </div>
          {inspectedItem ? (
            <div className="mt-2 border-2 border-mc-tooltip-border bg-mc-tooltip-bg p-2.5 font-mono text-xs text-white">
              <div className="font-bold text-[#55FFFF]">
                {inspectedItem.displayName || inspectedItem.type}
              </div>
              <div className="mt-1 space-y-0.5 text-[11px] text-[#AAAAAA]">
                {(inspectedItem.lore || []).map((line, i) => (
                  <div key={i}>{line || '\u00A0'}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 font-mono text-[11px] text-ink-secondary">
              {lang === 'vi'
                ? 'Bấm vào bất kỳ ô trang bị hoặc vật phẩm nào để xem chỉ số chi tiết.'
                : 'Click any item slot to inspect attributes and lore.'}
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: Túi đồ chính + Hotbar + EnderChest + Ba lô thu gọn */}
      <div className="space-y-4 border border-border-strong bg-surface p-4 lg:col-span-7">
        <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
          [PLAYER STORAGE // {lang === 'vi' ? 'TÚI ĐỒ CÁ NHÂN' : 'INVENTORY & HOTBAR'}]
        </div>

        <div className="space-y-2 overflow-x-auto">
          <ChestGrid
            title={lang === 'vi' ? 'TÚI ĐỒ CHÍNH (27 Ô)' : 'MAIN INVENTORY (27 SLOTS)'}
            items={vanillaInventory}
            slotIndices={MAIN_INVENTORY_SLOTS}
            mode="slot"
            onSelectItem={(it) => setInspectedItem(it)}
          />
          <ChestGrid
            title={lang === 'vi' ? 'THANH PHÍM TẮT (9 Ô)' : 'HOTBAR (9 SLOTS)'}
            items={vanillaInventory}
            slotIndices={HOTBAR_SLOTS}
            mode="slot"
            onSelectItem={(it) => setInspectedItem(it)}
          />
        </div>

        {enderChestItems.length > 0 && (
          <div className="overflow-x-auto border-t border-border-subtle pt-3">
            <ChestGrid
              title="ENDER CHEST (27 SLOTS)"
              items={enderChestItems}
              totalSlots={27}
              mode="slot"
              onSelectItem={(it) => setInspectedItem(it)}
            />
          </div>
        )}

        {backpacksList.length > 0 && (
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
              <span className="font-bold uppercase text-ink-primary">
                [BACKPACKS // {lang === 'vi' ? 'BA LÔ MANG THEO' : 'NESTED BACKPACKS'} (
                {backpacksList.length})]
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => toggleAllBags(true)}
                  className="border border-border-strong bg-canvas px-2 py-0.5 font-semibold hover:bg-subheader"
                >
                  {lang === 'vi' ? 'MỞ TẤT CẢ' : 'EXPAND ALL'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllBags(false)}
                  className="border border-border-strong bg-canvas px-2 py-0.5 font-semibold hover:bg-subheader"
                >
                  {lang === 'vi' ? 'THU GỌN' : 'COLLAPSE ALL'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {backpacksList.map((bag) => {
                const opened = isBagOpen(bag.bagUuid);
                const cap = Math.max(9, Number(bag.capacity || bag.items?.length || 27));
                const used = Array.isArray(bag.items) ? bag.items.length : 0;

                return (
                  <div key={bag.bagUuid} className="border border-border-strong bg-canvas">
                    <button
                      type="button"
                      onClick={() => toggleBag(bag.bagUuid)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-xs hover:bg-subheader"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-accent-emerald">
                          {opened ? '[-]' : '[+]'}
                        </span>
                        <span className="font-bold text-ink-primary">{bag.bagName}</span>
                        <span className="text-[11px] text-ink-secondary">
                          ({bag.parentLocation} #{bag.locatedAtSlot})
                        </span>
                      </div>
                      <span className="font-semibold text-ink-secondary tabular-nums">
                        [{used}/{cap} {lang === 'vi' ? 'Ô' : 'SLOTS'}]
                      </span>
                    </button>

                    {opened && (
                      <div className="overflow-x-auto border-t border-border-subtle bg-surface p-2">
                        <ChestGrid
                          items={bag.items || []}
                          totalSlots={cap}
                          mode="slot"
                          onSelectItem={(it) => setInspectedItem(it)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}