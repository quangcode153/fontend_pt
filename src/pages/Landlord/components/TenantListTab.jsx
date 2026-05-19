/**
 * TenantListTab.jsx — Danh sách khách thuê theo phòng
 * Chủ trọ dùng để liên hệ nhanh với khách thuê đang ở
 */
import { useTranslation } from 'react-i18next';

const CONTRACT_STATUS = { APPROVED: 'DA_DUYET' };

export default function TenantListTab({ hopDongs, onSetChatTarget, unreadSenderIds = [] }) {
  const { t } = useTranslation();

  const tenants = hopDongs
    .filter(hd => hd.trangThai === CONTRACT_STATUS.APPROVED)
    .map(hd => ({
      hopDongId: hd.id,
      phongTen: hd.phongTro?.tenPhong || '—',
      hoTen: hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username || t('landlord.not_updated'),
      sdt: hd.khachHang?.khachHang?.soDienThoai || '',
      userId: hd.khachHang?.id,
      ngayBatDau: hd.ngayBatDau,
    }));

  return (
    <div className="l-card" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="l-section-title">💬 {t('landlord.contact_tenant_title')}</div>

      {tenants.length === 0 ? (
        <div className="l-empty">
          <div className="l-empty__icon">🏘️</div>
          <div className="l-empty__text">{t('landlord.no_tenants')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tenants.map((tenant, i) => {
            const initials = tenant.hoTen.charAt(0).toUpperCase();
            const isUnread = unreadSenderIds.some(id => String(id) === String(tenant.userId));
            return (
              <div
                key={tenant.hopDongId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px',
                  background: 'var(--bg)', border: isUnread ? '1px solid var(--danger)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                  transition: 'border-color 0.2s',
                  boxShadow: isUnread ? '0 0 12px rgba(239, 68, 68, 0.12)' : 'none',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '16px',
                }}>
                  {initials}
                </div>

                {/* Thông tin */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {tenant.hoTen}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>🏠 {tenant.phongTen}</span>
                    {tenant.sdt && <span>📞 {tenant.sdt}</span>}
                    {tenant.ngayBatDau && <span>📅 {t('landlord.since')} {tenant.ngayBatDau}</span>}
                  </div>
                </div>

                {/* Nút chat */}
                <button
                  className="l-btn l-btn--primary"
                  style={{ 
                    fontSize: '12px', 
                    padding: '7px 14px', 
                    flexShrink: 0,
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => onSetChatTarget({ id: tenant.userId, username: tenant.hoTen })}
                >
                  <style>{`
                    @keyframes pulseDot {
                      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                      70% { transform: scale(1.1); box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
                      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                    }
                  `}</style>
                  💬 {t('landlord.btn_message')}
                  {isUnread && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--danger)',
                      borderRadius: '50%',
                      display: 'inline-block',
                      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3)',
                      animation: 'pulseDot 1.2s infinite'
                    }} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
