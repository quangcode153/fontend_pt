/**
 * InvoiceTab.jsx — Tab Quản lý Hoá đơn
 * Component con của LandlordPage
 */
import { useTranslation } from 'react-i18next';
import emptyInvoiceImg from '../../../assets/empty_invoice.png';

export default function InvoiceTab({ hoaDons, onCapNhatSo }) {
  const { t } = useTranslation();

  return (
    <div className="l-card" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="l-section-title">🧾 {t('landlord.invoice_manage_title')}</div>

      {hoaDons.length === 0 ? (
        <div className="l-empty" style={{ padding: '48px 0' }}>
          <img src={emptyInvoiceImg} alt="No invoices" style={{ width: '160px', marginBottom: '16px', opacity: 0.8 }} />
          <div className="l-empty__text">{t('landlord.no_invoices')}</div>
        </div>
      ) : (
        <div className="l-room-grid">
          {hoaDons.map((hd, i) => {
            const daTT = hd.trangThai === 'DA_THANH_TOAN';
            return (
              <div
                key={hd.id}
                className="l-invoice-card"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  animation: 'fadeIn 0.35s ease both',
                  borderTop: `3px solid ${daTT ? 'var(--success)' : 'var(--warning)'}`,
                }}
              >
                {/* Header */}
                <div className="l-invoice-card__header">
                  <div>
                    <div className="l-invoice-card__room">
                      🏠 {hd.phongTro?.tenPhong}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {t('landlord.month')} {hd.thang}/{hd.nam}
                    </div>
                  </div>
                  <span className={`l-tag l-tag--${daTT ? 'green' : 'amber'}`}>
                    {daTT ? t('landlord.status_paid') : t('landlord.status_unpaid')}
                  </span>
                </div>

                {/* Chi tiết */}
                <div className="l-info-row">
                  <span className="l-info-row__label">{t('landlord.total_amount')}</span>
                  <span className="l-info-row__value" style={{ color: 'var(--accent)', fontSize: '15px' }}>
                    {hd.tongTien?.toLocaleString()} ₫
                  </span>
                </div>
                <div className="l-info-row" style={{ borderBottom: 'none' }}>
                  <span className="l-info-row__label">{t('landlord.tenant_label')}</span>
                  <span className="l-info-row__value" style={{ fontSize: '12px' }}>
                    {hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username || '—'}
                  </span>
                </div>

                {/* Actions */}
                <div className="l-invoice-card__actions">
                  <button className="l-btn" style={{ flex: 1, fontSize: '12px' }}>
                    🖨️ {t('landlord.btn_print')}
                  </button>
                  {!daTT && (
                    <button
                      className="l-btn l-btn--danger"
                      style={{ flex: 1, fontSize: '12px' }}
                      onClick={() => onCapNhatSo(hd)}
                    >
                      ✏️ {t('landlord.btn_update_number')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
