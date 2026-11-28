import { marketApi } from '../../api/services/market.api';
import { useQueryParams } from '../../hooks/useQueryParams';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDateTime } from '../../utils/date.util';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PaginationBar from '../../components/ui/PaginationBar';
import StatusTag from '../../components/ui/StatusTag';
import ItemSlotCell from '../../components/rpg/ItemSlotCell';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../components/rpg/PlayerBadge';

export default function TradeHistoryPage() {
  const { lang } = useLanguage();
  const { params, updateParams, resetParams } = useQueryParams({
    q: '',
    date: '',
    sortBy: 'newest',
    page: '1',
    limit: '10',
  });

  const { data, loading, error } = useAsyncData(
    () =>
      marketApi.getMyTrades({
        q: params.q || undefined,
        date: params.date || undefined,
        sortBy: params.sortBy || 'newest',
        page: params.page || 1,
        limit: params.limit || 10,
      }),
    [params.q, params.date, params.sortBy, params.page, params.limit]
  );

  const trades = data?.items || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-4">
      <div className="border border-border-strong bg-surface p-4">
        <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
          [MARKET // DIRECT TRADE LOGS]
        </div>
        <h1 className="mt-0.5 text-lg font-bold text-ink-primary">
          {lang === 'vi' ? 'NHẬT KÝ GIAO DỊCH TRỰC TIẾP' : 'DIRECT TRADE HISTORY'}
        </h1>
      </div>

      <FilterToolbar
        searchValue={params.q}
        onSearchChange={(q) => updateParams({ q })}
        searchPlaceholder={
          lang === 'vi' ? 'Tìm đối tác hoặc vật phẩm...' : 'Search partner or item...'
        }
        filters={[
          {
            key: 'sortBy',
            label: lang === 'vi' ? 'SẮP XẾP' : 'SORT',
            value: params.sortBy,
            onChange: (sortBy) => updateParams({ sortBy }),
            options: [
              { value: 'newest', label: lang === 'vi' ? 'MỚI NHẤT' : 'NEWEST' },
              { value: 'oldest', label: lang === 'vi' ? 'CŨ NHẤT' : 'OLDEST' },
            ],
          },
        ]}
        rightSlot={
          <div className="flex items-center border border-border-strong bg-canvas">
            <label
              htmlFor="trade-date-filter"
              className="border-r border-border-subtle px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-secondary"
            >
              {lang === 'vi' ? 'NGÀY' : 'DATE'}
            </label>
            <input
              id="trade-date-filter"
              type="date"
              value={params.date}
              onChange={(e) => updateParams({ date: e.target.value })}
              className="bg-canvas px-2.5 py-1.5 font-mono text-xs text-ink-primary outline-none"
            />
          </div>
        }
        onReset={resetParams}
      />

      {error && (
        <div className="border border-accent-crimson bg-surface px-4 py-3 font-mono text-xs text-accent-crimson">
          [ERROR // {error.message}]
        </div>
      )}

      {loading ? (
        <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
          [{lang === 'vi' ? 'ĐANG TẢI NHẬT KÝ GIAO DỊCH...' : 'LOADING TRADE LOGS...'}]
        </div>
      ) : trades.length === 0 ? (
        <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
          [{lang === 'vi' ? 'CHƯA CÓ LỊCH SỬ GIAO DỊCH' : 'NO TRADE RECORDS FOUND'}]
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((tr) => {
            const partner = tr.perspective?.partner || tr.side2?.player;
            const offered = tr.perspective?.offered || tr.side1;
            const received = tr.perspective?.received || tr.side2;
            const isOneSided =
              (offered?.itemCount === 0 && received?.itemCount > 0) ||
              (received?.itemCount === 0 && offered?.itemCount > 0);

            return (
              <div key={tr.id} className="border border-border-strong bg-surface">
                {/* Trade Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-strong bg-subheader px-4 py-2 font-mono text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-primary">
                      {lang === 'vi' ? 'ĐỐI TÁC:' : 'PARTNER:'}
                    </span>
                    <PlayerBadge player={partner} />
                    {isOneSided && (
                      <StatusTag
                        label={lang === 'vi' ? 'CHUYỂN 1 CHIỀU' : 'ONE-SIDED'}
                        variant="amber"
                      />
                    )}
                  </div>

                  <div className="text-[11px] text-ink-secondary tabular-nums">
                    {formatDateTime(tr.tradedAt, lang)} // ID: {tr.id}
                  </div>
                </div>

                {/* Two-column Ledger Comparison */}
                <div className="grid divide-y divide-border-subtle md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* Offered Side */}
                  <div className="p-4">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="font-mono text-xs font-bold uppercase text-accent-crimson">
                        {lang === 'vi' ? 'ĐÃ ĐƯA RA' : 'OFFERED'} ({offered?.itemCount || 0})
                      </span>
                      <CurrencyDisplay currency={offered?.currency} compact />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(offered?.items || []).length > 0 ? (
                        offered.items.map((item, idx) => (
                          <ItemSlotCell key={idx} item={item} size="md" />
                        ))
                      ) : (
                        <span className="font-mono text-xs text-ink-secondary">
                          [{lang === 'vi' ? 'KHÔNG CÓ VẬT PHẨM' : 'NO ITEMS'}]
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Received Side */}
                  <div className="p-4">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="font-mono text-xs font-bold uppercase text-accent-emerald">
                        {lang === 'vi' ? 'ĐÃ NHẬN VỀ' : 'RECEIVED'} ({received?.itemCount || 0})
                      </span>
                      <CurrencyDisplay currency={received?.currency} compact />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(received?.items || []).length > 0 ? (
                        received.items.map((item, idx) => (
                          <ItemSlotCell key={idx} item={item} size="md" />
                        ))
                      ) : (
                        <span className="font-mono text-xs text-ink-secondary">
                          [{lang === 'vi' ? 'KHÔNG CÓ VẬT PHẨM' : 'NO ITEMS'}]
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {trades.length > 0 && (
        <div className="border-t border-border-strong">
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={(nextPage) => updateParams({ page: nextPage }, { resetPage: false })}
          />
        </div>
      )}
    </div>
  );
}