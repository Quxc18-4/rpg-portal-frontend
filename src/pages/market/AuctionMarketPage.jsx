import { useState } from 'react';
import { Link } from 'react-router-dom';
import { marketApi } from '../../api/services/market.api';
import { useQueryParams } from '../../hooks/useQueryParams';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDateTime, formatRelativeDuration } from '../../utils/date.util';
import FilterToolbar from '../../components/ui/FilterToolbar';
import DataTable from '../../components/ui/DataTable';
import PaginationBar from '../../components/ui/PaginationBar';
import StatusTag from '../../components/ui/StatusTag';
import ItemSlotCell from '../../components/rpg/ItemSlotCell';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../components/rpg/PlayerBadge';

export default function AuctionMarketPage() {
  const { isAuthenticated } = useAuth();
  const { lang } = useLanguage();
  const [selectedAuction, setSelectedAuction] = useState(null);

  const { params, updateParams, resetParams } = useQueryParams({
    mode: 'active',
    q: '',
    sortBy: 'newest',
    status: '',
    mine: '',
    page: '1',
    limit: '20',
  });

  const isHistory = params.mode === 'history';

  const { data, loading, error } = useAsyncData(
    () => {
      const query = {
        q: params.q || undefined,
        page: params.page || 1,
        limit: params.limit || 20,
      };

      if (isHistory) {
        if (params.status) query.status = params.status;
        if (isAuthenticated && params.mine === 'true') {
          query.mine = 'true';
          query.role = 'all';
        }
        return marketApi.getAuctionHistory(query);
      }

      query.sortBy = params.sortBy || 'newest';
      if (isAuthenticated && params.mine === 'true') {
        query.mine = 'true';
      }
      return marketApi.getActiveAuctions(query);
    },
    [
      isHistory,
      params.q,
      params.sortBy,
      params.status,
      params.mine,
      params.page,
      params.limit,
      isAuthenticated,
    ]
  );

  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const columns = [
    {
      key: 'item',
      header: lang === 'vi' ? 'VẬT PHẨM' : 'ITEM',
      render: (row) => (
        <div className="flex items-center gap-3">
          <ItemSlotCell item={row.item} size="sm" onClick={() => setSelectedAuction(row)} />
          <div>
            <div className="font-semibold text-ink-primary">
              {row.item?.displayName || row.item?.type || 'Unknown'}
            </div>
            <div className="font-mono text-[11px] text-ink-secondary">
              {row.item?.type} {row.item?.amount > 1 ? `// x${row.item.amount}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'seller',
      header: lang === 'vi' ? 'NGƯỜI BÁN' : 'SELLER',
      render: (row) => <PlayerBadge player={row.seller} />,
    },
    ...(isHistory
      ? [
          {
            key: 'buyer',
            header: lang === 'vi' ? 'NGƯỜI MUA' : 'BUYER',
            render: (row) =>
              row.buyer ? (
                <PlayerBadge player={row.buyer} />
              ) : (
                <span className="font-mono text-xs text-ink-secondary">—</span>
              ),
          },
        ]
      : []),
    {
      key: 'price',
      header: lang === 'vi' ? 'GIÁ NIÊM YẾT' : 'PRICE',
      align: 'right',
      render: (row) => <CurrencyDisplay currency={row.price} compact />,
    },
    {
      key: 'time',
      header: isHistory
        ? lang === 'vi'
          ? 'TRẠNG THÁI // THỜI ĐIỂM'
          : 'STATUS // TIME'
        : lang === 'vi'
        ? 'HẠN THUẾ / HẾT HẠN'
        : 'TAX / EXPIRY',
      align: 'right',
      render: (row) => {
        if (isHistory) {
          const isSold = String(row.status).toUpperCase() === 'SOLD';
          return (
            <div className="space-y-1 font-mono text-xs">
              <div>
                <StatusTag
                  label={row.status || 'DONE'}
                  variant={isSold ? 'emerald' : 'amber'}
                />
              </div>
              <div className="text-[11px] text-ink-secondary">
                {formatDateTime(row.soldAt || row.listedAt, lang)}
              </div>
            </div>
          );
        }

        const targetDate = row.nextTaxAt || row.expiresAt;
        return (
          <div className="font-mono text-xs tabular-nums">
            <div className="font-semibold text-accent-amber">
              {formatRelativeDuration(targetDate, lang)}
            </div>
            <div className="text-[11px] text-ink-secondary">
              {formatDateTime(targetDate, lang)}
            </div>
          </div>
        );
      },
    },
  ];

  const filters = isHistory
    ? [
        {
          key: 'status',
          label: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
          value: params.status,
          onChange: (val) => updateParams({ status: val }),
          options: [
            { value: '', label: lang === 'vi' ? 'TẤT CẢ' : 'ALL' },
            { value: 'SOLD', label: 'SOLD' },
            { value: 'EXPIRED', label: 'EXPIRED' },
          ],
        },
      ]
    : [
        {
          key: 'sortBy',
          label: lang === 'vi' ? 'SẮP XẾP' : 'SORT',
          value: params.sortBy,
          onChange: (val) => updateParams({ sortBy: val }),
          options: [
            { value: 'newest', label: lang === 'vi' ? 'MỚI NHẤT' : 'NEWEST' },
            { value: 'price_asc', label: lang === 'vi' ? 'GIÁ THẤP > CAO' : 'PRICE ASC' },
            { value: 'price_desc', label: lang === 'vi' ? 'GIÁ CAO > THẤP' : 'PRICE DESC' },
            { value: 'next_tax', label: lang === 'vi' ? 'SẮP ĐẾN HẠN THUẾ' : 'NEXT TAX' },
          ],
        },
      ];

  if (isAuthenticated) {
    filters.push({
      key: 'mine',
      label: lang === 'vi' ? 'PHẠM VI' : 'SCOPE',
      value: params.mine,
      onChange: (val) => updateParams({ mine: val }),
      options: [
        { value: '', label: lang === 'vi' ? 'TOÀN SERVER' : 'SERVER-WIDE' },
        { value: 'true', label: lang === 'vi' ? 'CỦA TÔI' : 'MINE ONLY' },
      ],
    });
  }

  return (
    <div className="space-y-4">
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
            [MARKET // AUCTION LEDGER]
          </div>
          <h1 className="mt-0.5 text-lg font-bold text-ink-primary">
            {lang === 'vi' ? 'SÀN ĐẤU GIÁ VẬT PHẨM' : 'ITEM AUCTION HOUSE'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => updateParams({ mode: 'active', status: '' })}
            className={`border border-border-strong px-3 py-1.5 font-semibold ${
              !isHistory
                ? 'bg-ink-primary text-white'
                : 'bg-canvas text-ink-primary hover:bg-subheader'
            }`}
          >
            {lang === 'vi' ? 'ĐANG BÀY BÁN' : 'ACTIVE LISTINGS'}
          </button>

          <button
            type="button"
            onClick={() => updateParams({ mode: 'history', sortBy: '' })}
            className={`border border-border-strong px-3 py-1.5 font-semibold ${
              isHistory
                ? 'bg-ink-primary text-white'
                : 'bg-canvas text-ink-primary hover:bg-subheader'
            }`}
          >
            {lang === 'vi' ? 'LỊCH SỬ ĐẤU GIÁ' : 'AUCTION HISTORY'}
          </button>

          <Link
            to="/market/licenses"
            className="border border-border-strong bg-subheader px-3 py-1.5 font-semibold text-accent-emerald hover:bg-canvas"
          >
            {lang === 'vi' ? 'GIẤY PHÉP KINH DOANH >' : 'TRADE LICENSES >'}
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterToolbar
        searchValue={params.q}
        onSearchChange={(q) => updateParams({ q })}
        searchPlaceholder={
          lang === 'vi' ? 'Tìm tên vật phẩm, lore, người bán...' : 'Search item, lore, seller...'
        }
        filters={filters}
        onReset={resetParams}
      />

      {error && (
        <div className="border border-accent-crimson bg-surface px-4 py-3 font-mono text-xs text-accent-crimson">
          [ERROR // {error.message}]
        </div>
      )}

      {/* Main Ledger Table */}
      <div>
        <DataTable
          columns={columns}
          rows={items}
          rowKey="id"
          loading={loading}
          onRowClick={(row) => setSelectedAuction(row)}
        />
        <PaginationBar
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={(nextPage) => updateParams({ page: nextPage }, { resetPage: false })}
        />
      </div>

      {/* Selected Item Lore Drawer */}
      {selectedAuction && (
        <div className="border-2 border-border-strong bg-surface p-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
            <span className="font-mono text-xs font-bold uppercase text-ink-primary">
              [INSPECT // {selectedAuction.id}]
            </span>
            <button
              type="button"
              onClick={() => setSelectedAuction(null)}
              className="font-mono text-xs font-bold text-ink-secondary hover:text-ink-primary"
            >
              [X]
            </button>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-mono text-ink-secondary">ITEM: </span>
                <span className="font-bold">
                  {selectedAuction.item?.displayName || selectedAuction.item?.type}
                </span>
              </div>
              <div>
                <span className="font-mono text-ink-secondary">PRICE: </span>
                <CurrencyDisplay currency={selectedAuction.price} />
              </div>
              <div>
                <span className="font-mono text-ink-secondary">SELLER: </span>
                <PlayerBadge player={selectedAuction.seller} />
              </div>
              {selectedAuction.buyer && (
                <div>
                  <span className="font-mono text-ink-secondary">BUYER: </span>
                  <PlayerBadge player={selectedAuction.buyer} />
                </div>
              )}
            </div>

            <div className="border-2 border-mc-tooltip-border bg-mc-tooltip-bg p-3 font-mono text-xs text-white">
              <div className="font-bold text-[#55FFFF]">
                {selectedAuction.item?.displayName || selectedAuction.item?.type}
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-[#AAAAAA]">
                {(selectedAuction.item?.lore || []).map((line, idx) => (
                  <div key={idx}>{line || '\u00A0'}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}