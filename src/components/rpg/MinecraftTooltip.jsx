import { resolveMinecraftColor } from '../../config/minecraftColors';

function formatMaterialFallback(type = '') {
  return String(type)
    .replace(/^minecraft:/i, '')
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
}

function resolveLoreLineColor(line) {
  const trimmed = String(line || '').trim();
  if (trimmed.startsWith('✦')) return '#AA00AA';
  if (trimmed.startsWith('▶')) return '#AAAAAA';
  if (trimmed.startsWith('[ Phân loại:') || trimmed.startsWith('[ Category:')) return '#555555';
  if (trimmed.includes('+') && trimmed.includes('%')) return '#FFFF55';
  return '#AAAAAA';
}

export default function MinecraftTooltip({ item, position }) {
  if (!item) return null;

  const titleText = item.displayName || formatMaterialFallback(item.type);
  const titleColor = resolveMinecraftColor(item.color, '#FFFFFF');
  const loreLines = Array.isArray(item.lore) ? item.lore : [];
  const rpgItemId = item.tags?.rpg_item_id;

  const style = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : undefined;

  return (
    <div
      style={style}
      className="pointer-events-none z-50 min-w-[230px] max-w-[350px] border-2 border-mc-tooltip-border bg-mc-tooltip-bg p-2.5 text-left font-sans leading-snug"
    >
      {/* Tên vật phẩm chuẩn màu Minecraft */}
      <div style={{ color: titleColor }} className="text-[13px] font-bold tracking-tight">
        {titleText}
      </div>

      {/* Các dòng Lore nguyên bản */}
      {loreLines.length > 0 && (
        <div className="mt-1.5 space-y-0.5 text-[12px]">
          {loreLines.map((line, idx) => {
            if (!line || line.trim() === '') {
              return <div key={idx} className="h-2" />;
            }
            return (
              <div
                key={idx}
                style={{ color: resolveLoreLineColor(line) }}
                className="whitespace-pre-wrap break-words"
              >
                {line}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer kỹ thuật kiểu Advanced Tooltips (F3+H) */}
      <div className="mt-2 border-t border-[#2A0066] pt-1 font-mono text-[10px] text-[#555555]">
        <div>{item.type}</div>
        {rpgItemId && <div className="text-[#00AAAA]">id: {rpgItemId}</div>}
      </div>
    </div>
  );
}