import { useState } from 'react';
import { operatorApi } from '../../api/services/operator.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import StatusTag from '../../components/ui/StatusTag';
import OperatorOverviewKpi from './components/OperatorOverviewKpi';
import OperatorTransactionsTab from './components/OperatorTransactionsTab';
import OperatorPlayerInspectTab from './components/OperatorPlayerInspectTab';
import OperatorItemScanLogsTab from './components/OperatorItemScanLogsTab';
import OperatorAdminPolicyTab from './components/OperatorAdminPolicyTab';

export default function OperatorAuditPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('TRANSACTIONS');
  const [inspectTarget, setInspectTarget] = useState('');

  const {
    data: overview,
    loading: overviewLoading,
    reload: reloadOverview,
  } = useAsyncData(() => operatorApi.getOverview(), []);

  const handleInspectJump = (username) => {
    setInspectTarget(username);
    setActiveTab('INSPECT');
  };

  const tabs = [
    {
      id: 'TRANSACTIONS',
      label: lang === 'vi' ? 'SOÁT XÉT GIAO DỊCH & RMT' : 'TRANSACTION AUDIT',
    },
    {
      id: 'INSPECT',
      label: lang === 'vi' ? 'SOI 360° & LỆNH SERVER' : 'PLAYER 360 & COMMANDS',
    },
    {
      id: 'SCAN_LOGS',
      label: lang === 'vi' ? 'QUÉT VẬT PHẨM & LOGS' : 'ITEM SCAN & LOGS',
    },
    ...(isAdmin
      ? [
          {
            id: 'ADMIN_POLICY',
            label: lang === 'vi' ? 'NHÂN SỰ & POLICY [ADMIN]' : 'STAFF & POLICY [ADMIN]',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-crimson">
            [OPERATOR CONSOLE // SERVER ECONOMY &amp; AUDIT LEDGER]
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-ink-secondary">
            <span>
              {lang === 'vi' ? 'PHIÊN LÀM VIỆC:' : 'OPERATOR SESSION:'}{' '}
              <strong className="text-ink-primary">{user?.username || 'STAFF'}</strong>
            </span>
            <StatusTag
              label={user?.role || 'MODERATOR'}
              variant={isAdmin ? 'crimson' : 'amber'}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => reloadOverview()}
          className="border border-border-strong bg-canvas px-3 py-1.5 font-mono text-xs font-bold text-ink-primary hover:bg-subheader"
        >
          [{lang === 'vi' ? 'CẬP NHẬT CHỈ SỐ' : 'SYNC METRICS'}]
        </button>
      </div>

      {/* Economy & Server KPI Strip */}
      <OperatorOverviewKpi overview={overview} loading={overviewLoading} lang={lang} />

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border border-border-strong bg-subheader p-2 font-mono text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border border-border-strong px-3 py-1.5 font-bold ${
              activeTab === tab.id
                ? 'bg-ink-primary text-white'
                : 'bg-surface text-ink-primary hover:bg-canvas'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'TRANSACTIONS' && (
        <OperatorTransactionsTab onInspectTarget={handleInspectJump} lang={lang} />
      )}
      {activeTab === 'INSPECT' && (
        <OperatorPlayerInspectTab initialUsername={inspectTarget} lang={lang} />
      )}
      {activeTab === 'SCAN_LOGS' && (
        <OperatorItemScanLogsTab onInspectTarget={handleInspectJump} lang={lang} />
      )}
      {activeTab === 'ADMIN_POLICY' && isAdmin && <OperatorAdminPolicyTab lang={lang} />}
    </div>
  );
}