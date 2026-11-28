import { useState } from 'react';
import { operatorApi } from '../../../api/services/operator.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { formatDateTime } from '../../../utils/date.util';
import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../../components/rpg/PlayerBadge';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

export default function OperatorTransactionsTab({ onInspectTarget, lang }) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [playerQuery, setPlayerQuery] = useState('');
  const [minCopper, setMinCopper] = useState('');
  const [oneSidedOnly, setOneSidedOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [appliedFilters, setAppliedFilters] = useState({
    type: 'ALL',
    player: '',
    minCopper: '',
    oneSidedOnly: false,
    from: '',
    to: '',
  });

  const { data, loading, reload } = useAsyncData(
    () => {
      const params = {
        type: appliedFilters.type,
        page,
        limit: 20,
      };
      if (appliedFilters.player.trim()) params.player = appliedFilters.player.trim();
      if (appliedFilters.minCopper !== '') params.minCopper = Number(appliedFilters.minCopper);
      if (appliedFilters.oneSidedOnly) params.oneSidedOnly = true;
      if (appliedFilters.from) params.from = appliedFilters.from;
      if (appliedFilters.to) params.to = appliedFilters.to;

      return operatorApi.auditTransactions(params);
    },
    [appliedFilters, page]
  );

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.transactions)
    ? data.transactions
    : Array.isArray(data)
    ? data
    : [];

  const pagination = data?.pagination || {
    page,
    totalPages: 1,
    total: items.length,
  };

  const handleApply = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({
      type: typeFilter,
      player: playerQuery,
      minCopper,
      oneSidedOnly,
      from: dateFrom,
      to: dateTo,
    });
  };

  const handleReset = () => {
    setTypeFilter('ALL');
    setPlayerQuery('');
    setMinCopper('');
    setOneSidedOnly(false);
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setAppliedFilters({
      type: 'ALL',
      player: '',
      minCopper: '',
      oneSidedOnly: false,
      from: '',
      to: '',
    });
  };

  const columns = [
    {
      key: 'type',
      header: lang === 'vi' ? 'LOẠI // THỜI GIAN' : 'TYPE // TIMESTAMP',
      render: (row) => {
        const txType = String(row.type || row.source || 'TRADE').toUpperCase();
        const isFlagged = Boolean(row.isOneSided || row.flagged || row.riskFlags?.length > 0);
        return (
          <div className="space-y-1 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusTag
                label={txType}
                variant={txType === 'AUCTION' ? 'emerald' : 'neutral'}
              />
              {isFlagged && (
                <StatusTag
                  label={lang === 'vi' ? 'CỜ ĐỎ // 1 CHIỀU' : 'ONE-SIDED FLAG'}
                  variant="crimson"
                />
              )}
            </div>
            <div className="text-[10px] text-ink-secondary">
              {formatDateTime(row.timestamp || row.createdAt || row.soldAt, lang)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'parties',
      header: lang === 'vi' ? 'CÁC BÊN THAM GIA' : 'PARTIES INVOLVED',
      render: (row) => {
        const p1 =
          row.sellerUsername ||
          row.side1?.username ||
          row.fromUsername ||
          row.player1 ||
          'Unknown';
        const p2 =
          row.buyerUsername ||
          row.side2?.username ||
          row.toUsername ||
          row.player2 ||
          'Unknown';

        return (
          <div className="space-y-1 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-ink-secondary">[A]</span>
              <PlayerBadge player={{ username: p1 }} />
              {onInspectTarget && p1 !== 'Unknown' && (
                <button
                  type="button"
                  onClick={() => onInspectTarget(p1)}
                  className="border border-border-strong bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald hover:bg-subheader"
                >
                  [SOI 360]
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-ink-secondary">[B]</span>
              <PlayerBadge player={{ username: p2 }} />
              {onInspectTarget && p2 !== 'Unknown' && (
                <button
                  type="button"
                  onClick={() => onInspectTarget(p2)}
                  className="border border-border-strong bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald hover:bg-subheader"
                >
                  [SOI 360]
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'assets',
      header: lang === 'vi' ? 'TÀI SẢN TRAO ĐỔI' : 'EXCHANGED ASSETS',
      render: (row) => {
        const itemLabel =
          row.item?.displayName ||
          row.itemName ||
          (Array.isArray(row.side1?.items)
            ? `${row.side1.items.length} vật phẩm <-> ${row.side2?.items?.length || 0} vật phẩm`
            : row.summary || '—');

        return (
          <div className="font-mono text-xs">
            <div className="font-semibold text-ink-primary">{itemLabel}</div>
            {row.flagReason && (
              <div className="text-[11px] font-bold text-accent-crimson">
                [{row.flagReason}]
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'value',
      header: lang === 'vi' ? 'GIÁ TRỊ TIỀN TỆ' : 'CURRENCY VALUE',
      align: 'right',
      render: (row) => {
        const val =
          row.price ??
          row.amount ??
          row.totalCopper ??
          row.side1?.currency ??
          row.side2?.currency ??
          0;
        return <CurrencyDisplay currency={val} compact />;
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <form
        onSubmit={handleApply}
        className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2">
          <span className="font-bold uppercase text-ink-primary">
            [TRANSACTION AUDIT // {lang === 'vi' ? 'BỘ LỌC SOÁT XÉT DÒNG TIỀN & RMT' : 'AML & RMT FILTER'}]
          </span>
          <button
            type="button"
            onClick={() => reload()}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-semibold hover:bg-subheader"
          >
            [{lang === 'vi' ? 'LÀM MỚI' : 'REFRESH'}]
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'NGUỒN GIAO DỊCH' : 'SOURCE TYPE'}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-semibold text-ink-primary"
            >
              <option value="ALL">ALL (AUCTION + TRADE)</option>
              <option value="AUCTION">AUCTION ONLY</option>
              <option value="TRADE">DIRECT TRADE ONLY</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'TÊN NGƯỜI CHƠI' : 'PLAYER USERNAME'}
            </label>
            <input
              type="text"
              value={playerQuery}
              onChange={(e) => setPlayerQuery(e.target.value)}
              placeholder="vd: Kuuhaku"
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'GIÁ TRỊ TỐI THIỂU (COPPER)' : 'MIN COPPER'}
            </label>
            <input
              type="number"
              min="0"
              value={minCopper}
              onChange={(e) => setMinCopper(e.target.value)}
              placeholder="4096 = 1 Vàng"
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary tabular-nums"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'TỪ NGÀY' : 'FROM DATE'}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
              {lang === 'vi' ? 'ĐẾN NGÀY' : 'TO DATE'}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-bold text-accent-crimson">
              <input
                type="checkbox"
                checked={oneSidedOnly}
                onChange={(e) => setOneSidedOnly(e.target.checked)}
              />
              <span>{lang === 'vi' ? 'CHỈ GIAO DỊCH 1 CHIỀU' : 'ONE-SIDED ONLY'}</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald"
          >
            [{lang === 'vi' ? 'TRUY VẤN DỮ LIỆU' : 'RUN AUDIT QUERY'}]
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="border border-border-strong bg-canvas px-3 py-1.5 font-semibold text-ink-primary hover:bg-subheader"
          >
            [{lang === 'vi' ? 'ĐẶT LẠI' : 'RESET'}]
          </button>
        </div>
      </form>

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row, idx) => row.id || row._id || row.tradeId || row.auctionId || idx}
        loading={loading}
      />

      {/* Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs tabular-nums">
        <span className="text-ink-secondary">
          {lang === 'vi' ? 'TỔNG BẢN GHI' : 'TOTAL RECORDS'}:{' '}
          <strong className="text-ink-primary">{pagination.total ?? items.length}</strong>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-bold disabled:opacity-40"
          >
            {'< PREV'}
          </button>
          <span className="font-bold text-ink-primary">
            PAGE {pagination.page || page} / {Math.max(1, pagination.totalPages || 1)}
          </span>
          <button
            type="button"
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-bold disabled:opacity-40"
          >
            {'NEXT >'}
          </button>
        </div>
      </div>
    </div>
  );
}