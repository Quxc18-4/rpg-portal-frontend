import { useState } from 'react';
import { operatorApi } from '../../../api/services/operator.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { formatDateTime } from '../../../utils/date.util';
import PlayerBadge from '../../../components/rpg/PlayerBadge';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

export default function OperatorItemScanLogsTab({ onInspectTarget, lang }) {
  const [scanKeyword, setScanKeyword] = useState('');
  const [submittedScan, setSubmittedScan] = useState('');

  const { data: scanData, loading: scanLoading } = useAsyncData(
    () => operatorApi.scanItems({ q: submittedScan }),
    [submittedScan],
    { immediate: Boolean(submittedScan) }
  );

  const {
    data: logsData,
    loading: logsLoading,
    reload: reloadLogs,
  } = useAsyncData(() => operatorApi.getLogs({ page: 1, limit: 30 }), []);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanKeyword.trim()) return;
    setSubmittedScan(scanKeyword.trim());
  };

  const scanResults = Array.isArray(scanData?.results)
    ? scanData.results
    : Array.isArray(scanData?.items)
    ? scanData.items
    : Array.isArray(scanData)
    ? scanData
    : [];

  const logsList = Array.isArray(logsData?.items)
    ? logsData.items
    : Array.isArray(logsData?.logs)
    ? logsData.logs
    : Array.isArray(logsData)
    ? logsData
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
            {onInspectTarget && row.username && (
              <button
                type="button"
                onClick={() => onInspectTarget(row.username)}
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

  const logColumns = [
    {
      key: 'actor',
      header: lang === 'vi' ? 'NGƯỜI THỰC HIỆN' : 'OPERATOR',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">
            {row.actorUsername || row.operator || 'SYSTEM'}
          </div>
          <div className="text-[10px] text-ink-secondary">
            {formatDateTime(row.createdAt || row.timestamp, lang)}
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: lang === 'vi' ? 'HÀNH ĐỘNG' : 'ACTION',
      render: (row) => (
        <div className="space-y-1 font-mono text-xs">
          <StatusTag label={row.action || row.type || 'AUDIT'} variant="amber" />
          {row.targetUsername && (
            <div className="text-[11px] text-ink-primary">
              Target: <strong>{row.targetUsername}</strong>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'reason',
      header: lang === 'vi' ? 'CHI TIẾT / LÝ DO' : 'REASON',
      render: (row) => (
        <span className="font-mono text-xs text-ink-secondary">
          {row.reason || row.detail || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Global Item Scanner */}
      <div className="space-y-3 lg:col-span-6">
        <form
          onSubmit={handleScanSubmit}
          className="space-y-2 border border-border-strong bg-surface p-4 font-mono text-xs"
        >
          <div className="font-bold uppercase text-ink-primary">
            [GLOBAL ITEM SCANNER // {lang === 'vi' ? 'TRUY VẾT VẬT PHẨM TOÀN SERVER' : 'SERVER-WIDE SCAN'}]
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={scanKeyword}
              onChange={(e) => setScanKeyword(e.target.value)}
              placeholder={
                lang === 'vi'
                  ? 'Nhập tên vật phẩm hoặc rpg_item_id...'
                  : 'Item display name or rpg_item_id...'
              }
              className="flex-1 border border-border-strong bg-canvas px-3 py-1.5 text-xs text-ink-primary"
            />
            <button
              type="submit"
              className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald"
            >
              [SCAN]
            </button>
          </div>
        </form>

        <DataTable
          columns={scanColumns}
          rows={scanResults}
          rowKey={(row, idx) => row.id || idx}
          loading={scanLoading}
        />
      </div>

      {/* Operator Audit Logs */}
      <div className="space-y-3 lg:col-span-6">
        <div className="flex items-center justify-between border border-border-strong bg-surface px-4 py-3 font-mono text-xs">
          <span className="font-bold uppercase text-ink-primary">
            [AUDIT LOGS // {lang === 'vi' ? 'NHẬT KÝ THAO TÁC QUẢN TRỊ' : 'STAFF ACTION HISTORY'}]
          </span>
          <button
            type="button"
            onClick={() => reloadLogs()}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-bold hover:bg-subheader"
          >
            [REFRESH]
          </button>
        </div>

        <DataTable
          columns={logColumns}
          rows={logsList}
          rowKey={(row, idx) => row._id || row.id || idx}
          loading={logsLoading}
        />
      </div>
    </div>
  );
}