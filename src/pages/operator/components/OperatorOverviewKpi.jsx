import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';

export default function OperatorOverviewKpi({ overview, loading, lang }) {
  const eco = overview?.economy || overview || {};
  const counts = overview?.counts || overview?.stats || {};

  const playerWalletsTotal = eco.totalPlayerBalance ?? eco.playerWallets ?? 0;
  const guildBanksTotal = eco.totalGuildBalance ?? eco.guildBanks ?? 0;
  const auctionVolumeTotal = eco.totalAuctionVolume ?? eco.marketVolume ?? 0;
  const totalPlayers = counts.totalPlayers ?? counts.players ?? 0;
  const activeAuctions = counts.activeAuctions ?? counts.auctions ?? 0;
  const flaggedCount = counts.flaggedTransactions ?? eco.flaggedCount ?? 0;

  return (
    <div className="grid grid-cols-2 border border-border-strong bg-surface md:grid-cols-4">
      <div className="border-r border-b border-border-subtle p-3.5 md:border-b-0">
        <div className="font-mono text-[11px] uppercase text-ink-secondary">
          {lang === 'vi' ? 'TỔNG VÍ NGƯỜI CHƠI' : 'PLAYER WALLETS SUPPLY'}
        </div>
        <div className="mt-1">
          {loading ? (
            <span className="font-mono text-xs text-ink-secondary">[...]</span>
          ) : (
            <CurrencyDisplay currency={playerWalletsTotal} />
          )}
        </div>
      </div>

      <div className="border-b border-border-subtle p-3.5 md:border-r md:border-b-0">
        <div className="font-mono text-[11px] uppercase text-ink-secondary">
          {lang === 'vi' ? 'TỔNG NGÂN KHỐ BANG HỘI' : 'GUILD TREASURIES'}
        </div>
        <div className="mt-1">
          {loading ? (
            <span className="font-mono text-xs text-ink-secondary">[...]</span>
          ) : (
            <CurrencyDisplay currency={guildBanksTotal} />
          )}
        </div>
      </div>

      <div className="border-r border-border-subtle p-3.5">
        <div className="font-mono text-[11px] uppercase text-ink-secondary">
          {lang === 'vi' ? 'DOANH SỐ CHỢ ĐẤU GIÁ' : 'AUCTION TURNOVER'}
        </div>
        <div className="mt-1">
          {loading ? (
            <span className="font-mono text-xs text-ink-secondary">[...]</span>
          ) : (
            <CurrencyDisplay currency={auctionVolumeTotal} />
          )}
        </div>
      </div>

      <div className="p-3.5">
        <div className="font-mono text-[11px] uppercase text-ink-secondary">
          {lang === 'vi' ? 'HỒ SƠ // CHỢ // CỜ ĐỎ' : 'PLAYERS // AUCTIONS // FLAGS'}
        </div>
        <div className="mt-1 font-mono text-xs font-bold text-ink-primary tabular-nums">
          {loading ? (
            '[...]'
          ) : (
            <>
              {Number(totalPlayers).toLocaleString()} PLR //{' '}
              {Number(activeAuctions).toLocaleString()} AUC //{' '}
              <span className={flaggedCount > 0 ? 'text-accent-crimson' : 'text-accent-emerald'}>
                {Number(flaggedCount).toLocaleString()} FLAG
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}