import { useState } from 'react';
import { operatorApi } from '../../../api/services/operator.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import PlayerBadge from '../../../components/rpg/PlayerBadge';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

export default function OperatorAdminPolicyTab({ lang }) {
  const [roleUsername, setRoleUsername] = useState('');
  const [targetRole, setTargetRole] = useState('MODERATOR');
  const [roleStatusMsg, setRoleStatusMsg] = useState(null);
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const [policyDraft, setPolicyDraft] = useState(null);
  const [policyMsg, setPolicyMsg] = useState(null);
  const [policySaving, setPolicySaving] = useState(false);

  const {
    data: staffData,
    loading: staffLoading,
    reload: reloadStaff,
  } = useAsyncData(() => operatorApi.getStaffList(), []);

  const {
    data: policyData,
    loading: policyLoading,
    reload: reloadPolicy,
  } = useAsyncData(() => operatorApi.getModeratorPolicy(), []);

  const effectivePolicyJson =
    policyDraft !== null
      ? policyDraft
      : policyData
      ? JSON.stringify(policyData, null, 2)
      : '';

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!roleUsername.trim()) return;
    setRoleSubmitting(true);
    setRoleStatusMsg(null);
    try {
      await operatorApi.updatePlayerRole(roleUsername.trim(), { role: targetRole });
      setRoleStatusMsg({
        ok: true,
        text:
          lang === 'vi'
            ? `Đã cập nhật quyền [${targetRole}] cho ${roleUsername.trim()}.`
            : `Updated ${roleUsername.trim()} role to [${targetRole}].`,
      });
      setRoleUsername('');
      reloadStaff();
    } catch (err) {
      setRoleStatusMsg({
        ok: false,
        text: err?.message || 'ROLE_UPDATE_FAILED',
      });
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
      setPolicyMsg({
        ok: false,
        text: err?.message || 'INVALID_JSON_OR_SAVE_FAILED',
      });
    } finally {
      setPolicySaving(false);
    }
  };

  const staffList = Array.isArray(staffData?.staff)
    ? staffData.staff
    : Array.isArray(staffData)
    ? staffData
    : [];

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
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Staff Roster & Role Assignment */}
      <div className="space-y-4 lg:col-span-6">
        <form
          onSubmit={handleRoleUpdate}
          className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs"
        >
          <div className="border-b border-border-subtle pb-2 font-bold uppercase text-ink-primary">
            [STAFF ROLE ASSIGNMENT // {lang === 'vi' ? 'BỔ NHIỆM / THU HỒI QUYỀN' : 'ASSIGN ROLE'}]
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

          {roleStatusMsg && (
            <div
              className={`border p-2 text-[11px] font-bold ${
                roleStatusMsg.ok
                  ? 'border-accent-emerald bg-canvas text-accent-emerald'
                  : 'border-accent-crimson bg-canvas text-accent-crimson'
              }`}
            >
              [{roleStatusMsg.text}]
            </div>
          )}

          <button
            type="submit"
            disabled={roleSubmitting || !roleUsername.trim()}
            className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald disabled:opacity-40"
          >
            {roleSubmitting
              ? '[UPDATING...]'
              : lang === 'vi'
              ? '[CẬP NHẬT QUYỀN]'
              : '[UPDATE ROLE]'}
          </button>
        </form>

        <DataTable
          columns={staffColumns}
          rows={staffList}
          rowKey={(row) => row.uuid || row.username}
          loading={staffLoading}
        />
      </div>

      {/* Moderator Policy Editor */}
      <div className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs lg:col-span-6">
        <div className="border-b border-border-subtle pb-2 font-bold uppercase text-ink-primary">
          [MODERATOR POLICY // {lang === 'vi' ? 'CHÍNH SÁCH GIỚI HẠN QUYỀN MOD' : 'MOD LIMITS'}]
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
              {policySaving
                ? '[SAVING...]'
                : lang === 'vi'
                ? '[LƯU CHÍNH SÁCH]'
                : '[SAVE POLICY]'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}