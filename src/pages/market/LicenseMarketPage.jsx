import { Link } from 'react-router-dom';
import { marketApi } from '../../api/services/market.api';
import { useQueryParams } from '../../hooks/useQueryParams';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDateTime } from '../../utils/date.util';
import FilterToolbar from '../../components/ui/FilterToolbar';
import DataTable from '../../components/ui/DataTable';
import PaginationBar from '../../components/ui/PaginationBar';
import StatusTag from '../../components/ui/StatusTag';
import PlayerBadge from '../../components/rpg/PlayerBadge';

export default function LicenseMarketPage() {
  const { lang } = useLanguage();
  const { params, updateParams, resetParams } = useQueryParams({
    q: '',
    status: 'all',
    page: '1',
    limit: '20',
  });

  const { data, loading, error } = useAsyncData(
    () =>
      marketApi.getLicenses({
        q: params.q || undefined,
        status: params.status || 'all',
        page: params.page || 1,
        limit: params.limit || 20,
      }),
    [params.q, params.status, params.page, params.limit]
  );

  const items = data?.items || [];
  const summary = data?.summary || { totalPools: 0, activePoolsCount: 0 };
  const pagination = data?.pagination || { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    {
      key: 'itemId',
      header: lang === 'vi' ? 'VẬT PHẨM // MÃ GIẤY PHÉP' : 'ITEM // LICENSE ID',
      render: (row) => (
        <div className="space-y-1 font-mono text-xs">
          <div className="font-sans text-sm font-bold text-ink-primary">
            {row.displayName || row.itemId}
          </div>
          <div className="text-[11px] text-ink-secondary">{row.itemId}</div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {row.raceStatus?.isHotRace && (
              <StatusTag label="HOT RACE" variant="amber" />
            )}
            {row.raceStatus?.isBettingOpen ? (
              <StatusTag
                label={lang === 'vi' ? 'MỞ CƯỢC' : 'BETTING OPEN'}
                variant="emerald"
              />
            ) : row.raceStatus?.activeRacersCount > 0 ? (
              <StatusTag
                label={lang === 'vi' ? 'KHÓA CƯỢC >=80%' : 'LOCKED >=80%'}
                variant="crimson"
              />
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'winnersAndRacers',
      header:
        lang === 'vi'
          ? 'NGƯỜI ĐÃ NHẬN & TOP ĐANG GÓP VỐN'
          : 'RECENT WINNERS & TOP INVESTORS',
      render: (row) => {
        const winners = Array.isArray(row.recentWinners) ? row.recentWinners : [];
        const investors = Array.isArray(row.topInvestors) ? row.topInvestors : [];

        return (
          <div className="space-y-2 text-xs">
            {/* Lịch sử người đã hoàn thành nhận giấy phép */}
            {winners.length > 0 && (
              <div className="space-y-1 border-b border-border-subtle pb-1.5">
                <div className="font-mono text-[10px] font-bold uppercase text-accent-emerald">
                  {lang === 'vi' ? 'ĐÃ NHẬN GIẤY PHÉP:' : 'ISSUED LICENSES:'}
                </div>
                {winners.map((w, idx) => (
                  <div
                    key={`${w.winnerName}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]"
                  >
                    <PlayerBadge player={{ username: w.winnerName }} />
                    <span className="text-ink-secondary tabular-nums">
                      {w.completedTarget.toLocaleString()} &rarr;{' '}
                      <strong className="text-accent-amber">
                        {w.nextTarget.toLocaleString()}
                      </strong>
                      {w.completedAt ? ` (${formatDateTime(w.completedAt, lang)})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Top người đang đua ở vòng hiện tại */}
            {investors.length > 0 ? (
              <div className="space-y-1">
                <div className="font-mono text-[10px] font-bold uppercase text-ink-secondary">
                  {lang === 'vi'
                    ? `ĐANG ĐUA VÒNG HIỆN TẠI (${row.contributorsCount || investors.length}):`
                    : `CURRENT ROUND RACERS (${row.contributorsCount || investors.length}):`}
                </div>
                {investors.slice(0, 3).map((inv, idx) => (
                  <div
                    key={`${inv.username}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tabular-nums"
                  >
                    <div className="flex items-center gap-1.5">
                      <PlayerBadge player={{ username: inv.username }} />
                      {inv.completedCount > 0 && (
                        <StatusTag
                          label={
                            lang === 'vi'
                              ? `ĐÃ NHẬN x${inv.completedCount}`
                              : `WON x${inv.completedCount}`
                          }
                          variant="emerald"
                        />
                      )}
                    </div>
                    <span className="font-semibold text-ink-primary">
                      {inv.currentAmount.toLocaleString()}/{inv.targetAmount.toLocaleString()} (
                      {inv.progressPercent}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              winners.length === 0 && (
                <span className="font-mono text-xs text-ink-secondary">
                  {lang === 'vi' ? 'CHƯA CÓ NGƯỜI GÓP VỐN' : 'NO CONTRIBUTORS YET'}
                </span>
              )
            )}
          </div>
        );
      },
    },
    {
      key: 'difficultyTarget',
      header: lang === 'vi' ? 'MỐC YÊU CẦU HIỆN TẠI' : 'CURRENT TARGET & POOL',
      align: 'right',
      render: (row) => {
        const target = Number(row.currentTargetAmount || 0);
        const deposited = Number(row.totalActiveDeposited || 0);
        const leaderPct = Number(row.raceStatus?.leaderProgressPercent || 0);

        return (
          <div className="space-y-1.5 font-mono text-xs tabular-nums">
            <div>
              <span className="text-[11px] text-ink-secondary">
                {lang === 'vi' ? 'MỐC ĐỘ KHÓ: ' : 'TARGET: '}
              </span>
              <strong className="text-sm font-bold text-ink-primary">
                {target.toLocaleString()}
              </strong>
            </div>

            <div className="text-[11px] text-ink-secondary">
              {lang === 'vi' ? 'TỔNG ĐÃ GÓP: ' : 'TOTAL POOLED: '}
              <span className="font-semibold text-accent-emerald">
                {deposited.toLocaleString()}
              </span>
            </div>

            {/* Thanh tiến độ người dẫn đầu */}
            <div className="ml-auto w-32 border border-border-strong bg-canvas p-0.5">
              <div
                style={{ width: `${Math.min(100, Math.max(0, leaderPct))}%` }}
                className={`h-1.5 ${
                  leaderPct >= 80 ? 'bg-accent-crimson' : 'bg-accent-emerald'
                }`}
              />
            </div>
            <div className="text-[10px] text-ink-secondary">
              {lang === 'vi' ? `DẪN ĐẦU: ${leaderPct}%` : `LEADER: ${leaderPct}%`}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
            [MARKET // SCALING TRADE LICENSES]
          </div>
          <h1 className="mt-0.5 text-lg font-bold text-ink-primary">
            {lang === 'vi'
              ? 'DANH MỤC GIẤY PHÉP GIAO DỊCH (TĂNG ĐỘ KHÓ THEO LƯỢT)'
              : 'TRADE LICENSES (PROGRESSIVE SCALING)'}
          </h1>
          <div className="mt-1 font-mono text-xs text-ink-secondary tabular-nums">
            {lang === 'vi'
              ? `TỔNG GIẤY PHÉP: ${summary.totalPools} // ĐANG CÓ NGƯỜI ĐUA: ${summary.activePoolsCount}`
              : `TOTAL LICENSES: ${summary.totalPools} // ACTIVE POOLS: ${summary.activePoolsCount}`}
          </div>
        </div>

        <Link
          to="/market"
          className="border border-border-strong bg-canvas px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary hover:bg-subheader"
        >
          &lt; {lang === 'vi' ? 'QUAY LẠI CHỢ ĐẤU GIÁ' : 'BACK TO AUCTIONS'}
        </Link>
      </div>

      <FilterToolbar
        searchValue={params.q}
        onSearchChange={(q) => updateParams({ q })}
        searchPlaceholder={
          lang === 'vi' ? 'Tìm tên vật phẩm, mã giấy phép...' : 'Search item name, license ID...'
        }
        filters={[
          {
            key: 'status',
            label: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
            value: params.status,
            onChange: (status) => updateParams({ status }),
            options: [
              { value: 'all', label: lang === 'vi' ? 'TẤT CẢ' : 'ALL' },
              { value: 'active', label: lang === 'vi' ? 'ĐANG CÓ NGƯỜI GÓP' : 'ACTIVE POOLS' },
              { value: 'empty', label: lang === 'vi' ? 'CHƯA AI GÓP' : 'EMPTY POOLS' },
            ],
          },
        ]}
        onReset={resetParams}
      />

      {error && (
        <div className="border border-accent-crimson bg-surface px-4 py-3 font-mono text-xs text-accent-crimson">
          [ERROR // {error.message}]
        </div>
      )}

      <div>
        <DataTable columns={columns} rows={items} rowKey="id" loading={loading} />
        <PaginationBar
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.totalItems ?? pagination.total ?? 0}
          onPageChange={(nextPage) => updateParams({ page: nextPage }, { resetPage: false })}
        />
      </div>
    </div>
  );
}