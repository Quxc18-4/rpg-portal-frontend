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
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../components/rpg/PlayerBadge';

export default function LicenseMarketPage() {
  const { lang } = useLanguage();
  const { params, updateParams, resetParams } = useQueryParams({
    q: '',
    status: '',
    page: '1',
    limit: '20',
  });

  const { data, loading, error } = useAsyncData(
    () =>
      marketApi.getLicenses({
        q: params.q || undefined,
        status: params.status || undefined,
        page: params.page || 1,
        limit: params.limit || 20,
      }),
    [params.q, params.status, params.page, params.limit]
  );

  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const columns = [
    {
      key: 'itemId',
      header: lang === 'vi' ? 'MÃ VẬT PHẨM / GIẤY PHÉP' : 'ITEM / LICENSE ID',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">
            {row.displayName || row.itemName || row.itemId || row.id}
          </div>
          {row.itemId && (
            <div className="text-[11px] text-ink-secondary">{row.itemId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'holder',
      header: lang === 'vi' ? 'CHỦ SỞ HỮU ĐỘC QUYỀN' : 'CURRENT HOLDER',
      render: (row) =>
        row.holder || row.owner ? (
          <PlayerBadge player={row.holder || row.owner} />
        ) : (
          <span className="font-mono text-xs text-ink-secondary">
            {lang === 'vi' ? 'CHƯA CÓ CHỦ' : 'UNCLAIMED'}
          </span>
        ),
    },
    {
      key: 'price',
      header: lang === 'vi' ? 'GIÁ TRỊ ĐẤU THẦU' : 'WINNING BID',
      align: 'right',
      render: (row) => (
        <CurrencyDisplay currency={row.winningBid || row.price || row.currentBid} compact />
      ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI // HIỆU LỰC' : 'STATUS // EXPIRY',
      align: 'right',
      render: (row) => (
        <div className="space-y-1 font-mono text-xs">
          <div>
            <StatusTag
              label={row.status || 'ACTIVE'}
              variant={String(row.status).toUpperCase() === 'ACTIVE' ? 'emerald' : 'amber'}
            />
          </div>
          <div className="text-[11px] text-ink-secondary">
            {formatDateTime(row.expiresAt || row.updatedAt, lang)}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
            [MARKET // MONOPOLY LICENSES]
          </div>
          <h1 className="mt-0.5 text-lg font-bold text-ink-primary">
            {lang === 'vi' ? 'GIẤY PHÉP KINH DOANH ĐỘC QUYỀN' : 'TRADE MONOPOLY LICENSES'}
          </h1>
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
          lang === 'vi' ? 'Tìm mã vật phẩm, chủ sở hữu...' : 'Search item ID, holder...'
        }
        filters={[
          {
            key: 'status',
            label: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
            value: params.status,
            onChange: (status) => updateParams({ status }),
            options: [
              { value: '', label: lang === 'vi' ? 'TẤT CẢ' : 'ALL' },
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'BIDDING', label: 'BIDDING' },
              { value: 'EXPIRED', label: 'EXPIRED' },
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
          total={pagination.total}
          onPageChange={(nextPage) => updateParams({ page: nextPage }, { resetPage: false })}
        />
      </div>
    </div>
  );
}