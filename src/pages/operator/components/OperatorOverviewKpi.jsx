import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';

export default function OperatorOverviewKpi({ overview, loading, lang }) {
  const playersInfo = overview?.players || {};
  const guildsInfo = overview?.guilds || {};
  const ecoInfo = overview?.economy || {};
  const auctionInfo = ecoInfo.auctionHouse || {};
  const tradeInfo = ecoInfo.directTrades || {};

  const playerWalletsTotal = playersInfo.totalWalletCirculation || 0;
  const guildBanksTotal = guildsInfo.totalBankReserves || 0;
  const auctionVolumeTotal = auctionInfo.completedSalesVolume || 0;

  const totalPlayers = Number(playersInfo.total ?? 0);
  const activeAuctions = Number(auctionInfo.activeListings ?? 0);
  const totalTrades = Number(tradeInfo.totalCompletedTrades ?? 0);

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
          {lang === 'vi' ? 'HỒ SƠ // CHỢ // GIAO DỊCH' : 'PLAYERS // AUCTIONS // TRADES'}
        </div>
        <div className="mt-1 font-mono text-xs font-bold text-ink-primary tabular-nums">
          {loading ? (
            '[...]'
          ) : (
            <>
              {totalPlayers.toLocaleString()} PLR // {activeAuctions.toLocaleString()} AUC //{' '}
              <span className="text-accent-emerald">{totalTrades.toLocaleString()} TRD</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}