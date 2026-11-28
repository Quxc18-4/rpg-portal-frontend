import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { operatorApi } from '../../api/services/operator.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDateTime } from '../../utils/date.util';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../components/rpg/PlayerBadge';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import OperatorOverviewKpi from './components/OperatorOverviewKpi';
import OperatorTransactionsTab from './components/OperatorTransactionsTab';

export default function EconomyAuditPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState('TRANSACTIONS');

  // Global Item Scan state
  const [scanInput, setScanInput] = useState('');
  const [scanQuery, setScanQuery] = useState('');

  const { data: overview, loading: overviewLoading } = useAsyncData(
    () => operatorApi.getOverview(),
    []
  );

  const { data: scanData, loading: scanLoading } = useAsyncData(
    () => operatorApi.scanItems({ q: scanQuery }),
    [scanQuery],
    { immediate: Boolean(scanQuery) }
  );

  const { data: auctionsData, loading: auctionsLoading } = useAsyncData(
    () => operatorApi.getAuctions({ page: 1, limit: 25 }),
    [],
    { immediate: subTab === 'MARKET_LICENSES' }
  );

  const { data: licensesData, loading: licensesLoading } = useAsyncData(
    () => operatorApi.getLicenses(),
    [],
    { immediate: subTab === 'MARKET_LICENSES' }
  );

  const handleJumpInspect = (username) => {
    navigate(`/operator/inspect?username=${encodeURIComponent(username)}`);
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setScanQuery(scanInput.trim());
  };

  const scanResults = Array.isArray(scanData?.results)
    ? scanData.results
    : Array.isArray(scanData?.items)
    ? scanData.items
    : Array.isArray(scanData)
    ? scanData
    : [];

  const auctionsList = Array.isArray(auctionsData?.items)
    ? auctionsData.items
    : Array.isArray(auctionsData)
    ? auctionsData
    : [];

  const licensesList = Array.isArray(licensesData?.items)
    ? licensesData.items
    : Array.isArray(licensesData?.licenses)
    ? licensesData.licenses
    : Array.isArray(licensesData)
    ? licensesData
    : [];

  const scanColumns = [
    {
      key: 'holder',
      header: lang === 'vi' ? 'NGƯỜI GIỮ / NƠI LƯU' : 'HOLDER / CONTAINER',
      render: (row) => {
        const owner = row.username || row.ownerName || row.guildName || 'UNKNOWN';
        return (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <PlayerBadge player={{ username: owner }} />
            {row.username && (
              <button
                type="button"
                onClick={() => handleJumpInspect(row.username)}
                className="border border-border-strong bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald hover:bg-subheader"
              >
                [SOI 360]
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'item',
      header: lang === 'vi' ? 'VẬT PHẨM KHỚP' : 'MATCHED ITEM',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">
            {row.item?.displayName || row.displayName || row.itemId}
          </div>
          <div className="text-[11px] text-ink-secondary">
            {row.location || row.containerType || 'INVENTORY'}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: lang === 'vi' ? 'SỐ LƯỢNG' : 'QTY',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-ink-primary tabular-nums">
          x{Number(row.amount ?? row.item?.amount ?? 1).toLocaleString()}
        </span>
      ),
    },
  ];

  const auctionColumns = [
    {
      key: 'item',
      header: lang === 'vi' ? 'VẬT PHẨM ĐẤU GIÁ' : 'AUCTION ITEM',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">
            {row.item?.displayName || row.itemName || 'ITEM'} x{row.item?.amount ?? 1}
          </div>
          <div className="text-[11px] text-ink-secondary">
            Seller: <strong>{row.sellerUsername || 'Unknown'}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: lang === 'vi' ? 'GIÁ NIÊM YẾT' : 'LISTED PRICE',
      align: 'right',
      render: (row) => <CurrencyDisplay currency={row.price || 0} compact />,
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => (
        <div className="space-y-1 font-mono text-xs">
          <StatusTag
            label={row.status || 'ACTIVE'}
            variant={row.status === 'ACTIVE' ? 'emerald' : 'neutral'}
          />
          <div className="text-[10px] text-ink-secondary">
            {formatDateTime(row.createdAt, lang)}
          </div>
        </div>
      ),
    },
  ];

  const licenseColumns = [
    {
      key: 'license',
      header: lang === 'vi' ? 'GIẤY PHÉP ĐỘC QUYỀN' : 'LICENSE POOL',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">{row.displayName || row.itemId}</div>
          <div className="text-[11px] text-ink-secondary">
            {lang === 'vi' ? 'Chủ sở hữu hiện tại: ' : 'Holder: '}
            <strong>{row.ownerUsername || 'NONE'}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'pool',
      header: lang === 'vi' ? 'TỔNG CƯỢC' : 'TOTAL POOL',
      align: 'right',
      render: (row) => <CurrencyDisplay currency={row.totalPool || 0} compact />,
    },
  ];

  const tabs = [
    {
      id: 'TRANSACTIONS',
      label: lang === 'vi' ? 'SOÁT XÉT GIAO DỊCH & RMT' : 'TRANSACTION & RMT AUDIT',
    },
    {
      id: 'ITEM_SCAN',
      label: lang === 'vi' ? 'QUÉT VẬT PHẨM TOÀN SERVER' : 'GLOBAL ITEM SCANNER',
    },
    {
      id: 'MARKET_LICENSES',
      label: lang === 'vi' ? 'CHỢ ĐẤU GIÁ & GIẤY PHÉP' : 'AUCTIONS & LICENSES',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-crimson">
            [OPERATOR ECONOMY // SERVER WEALTH &amp; AML LEDGER]
          </div>
          <div className="mt-1 font-mono text-xs text-ink-secondary">
            {lang === 'vi'
              ? 'Giám sát lưu thông tiền tệ, truy vết giao dịch bất thường và quét vật phẩm toàn máy chủ.'
              : 'Monitor currency supply, audit suspicious trades and scan server-wide item holders.'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <Link
            to="/operator"
            className="border border-border-strong bg-canvas px-3 py-1.5 font-bold text-ink-primary hover:bg-subheader"
          >
            [{'< OVERVIEW'}]
          </Link>
          <Link
            to="/operator/inspect"
            className="border border-border-strong bg-canvas px-3 py-1.5 font-bold text-ink-primary hover:bg-subheader"
          >
            [{'SOI 360° >'}]
          </Link>
        </div>
      </div>

      <OperatorOverviewKpi overview={overview} loading={overviewLoading} lang={lang} />

      <div className="flex flex-wrap items-center gap-1.5 border border-border-strong bg-subheader p-2 font-mono text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`border border-border-strong px-3 py-1.5 font-bold ${
              subTab === tab.id
                ? 'bg-ink-primary text-white'
                : 'bg-surface text-ink-primary hover:bg-canvas'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'TRANSACTIONS' && (
        <OperatorTransactionsTab onInspectTarget={handleJumpInspect} lang={lang} />
      )}

      {subTab === 'ITEM_SCAN' && (
        <div className="space-y-3">
          <form
            onSubmit={handleScanSubmit}
            className="flex flex-wrap items-center gap-2 border border-border-strong bg-surface p-4 font-mono text-xs"
          >
            <span className="font-bold uppercase text-ink-primary">
              [SCAN KEYWORD / ITEM ID]:
            </span>
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder={
                lang === 'vi'
                  ? 'Nhập tên vật phẩm hoặc rpg_item_id...'
                  : 'Item display name or rpg_item_id...'
              }
              className="min-w-[240px] flex-1 border border-border-strong bg-canvas px-3 py-1.5 text-xs text-ink-primary"
            />
            <button
              type="submit"
              className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald"
            >
              [RUN GLOBAL SCAN]
            </button>
          </form>

          <DataTable
            columns={scanColumns}
            rows={scanResults}
            rowKey={(row, idx) => row.id || idx}
            loading={scanLoading}
          />
        </div>
      )}

      {subTab === 'MARKET_LICENSES' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
              [LIVE AUCTIONS // {lang === 'vi' ? 'PHIÊN ĐẤU GIÁ TOÀN SERVER' : 'SERVER AUCTIONS'}]
            </div>
            <DataTable
              columns={auctionColumns}
              rows={auctionsList}
              rowKey={(row, idx) => row.auctionId || row._id || idx}
              loading={auctionsLoading}
            />
          </div>

          <div className="space-y-3 lg:col-span-5">
            <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
              [LICENSES // {lang === 'vi' ? 'DANH MỤC GIẤY PHÉP' : 'LICENSE POOLS'}]
            </div>
            <DataTable
              columns={licenseColumns}
              rows={licensesList}
              rowKey={(row, idx) => row.itemId || idx}
              loading={licensesLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}