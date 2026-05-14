/**
 * RoomTab.jsx — Tab Quản lý Phòng Trọ
 * Component con của LandlordPage
 */
import { useTranslation } from 'react-i18next';
import emptyRoomsImg from '../../../assets/empty_rooms.png';
import roomPlaceholderImg from '../../../assets/room_placeholder.png';

const ROOM_STATUS = { EMPTY: 'TRONG', RENTED: 'DA_THUE', MAINTENANCE: 'BAO_TRI' };
const CONTRACT_STATUS = { APPROVED: 'DA_DU_YET', PENDING: 'CHO_DUYET' };

export default function RoomTab({
  phongTros,
  hopDongs,
  tenPhong, setTenPhong,
  giaPhong, setGiaPhong,
  trangThai, setTrangThai,
  isSubmitting,
  onThemPhong,
  onXoaPhong,
  onXemChiTiet,
}) {
  const { t } = useTranslation();

  const tagColor = (tt) => {
    if (tt === ROOM_STATUS.EMPTY) return 'green';
    if (tt === ROOM_STATUS.RENTED) return 'red';
    return 'amber';
  };

  const tagLabel = (tt) => {
    if (tt === ROOM_STATUS.EMPTY) return 'Trống';
    if (tt === ROOM_STATUS.RENTED) return 'Đã thuê';
    return 'Bảo trì';
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* === Form thêm phòng mới === */}
      <div className="l-card" style={{ marginBottom: '20px' }}>
        <div className="l-section-title">➕ Thêm phòng mới</div>
        <form onSubmit={onThemPhong} className="l-add-room-form">
          <div className="l-add-room-form__field" style={{ flex: 2 }}>
            <label className="l-form-label">Tên phòng</label>
            <input
              className="l-form-input"
              type="text"
              value={tenPhong}
              onChange={e => setTenPhong(e.target.value)}
              placeholder="VD: Phòng 101"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="l-add-room-form__field" style={{ flex: 1 }}>
            <label className="l-form-label">Giá (VNĐ)</label>
            <input
              className="l-form-input"
              type="number"
              value={giaPhong}
              onChange={e => setGiaPhong(e.target.value)}
              placeholder="VD: 3500000"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="l-add-room-form__field" style={{ flex: 1 }}>
            <label className="l-form-label">Trạng thái</label>
            <select
              className="l-form-input"
              value={trangThai}
              onChange={e => setTrangThai(e.target.value)}
              disabled={isSubmitting}
            >
              <option value={ROOM_STATUS.EMPTY}>Trống</option>
              <option value={ROOM_STATUS.RENTED}>Đã thuê</option>
              <option value={ROOM_STATUS.MAINTENANCE}>Bảo trì</option>
            </select>
          </div>
          <button
            type="submit"
            className="l-btn l-btn--primary"
            disabled={isSubmitting}
            style={{ whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
          >
            {isSubmitting ? 'Đang lưu...' : '💾 Lưu phòng'}
          </button>
        </form>
      </div>

      {/* === Danh sách phòng === */}
      {phongTros.length === 0 ? (
        <div className="l-empty" style={{ padding: '48px 0' }}>
          <img src={emptyRoomsImg} alt="No rooms" style={{ width: '160px', marginBottom: '16px', opacity: 0.8 }} />
          <div className="l-empty__text">Chưa có phòng nào được tạo.</div>
        </div>
      ) : (
        <div className="l-room-grid">
          {phongTros.map((phong, i) => {
            // Tìm hợp đồng đã duyệt của phòng này để lấy tên khách
            const hopDongHienTai = hopDongs.find(
              hd => hd.phongTro?.id === phong.id && (hd.trangThai === 'DA_DUYET' || hd.trangThai === 'DA_DU_YET')
            );

            return (
              <div
                key={phong.id}
                className={`l-room-card l-room-card--${tagColor(phong.trangThai)}`}
                style={{ animationDelay: `${i * 0.04}s`, animation: 'fadeIn 0.35s ease both' }}
              >
                {/* Ảnh placeholder cho phòng */}
                <div style={{ height: '120px', overflow: 'hidden', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', margin: '-20px -20px 16px -20px', position: 'relative' }}>
                  <img src={roomPlaceholderImg} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className={`l-tag l-tag--${tagColor(phong.trangThai)}`}>
                      {tagLabel(phong.trangThai)}
                    </span>
                  </div>
                </div>

                {/* Nút xoá */}
                <button
                  className="l-room-card__delete-btn"
                  onClick={() => onXoaPhong(phong.id, phong.tenPhong)}
                  title="Xoá phòng"
                >
                  ✕
                </button>

                <div className="l-room-card__name">{phong.tenPhong}</div>

                <div className="l-info-row">
                  <span className="l-info-row__label">Giá thuê:</span>
                  <span className="l-info-row__value" style={{ color: 'var(--accent)' }}>
                    {phong.giaPhong?.toLocaleString()} ₫
                  </span>
                </div>

                <div className="l-info-row">
                  <span className="l-info-row__label">Khách thuê:</span>
                  <span className="l-info-row__value" style={{ fontSize: '12px' }}>
                    {hopDongHienTai
                      ? (hopDongHienTai.khachHang?.hoTen || hopDongHienTai.khachHang?.username || 'Khách thuê')
                      : '—'}
                  </span>
                </div>

                <div className="l-info-row" style={{ borderBottom: 'none' }}>
                  <span className="l-info-row__label">Trạng thái:</span>
                  <span className={`l-tag l-tag--${tagColor(phong.trangThai)}`}>
                    {tagLabel(phong.trangThai)}
                  </span>
                </div>

                <button
                  className="l-btn l-btn--full"
                  style={{ marginTop: '16px' }}
                  onClick={() => onXemChiTiet(phong, hopDongHienTai)}
                >
                  Xem chi tiết
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
