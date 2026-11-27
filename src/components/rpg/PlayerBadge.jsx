import { Link } from 'react-router-dom';

export default function PlayerBadge({
  player,
  linkToProfile = true,
  showUuid = false,
  className = '',
}) {
  if (!player) {
    return <span className="font-mono text-xs text-ink-secondary">Unknown</span>;
  }

  const username = player.username || 'Unknown';

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 font-mono text-xs ${className}`}>
      {linkToProfile && username !== 'Unknown' ? (
        <Link
          to={`/players/${encodeURIComponent(username)}`}
          className="font-semibold text-ink-primary underline decoration-border-subtle underline-offset-2 hover:text-accent-emerald hover:decoration-accent-emerald"
        >
          {username}
        </Link>
      ) : (
        <span className="font-semibold text-ink-primary">{username}</span>
      )}

      {player.guildTag && (
        <span className="border border-border-subtle bg-canvas px-1 py-0.2 text-[11px] font-semibold text-ink-secondary">
          [{player.guildTag}]
        </span>
      )}

      {player.isVip && (
        <span className="border border-accent-amber bg-surface px-1 py-0.2 text-[11px] font-bold text-accent-amber">
          [VIP]
        </span>
      )}

      {player.adventurerRank && (
        <span className="border border-border-strong bg-subheader px-1 py-0.2 text-[11px] font-bold text-ink-primary">
          [{player.adventurerRank}]
        </span>
      )}

      {player.role && player.role !== 'USER' && player.role !== 'PLAYER' && (
        <span className="border border-accent-emerald bg-surface px-1 py-0.2 text-[11px] font-bold text-accent-emerald">
          [{player.role}]
        </span>
      )}

      {showUuid && player.uuid && (
        <span className="text-[10px] text-ink-secondary">{player.uuid}</span>
      )}
    </span>
  );
}