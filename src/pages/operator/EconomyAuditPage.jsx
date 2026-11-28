import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { operatorApi } from '../../api/services/operator.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDateTime } from '../../utils/date.util';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import ItemSlotCell from '../../components/rpg/ItemSlotCell';
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
  const [selectedScanMatch, setSelectedScanMatch] = useState(null);

  // Auction detail modal state
  const [selectedAuction, setSelectedAuction] = useState(null);

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

  // Backend scanItemServerWide trả về { keyword, matchedPlayersCount, matches }
  const scanMatches = Array.isArray(scanData?.matches) ? scanData.matches : [];

  const auctionsList = Array.isArray(auctionsData?.items) ? auctionsData.items : [];
  const licensesList = Array.isArray(licensesData?.items)
    ? licensesData.items
    : Array.isArray(licensesData?.licenses)
    ? licensesData.licenses
    : [];

  const scanColumns = [
    {
      key: 'holder',
      header: lang === 'vi' ? 'NGƯỜI CHƠI SỞ HỮU' : 'ITEM HOLDER',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <PlayerBadge player={{ username: row.username, uuid: row.uuid }} showUuid />
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
      ),
    },
    {
      key: 'locations',
      header: lang === 'vi' ? 'VỊ TRÍ LƯU TRỮ KHỚP' : 'MATCHED LOCATIONS',
      render: (row) => {
        const items = Array.isArray(row.items) ? row.items : [];
        const sources = [...new Set(items.map((it) => it.source || it.containerType || 'INVENTORY'))];
        return (
          <div className="space-y-1 font-mono text-xs">
            <div className="font-bold text-ink-primary">
              {items[0]?.displayName || items[0]?.type || scanQuery} ({row.totalMatched}{' '}
              {lang === 'vi' ? 'ô/vị trí' : 'slots'})
            </div>
            <div className="flex flex-wrap gap-1">
              {sources.map((src) => (
                <StatusTag key={src} label={src} variant="neutral" />
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: lang === 'vi' ? 'TỔNG SỐ LƯỢNG // CHI TIẾT' : 'TOTAL QTY // DETAIL',
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end gap-1.5 font-mono text-xs">
          <span className="font-bold text-accent-emerald tabular-nums">
            x{Number(row.totalQuantity ?? 0).toLocaleString()}
          </span>
          <button
            type="button"
            onClick={() => setSelectedScanMatch(row)}
            className="border border-border-strong bg-canvas px-2 py-0.5 text-[10px] font-bold text-ink-primary hover:bg-ink-primary hover:text-white"
          >
            [{lang === 'vi' ? 'XEM VẬT PHẨM' : 'INSPECT ITEMS'}]
          </button>
        </div>
      ),
    },
  ];

  const auctionColumns = [
    {
      key: 'item',
      header: lang === 'vi' ? 'VẬT PHẨM ĐẤU GIÁ' : 'AUCTION ITEM',
      render: (row) => (
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <ItemSlotCell item={row.item} size="sm" onClick={() => setSelectedAuction(row)} />
          <div>
            <div className="font-bold text-ink-primary">
              {row.item?.displayName || row.item?.type || 'ITEM'} x{row.item?.amount ?? 1}
            </div>
            <div className="text-[11px] text-ink-secondary">
              Seller: <strong>{row.seller?.username || 'Unknown'}</strong>
            </div>
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
      header: lang === 'vi' ? 'TRẠNG THÁI // CHI TIẾT' : 'STATUS // INSPECT',
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end gap-1 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <StatusTag
              label={row.status || 'ACTIVE'}
              variant={row.status === 'ACTIVE' ? 'emerald' : 'neutral'}
            />
            <button
              type="button"
              onClick={() => setSelectedAuction(row)}
              className="border border-border-strong bg-canvas px-1.5 py-0.5 text-[10px] font-bold hover:bg-ink-primary hover:text-white"
            >
              [CHI TIẾT]
            </button>
          </div>
          <div className="text-[10px] text-ink-secondary">
            {formatDateTime(row.listedAt || row.expiresAt, lang)}
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
            <strong>{row.currentHolder?.username || row.ownerUsername || 'NONE'}</strong>
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

          {scanData && !scanLoading && (
            <div className="border border-border-strong bg-surface px-4 py-2 font-mono text-xs text-ink-secondary">
              [RESULT]: {lang === 'vi' ? 'Tìm thấy' : 'Matched'}{' '}
              <strong className="text-ink-primary">{scanData.matchedPlayersCount ?? 0}</strong>{' '}
              {lang === 'vi' ? 'người chơi đang giữ' : 'players holding'} &quot;
              <strong className="text-ink-primary">{scanData.keyword}</strong>&quot;.
            </div>
          )}

          <DataTable
            columns={scanColumns}
            rows={scanMatches}
            rowKey={(row) => row.uuid || row.username}
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
              rowKey={(row, idx) => row.id || idx}
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

      {/* Modal Chi tiết Scan Vật phẩm của 1 Người chơi */}
      {selectedScanMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedScanMatch(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-border-strong bg-surface p-5 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-strong pb-3">
              <div>
                <div className="font-bold uppercase text-accent-emerald">
                  [SCAN HOLDER DETAIL // {selectedScanMatch.username}]
                </div>
                <div className="text-[11px] text-ink-secondary">
                  Total Quantity: <strong>x{selectedScanMatch.totalQuantity}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScanMatch(null)}
                className="border border-border-strong bg-canvas px-2.5 py-1 font-bold hover:bg-subheader"
              >
                [X]
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {(selectedScanMatch.items || []).map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 border border-border-subtle bg-canvas p-3"
                >
                  <ItemSlotCell item={it} size="md" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-ink-primary">
                        {it.displayName || it.type} x{it.amount ?? 1}
                      </span>
                      <StatusTag
                        label={
                          it.mountName
                            ? `${it.mountName} (${it.source})`
                            : `${it.source || 'INVENTORY'}${
                                it.slot !== undefined ? ` #${it.slot}` : ''
                              }`
                        }
                        variant="emerald"
                      />
                    </div>
                    {Array.isArray(it.lore) && it.lore.length > 0 && (
                      <div className="border border-mc-tooltip-border bg-mc-tooltip-bg p-2 text-[11px] text-[#AAAAAA]">
                        {it.lore.map((line, lIdx) => (
                          <div key={lIdx}>{line || '\u00A0'}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Phiên Đấu Giá */}
      {selectedAuction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedAuction(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto border-2 border-border-strong bg-surface p-5 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-strong pb-3">
              <div className="font-bold uppercase text-ink-primary">
                [AUCTION LISTING // #{selectedAuction.id}]
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuction(null)}
                className="border border-border-strong bg-canvas px-2.5 py-1 font-bold hover:bg-subheader"
              >
                [X]
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 border border-border-subtle bg-canvas p-3">
                <ItemSlotCell item={selectedAuction.item} size="lg" />
                <div className="space-y-1">
                  <div className="font-bold text-ink-primary">
                    {selectedAuction.item?.displayName || selectedAuction.item?.type} x
                    {selectedAuction.item?.amount ?? 1}
                  </div>
                  <div className="text-[11px] text-ink-secondary">
                    Seller: <strong>{selectedAuction.seller?.username || 'Unknown'}</strong>
                  </div>
                  <div>
                    <CurrencyDisplay currency={selectedAuction.price || 0} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border border-border-subtle bg-canvas p-3 text-[11px]">
                <div>
                  <span className="text-ink-secondary">LISTED AT:</span>
                  <div className="font-bold">{formatDateTime(selectedAuction.listedAt, lang)}</div>
                </div>
                <div>
                  <span className="text-ink-secondary">EXPIRES AT:</span>
                  <div className="font-bold">{formatDateTime(selectedAuction.expiresAt, lang)}</div>
                </div>
              </div>

              {Array.isArray(selectedAuction.item?.lore) &&
                selectedAuction.item.lore.length > 0 && (
                  <div className="border-2 border-mc-tooltip-border bg-mc-tooltip-bg p-3 text-[11px] text-[#AAAAAA]">
                    {selectedAuction.item.lore.map((line, i) => (
                      <div key={i}>{line || '\u00A0'}</div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}