/**
 * RoomDetailModal.jsx — Modal chi tiết phòng
 * Hiển thị thông tin phòng, thông tin khách thuê, đổi trạng thái phòng
 */
import { useTranslation } from 'react-i18next';

const ROOM_STATUS = { EMPTY: 'TRONG', RENTED: 'DA_THUE', MAINTENANCE: 'BAO_TRI' };

export default function RoomDetailModal({
  phongChiTiet,
  hoSoKhachThue,
  onClose,
  onDoiTrangThai,
  onSetChatTarget,
}) {
  const { t } = useTranslation();
  if (!phongChiTiet) return null;

  const { phong, hopDongHienTai } = phongChiTiet;

  return (
    <div className="l-modal-overlay">
      <div className="l-modal l-modal--md">
        {/* Header */}
        <div className="l-modal__header">
          <div>
            <div className="l-modal__title">🏠 {phong.tenPhong}</div>
            <div className="l-modal__subtitle">{t('landlord.manage_room')}</div>
          </div>
          <button className="l-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="l-modal__body">
          {/* Thông tin cơ bản */}
          <div className="l-room-detail-grid">
            <div className="l-room-detail-cell">
              <div className="l-room-detail-cell__label">{t('landlord.rent_price')}</div>
              <div className="l-room-detail-cell__value" style={{ color: 'var(--accent)' }}>
                {phong.giaPhong?.toLocaleString()} ₫
              </div>
            </div>
            <div className="l-room-detail-cell">
              <div className="l-room-detail-cell__label">{t('landlord.status')}</div>
              <select
                className="l-form-input"
                value={phong.trangThai}
                onChange={e => onDoiTrangThai(phong.id, e.target.value)}
                style={{ padding: '6px 10px', fontSize: '13px' }}
              >
                <option value={ROOM_STATUS.EMPTY}>{t('landlord.status_empty')}</option>
                <option value={ROOM_STATUS.RENTED}>{t('landlord.status_rented')}</option>
                <option value={ROOM_STATUS.MAINTENANCE}>{t('landlord.status_maintenance')}</option>
              </select>
            </div>
          </div>

          {/* Thông tin khách thuê */}
          {hopDongHienTai ? (
            <div className="l-tenant-info">
              <div className="l-tenant-info__header">
                <div className="l-tenant-info__profile">
                  <div className="l-tenant-info__avatar">
                    {(hoSoKhachThue?.hoTen || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="l-tenant-info__name">
                      {hoSoKhachThue?.hoTen || t('landlord.loading')}
                    </div>
                    <div className="l-tenant-info__role">{t('landlord.current_tenant')}</div>
                  </div>
                </div>
                <button
                  className="l-btn l-btn--primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                  onClick={() => {
                    onSetChatTarget({
                      id: hopDongHienTai.khachHang.id,
                      username: hoSoKhachThue?.hoTen || t('landlord.guest'),
                    });
                    onClose();
                  }}
                >
                  💬 {t('landlord.btn_chat')}
                </button>
              </div>

              {/* Thông tin cá nhân */}
              {[
                ['CCCD', hoSoKhachThue?.soCccd],
                [t('landlord.phone'), hoSoKhachThue?.soDienThoai],
                ['Email', hoSoKhachThue?.email],
                [t('landlord.address'), hoSoKhachThue?.diaChiThuongTru],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className="l-info-row"
                  style={{ borderBottom: i < 3 ? undefined : 'none' }}
                >
                  <span className="l-info-row__label">{label}</span>
                  <span className="l-info-row__value" style={{ maxWidth: '60%', textAlign: 'right', fontSize: '13px' }}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="l-empty" style={{ padding: '32px' }}>
              <div className="l-empty__icon">😴</div>
              <div className="l-empty__text">{t('landlord.room_is_empty')}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="l-modal__footer">
          <button className="l-btn l-btn--full" onClick={onClose}>
            {t('landlord.btn_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
