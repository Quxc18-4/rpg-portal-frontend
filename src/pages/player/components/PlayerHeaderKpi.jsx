import { Link } from 'react-router-dom';
import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../../components/rpg/PlayerBadge';

export default function PlayerHeaderKpi({
  profile,
  playerIdentity,
  rankDetail,
  charResource,
  elementsList,
  lang,
}) {
  return (
    <>
      {/* Header Identity Block */}
      <div className="flex flex-wrap items-start justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
            [PLAYER HUB // PERSONAL CHARACTER LEDGER]
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <PlayerBadge player={playerIdentity} linkToProfile={false} showUuid />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <Link
            to={`/players/${encodeURIComponent(playerIdentity.username)}`}
            className="border border-border-strong bg-canvas px-3 py-1.5 font-semibold text-ink-primary hover:bg-subheader"
          >
            {lang === 'vi' ? 'XEM HỒ SƠ CÔNG KHAI >' : 'PUBLIC DOSSIER >'}
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 border border-border-strong bg-surface md:grid-cols-4">
        <div className="border-r border-b border-border-subtle p-3.5 md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'NGÂN KHỐ SLOT HIỆN TẠI' : 'SLOT WALLET BALANCE'}
          </div>
          <div className="mt-1">
            <CurrencyDisplay currency={profile.currency || 0} />
          </div>
        </div>

        <div className="border-b border-border-subtle p-3.5 md:border-r md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'BANG HỘI HIỆN TẠI' : 'GUILD AFFILIATION'}
          </div>
          <div className="mt-1 font-mono text-xs font-bold">
            {profile.guild ? (
              <Link
                to="/guilds/me"
                className="text-accent-emerald underline underline-offset-2"
              >
                {profile.guild.name} [{profile.guild.role || 'MEMBER'}]
              </Link>
            ) : (
              <span className="text-ink-secondary">
                {lang === 'vi' ? 'CHƯA GIA NHẬP BANG' : 'NO GUILD'}
              </span>
            )}
          </div>
        </div>

        <div className="border-r border-border-subtle p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'HẠNG MẠO HIỂM // DANH VỌNG' : 'ADVENTURER RANK // REP'}
          </div>
          <div className="mt-1 space-y-1 font-mono text-xs tabular-nums">
            <div className="font-bold text-ink-primary">
              [{rankDetail.rank}] — {rankDetail.reputation.toLocaleString()} REP
              {rankDetail.nextRank ? ` -> [${rankDetail.nextRank}]` : ''}
            </div>
            {rankDetail.nextRank && (
              <div className="border border-border-strong bg-canvas p-0.5">
                <div
                  style={{ width: `${rankDetail.progressPercent}%` }}
                  className="h-1 bg-accent-amber"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'NĂNG LƯỢNG // NGUYÊN TỐ' : 'RESOURCE // ELEMENTS'}
          </div>
          <div className="mt-1 space-y-1 font-mono text-xs">
            <div className="font-bold text-ink-primary tabular-nums">
              RES: {charResource.toLocaleString()}
            </div>
            {elementsList.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {elementsList.map((el) => (
                  <span
                    key={el}
                    className="border border-border-subtle bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-ink-secondary"
                  >
                    {String(el).toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}