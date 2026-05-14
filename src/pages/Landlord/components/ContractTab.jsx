/**
 * ContractTab.jsx — Tab Yêu cầu thuê phòng (duyệt hợp đồng)
 * Component con của LandlordPage
 */
import { useTranslation } from 'react-i18next';
import api from '../../../api';

const CONTRACT_STATUS = { PENDING: 'CHO_DUYET', APPROVED: 'DA_DUYET', REJECTED: 'TU_CHOI' };

export default function ContractTab({
  hopDongs,
  onDuyetHopDong,
  onSetChatTarget,
  onXemHoSo,
  onRefresh,
}) {
  const { t } = useTranslation();

  const pendingList = hopDongs.filter(hd => hd.trangThai === CONTRACT_STATUS.PENDING);

  return (
    <div className="l-card" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
        <div className="l-section-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
          📋 {t('landlord.request_title')}
          {pendingList.length > 0 && (
            <span className="landlord-nav-bar__badge" style={{ marginLeft: '8px' }}>
              {pendingList.length}
            </span>
          )}
        </div>
        <button className="l-btn" onClick={onRefresh}>🔄 {t('landlord.btn_refresh')}</button>
      </div>

      {/* Danh sách yêu cầu */}
      {pendingList.length === 0 ? (
        <div className="l-empty">
          <div className="l-empty__icon">✅</div>
          <div className="l-empty__text">{t('landlord.no_requests')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingList.map((hd, i) => {
            const tenKhach = hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username || t('landlord.not_updated');
            const sdt = hd.khachHang?.khachHang?.soDienThoai || t('landlord.no_phone');
            const initials = tenKhach.charAt(0).toUpperCase();

            return (
              <div
                key={hd.id}
                className="l-request-item"
                style={{ animationDelay: `${i * 0.05}s`, animation: 'fadeIn 0.35s ease both' }}
              >
                {/* Avatar */}
                <div className="l-request-item__avatar">{initials}</div>

                {/* Thông tin khách */}
                <div className="l-request-item__info">
                  <div className="l-request-item__name">{tenKhach}</div>
                  <div className="l-request-item__phone">{sdt}</div>
                </div>

                {/* Thông tin phòng */}
                <div className="l-request-item__room">
                  <div className="l-request-item__room-name">{hd.phongTro?.tenPhong}</div>
                  <div className="l-request-item__date">{hd.ngayBatDau}</div>
                </div>

                {/* Các nút hành động */}
                <div className="l-request-item__actions">
                  <button
                    className="l-btn"
                    onClick={() => onXemHoSo(hd)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    📄 {t('landlord.btn_profile')}
                  </button>
                  <button
                    className="l-btn"
                    onClick={() => onSetChatTarget({
                      id: hd.khachHang.id,
                      username: tenKhach,
                    })}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    💬 {t('landlord.btn_chat')}
                  </button>
                  <button
                    className="l-btn l-btn--success"
                    onClick={() => onDuyetHopDong(hd.id, CONTRACT_STATUS.APPROVED)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    ✓ {t('landlord.btn_accept')}
                  </button>
                  <button
                    className="l-btn l-btn--danger"
                    onClick={() => onDuyetHopDong(hd.id, CONTRACT_STATUS.REJECTED)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    ✕ {t('landlord.btn_reject')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
