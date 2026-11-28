import { playerApi } from '../../../api/services/player.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { formatDateTime } from '../../../utils/date.util';
import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

export default function PlayerRewardsBetsTab({ lang }) {
  const { data: rewardsData, loading: rewardsLoading } = useAsyncData(async () => {
    try {
      return await playerApi.getMyRewards();
    } catch {
      return null;
    }
  }, []);

  const { data: betsData, loading: betsLoading } = useAsyncData(async () => {
    try {
      return await playerApi.getMyLicenseBets({ page: 1, limit: 20 });
    } catch {
      return null;
    }
  }, []);

  const rewardRows = (() => {
    if (!rewardsData) return [];
    const rows = [];
    for (const bounty of rewardsData.bountyRewards?.pendingList || []) {
      rows.push({
        id: `bounty_${bounty.bountyId}`,
        type: 'BOUNTY REWARD',
        title: bounty.zoneName || bounty.bountyId,
        detail: `+${Number(bounty.reputation || 0).toLocaleString()} REP`,
        coins: bounty.coins,
        status: 'UNCLAIMED',
      });
    }
    for (const kit of rewardsData.kits || []) {
      rows.push({
        id: `kit_${kit.kitName}`,
        type: 'VIP / DAILY KIT',
        title: `KIT: ${String(kit.kitName).toUpperCase()}`,
        detail: kit.canClaim
          ? lang === 'vi'
            ? 'Sẵn sàng nhận trong game'
            : 'Ready to claim in-game'
          : `${Math.ceil(Number(kit.remainingMs || 0) / 60000)}m cooldown`,
        coins: null,
        status: kit.canClaim ? 'AVAILABLE' : 'COOLDOWN',
      });
    }
    return rows;
  })();

  const betsList = Array.isArray(betsData?.items) ? betsData.items : [];

  const rewardColumns = [
    {
      key: 'title',
      header: lang === 'vi' ? 'PHẦN THƯỞNG' : 'REWARD',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="text-[10px] font-bold text-ink-secondary">{row.type}</div>
          <div className="font-bold text-ink-primary">{row.title}</div>
          <div className="text-[11px] text-ink-secondary">{row.detail}</div>
        </div>
      ),
    },
    {
      key: 'coins',
      header: lang === 'vi' ? 'TIỀN THƯỞNG' : 'COINS',
      align: 'right',
      render: (row) =>
        row.coins ? (
          <CurrencyDisplay currency={row.coins} compact />
        ) : (
          <span className="font-mono text-xs text-ink-secondary">—</span>
        ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => (
        <StatusTag
          label={row.status}
          variant={
            row.status === 'UNCLAIMED' || row.status === 'AVAILABLE' ? 'emerald' : 'neutral'
          }
        />
      ),
    },
  ];

  const betColumns = [
    {
      key: 'item',
      header: lang === 'vi' ? 'KÈO GIẤY PHÉP' : 'LICENSE POOL',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">{row.itemDisplayName || row.itemId}</div>
          <div className="text-[11px] text-ink-secondary">
            {lang === 'vi' ? 'Đặt vào: ' : 'Pick: '}
            <strong className="text-ink-primary">{row.candidateUsername}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: lang === 'vi' ? 'TIỀN CƯỢC' : 'STAKE',
      align: 'right',
      render: (row) => <CurrencyDisplay currency={row.formattedAmount || row.amount} compact />,
    },
    {
      key: 'payout',
      header: lang === 'vi' ? 'THƯỞNG NHẬN' : 'PAYOUT',
      align: 'right',
      render: (row) =>
        row.payoutAmount > 0 ? (
          <CurrencyDisplay currency={row.formattedPayoutAmount || row.payoutAmount} compact />
        ) : (
          <span className="font-mono text-xs text-ink-secondary">—</span>
        ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'KẾT QUẢ' : 'RESULT',
      align: 'right',
      render: (row) => {
        const st = String(row.status || '').toUpperCase();
        const variant =
          st === 'WON'
            ? 'emerald'
            : st === 'LOST' || st === 'FAILED'
            ? 'crimson'
            : st === 'REFUNDED'
            ? 'amber'
            : 'neutral';
        return (
          <div className="space-y-1 font-mono text-xs">
            <div>
              <StatusTag label={st} variant={variant} />
            </div>
            <div className="text-[10px] text-ink-secondary">
              {formatDateTime(row.settledAt || row.createdAt, lang)}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs">
          <span className="font-bold uppercase text-ink-primary">
            [REWARDS // {lang === 'vi' ? 'HÒM THƯỞNG & ĐIỂM DANH' : 'REWARDS & CHECK-IN'}]
          </span>
          {rewardsData?.monthlyCheckIn && (
            <span className="text-[11px] font-bold text-accent-emerald tabular-nums">
              CHECK-IN: {rewardsData.monthlyCheckIn.currentProgress}/
              {rewardsData.monthlyCheckIn.maxDays}
            </span>
          )}
        </div>
        <DataTable
          columns={rewardColumns}
          rows={rewardRows}
          rowKey="id"
          loading={rewardsLoading}
        />
      </div>

      <div className="space-y-3 lg:col-span-7">
        <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
          [LICENSE BETS // {lang === 'vi' ? 'LỊCH SỬ CƯỢC GIẤY PHÉP' : 'MY LICENSE BETS'}]
        </div>
        <DataTable
          columns={betColumns}
          rows={betsList}
          rowKey={(row, idx) => row.betId || idx}
          loading={betsLoading}
        />
      </div>
    </div>
  );
}