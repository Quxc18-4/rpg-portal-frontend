import { useState, useCallback } from 'react';
import { resolveMinecraftColor } from '../../config/minecraftColors';
import MinecraftTooltip from './MinecraftTooltip';

function getCompactMaterialLabel(type = '') {
  const clean = String(type).replace(/^minecraft:/i, '').toUpperCase();
  if (!clean) return 'ITEM';
  const words = clean.split('_').filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 6);
  return words
    .slice(0, 2)
    .map((w) => w.slice(0, 3))
    .join('.');
}

export default function ItemSlotCell({
  item = null,
  slotIndex = null,
  selected = false,
  size = 'md',
  onClick,
}) {
  const [hoverPos, setHoverPos] = useState(null);

  const sizeClass =
    size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-14 w-14' : 'h-12 w-12';

  const handleMouseMove = useCallback((e) => {
    const tooltipWidth = 330;
    const tooltipHeight = 260;
    const offset = 14;

    let x = e.clientX + offset;
    let y = e.clientY + offset;

    if (x + tooltipWidth > window.innerWidth) {
      x = Math.max(8, e.clientX - tooltipWidth - offset);
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = Math.max(8, window.innerHeight - tooltipHeight - 8);
    }

    setHoverPos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  const rarityColor = item ? resolveMinecraftColor(item.color, '#FFFFFF') : null;

  return (
    <>
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick && item ? () => onClick(item) : undefined}
        onKeyDown={
          onClick && item
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick(item);
                }
              }
            : undefined
        }
        onMouseMove={item ? handleMouseMove : undefined}
        onMouseLeave={item ? handleMouseLeave : undefined}
        className={`relative flex select-none flex-col items-center justify-center border-t-2 border-l-2 border-b-2 border-r-2 border-t-mc-slot-dark border-l-mc-slot-dark border-b-mc-slot-light border-r-mc-slot-light bg-mc-slot ${sizeClass} ${
          item && onClick ? 'cursor-pointer hover:brightness-105' : ''
        } ${selected ? 'outline-2 outline-offset-0 outline-[#FFFF55]' : ''}`}
      >
        {item ? (
          <>
            {/* Vạch màu phân cấp độ hiếm trên đỉnh ô */}
            <span
              style={{ backgroundColor: rarityColor }}
              className="absolute top-0 left-0 right-0 h-[3px]"
            />

            {/* Mã rút gọn vật phẩm */}
            <span
              style={{ color: rarityColor }}
              className="px-0.5 text-center font-mono text-[10px] font-bold leading-tight tracking-tighter [text-shadow:1px_1px_0_#141416]"
            >
              {getCompactMaterialLabel(item.type)}
            </span>

            {/* Số lượng stack góc dưới phải kiểu Minecraft */}
            {Number(item.amount) > 1 && (
              <span className="absolute right-0.5 bottom-0 font-mono text-[11px] font-bold leading-none text-white tabular-nums [text-shadow:1px_1px_0_#141416]">
                {item.amount}
              </span>
            )}
          </>
        ) : (
          slotIndex !== null && (
            <span className="font-mono text-[9px] text-[#555555]">{slotIndex}</span>
          )
        )}
      </div>

      {item && hoverPos && <MinecraftTooltip item={item} position={hoverPos} />}
    </>
  );
}