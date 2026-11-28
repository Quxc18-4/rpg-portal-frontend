import { useState } from 'react';
import { Link } from 'react-router-dom';
import { operatorApi } from '../../api/services/operator.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/date.util';
import PlayerBadge from '../../components/rpg/PlayerBadge';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import OperatorOverviewKpi from './components/OperatorOverviewKpi';

export default function OperatorOverviewPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [roleUsername, setRoleUsername] = useState('');
  const [targetRole, setTargetRole] = useState('MODERATOR');
  const [roleMsg, setRoleMsg] = useState(null);
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const [policyDraft, setPolicyDraft] = useState(null);
  const [policyMsg, setPolicyMsg] = useState(null);
  const [policySaving, setPolicySaving] = useState(false);

  const {
    data: overview,
    loading: overviewLoading,
    reload: reloadOverview,
  } = useAsyncData(() => operatorApi.getOverview(), []);

  const {
    data: logsData,
    loading: logsLoading,
    reload: reloadLogs,
  } = useAsyncData(() => operatorApi.getLogs({ page: 1, limit: 25 }), []);

  const {
    data: staffData,
    loading: staffLoading,
    reload: reloadStaff,
  } = useAsyncData(() => operatorApi.getStaffList(), [], { immediate: isAdmin });

  const {
    data: policyData,
    loading: policyLoading,
    reload: reloadPolicy,
  } = useAsyncData(() => operatorApi.getModeratorPolicy(), [], { immediate: isAdmin });

  const effectivePolicyJson =
    policyDraft !== null
      ? policyDraft
      : policyData
      ? JSON.stringify(policyData, null, 2)
      : '';

  const logsList = Array.isArray(logsData?.items)
    ? logsData.items
    : Array.isArray(logsData?.logs)
    ? logsData.logs
    : Array.isArray(logsData)
    ? logsData
    : [];

  const staffList = Array.isArray(staffData?.staff)
    ? staffData.staff
    : Array.isArray(staffData)
    ? staffData
    : [];

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!roleUsername.trim()) return;
    setRoleSubmitting(true);
    setRoleMsg(null);
    try {
      await operatorApi.updatePlayerRole(roleUsername.trim(), { role: targetRole });
      setRoleMsg({
        ok: true,
        text:
          lang === 'vi'
            ? `Đã cập nhật quyền [${targetRole}] cho ${roleUsername.trim()}.`
            : `Updated ${roleUsername.trim()} role to [${targetRole}].`,
      });
      setRoleUsername('');
      reloadStaff();
    } catch (err) {
      setRoleMsg({ ok: false, text: err?.message || 'ROLE_UPDATE_FAILED' });
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setPolicySaving(true);
    setPolicyMsg(null);
    try {
      const parsed = JSON.parse(effectivePolicyJson);
      await operatorApi.updateModeratorPolicy(parsed);
      await reloadPolicy();
      setPolicyDraft(null);
      setPolicyMsg({
        ok: true,
        text:
          lang === 'vi'
            ? 'Đã lưu cấu hình quyền hạn Moderator.'
            : 'Saved Moderator policy configuration.',
      });
    } catch (err) {
      setPolicyMsg({ ok: false, text: err?.message || 'INVALID_JSON_OR_SAVE_FAILED' });
    } finally {
      setPolicySaving(false);
    }
  };

  const logColumns = [
    {
      key: 'actor',
      header: lang === 'vi' ? 'NHÂN SỰ // THỜI GIAN' : 'OPERATOR // TIME',
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
              Target:{' '}
              <Link
                to={`/operator/inspect?username=${encodeURIComponent(row.targetUsername)}`}
                className="font-bold text-accent-emerald underline"
              >
                {row.targetUsername}
              </Link>
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

  const staffColumns = [
    {
      key: 'member',
      header: lang === 'vi' ? 'NHÂN SỰ QUẢN TRỊ' : 'STAFF MEMBER',
      render: (row) => <PlayerBadge player={row} showUuid />,
    },
    {
      key: 'role',
      header: lang === 'vi' ? 'CẤP QUYỀN' : 'ROLE',
      align: 'right',
      render: (row) => (
        <StatusTag
          label={row.role || 'MODERATOR'}
          variant={row.role === 'ADMIN' ? 'crimson' : 'amber'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Quick Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-crimson">
            [OPERATOR OVERVIEW // COMMAND &amp; AUDIT CENTER]
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-ink-secondary">
            <span>
              {lang === 'vi' ? 'NHÂN SỰ:' : 'STAFF:'}{' '}
              <strong className="text-ink-primary">{user?.username || 'STAFF'}</strong>
            </span>
            <StatusTag
              label={user?.role || 'MODERATOR'}
              variant={isAdmin ? 'crimson' : 'amber'}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <Link
            to="/operator/economy"
            className="border border-border-strong bg-canvas px-3 py-1.5 font-bold text-ink-primary hover:bg-subheader"
          >
            [{lang === 'vi' ? 'KINH TẾ & RMT >' : 'ECONOMY AUDIT >'}]
          </Link>
          <Link
            to="/operator/inspect"
            className="border border-border-strong bg-canvas px-3 py-1.5 font-bold text-ink-primary hover:bg-subheader"
          >
            [{lang === 'vi' ? 'SOI 360° & LỆNH >' : 'PLAYER 360 >'}]
          </Link>
          <button
            type="button"
            onClick={() => {
              reloadOverview();
              reloadLogs();
            }}
            className="border border-border-strong bg-ink-primary px-3 py-1.5 font-bold text-white hover:bg-accent-emerald"
          >
            [{lang === 'vi' ? 'ĐỒNG BỘ' : 'SYNC'}]
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <OperatorOverviewKpi overview={overview} loading={overviewLoading} lang={lang} />

      {/* Audit Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs">
          <span className="font-bold uppercase text-ink-primary">
            [SYSTEM AUDIT LOGS // {lang === 'vi' ? 'NHẬT KÝ THAO TÁC QUẢN TRỊ' : 'STAFF LOGS'}]
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

      {/* Admin Only: Staff Management & Moderator Policy */}
      {isAdmin && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <form
              onSubmit={handleRoleUpdate}
              className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs"
            >
              <div className="border-b border-border-subtle pb-2 font-bold uppercase text-ink-primary">
                [ADMIN // {lang === 'vi' ? 'BỔ NHIỆM / THU HỒI QUYỀN STAFF' : 'ASSIGN STAFF ROLE'}]
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  value={roleUsername}
                  onChange={(e) => setRoleUsername(e.target.value)}
                  placeholder="Username..."
                  className="border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary sm:col-span-2"
                />
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-bold text-ink-primary"
                >
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER (REVOKE)</option>
                </select>
              </div>
              {roleMsg && (
                <div
                  className={`border p-2 text-[11px] font-bold ${
                    roleMsg.ok
                      ? 'border-accent-emerald bg-canvas text-accent-emerald'
                      : 'border-accent-crimson bg-canvas text-accent-crimson'
                  }`}
                >
                  [{roleMsg.text}]
                </div>
              )}
              <button
                type="submit"
                disabled={roleSubmitting || !roleUsername.trim()}
                className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald disabled:opacity-40"
              >
                {roleSubmitting ? '[UPDATING...]' : '[UPDATE ROLE]'}
              </button>
            </form>

            <DataTable
              columns={staffColumns}
              rows={staffList}
              rowKey={(row) => row.uuid || row.username}
              loading={staffLoading}
            />
          </div>

          <div className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs lg:col-span-6">
            <div className="border-b border-border-subtle pb-2 font-bold uppercase text-ink-primary">
              [ADMIN // {lang === 'vi' ? 'CHÍNH SÁCH GIỚI HẠN MODERATOR' : 'MODERATOR POLICY'}]
            </div>
            {policyLoading ? (
              <div className="p-6 text-center text-ink-secondary">[LOADING POLICY...]</div>
            ) : (
              <form onSubmit={handleSavePolicy} className="space-y-3">
                <textarea
                  rows={12}
                  value={effectivePolicyJson}
                  onChange={(e) => setPolicyDraft(e.target.value)}
                  className="w-full border border-border-strong bg-canvas p-3 font-mono text-xs text-ink-primary"
                />
                {policyMsg && (
                  <div
                    className={`border p-2 text-[11px] font-bold ${
                      policyMsg.ok
                        ? 'border-accent-emerald bg-canvas text-accent-emerald'
                        : 'border-accent-crimson bg-canvas text-accent-crimson'
                    }`}
                  >
                    [{policyMsg.text}]
                  </div>
                )}
                <button
                  type="submit"
                  disabled={policySaving}
                  className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald disabled:opacity-40"
                >
                  {policySaving ? '[SAVING...]' : '[SAVE POLICY]'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}