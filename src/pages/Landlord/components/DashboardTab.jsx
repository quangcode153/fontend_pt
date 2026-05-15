/**
 * DashboardTab.jsx — Tab Báo cáo & Thống kê
 * Component con của LandlordPage
 * Nhận dữ liệu thongKeData từ parent qua props
 */
import { useTranslation } from 'react-i18next';
import dashboardBanner from '../../../assets/dashboard_banner.png';

export default function DashboardTab({ thongKeData }) {
  const { t, i18n } = useTranslation();

  const getShortMonth = (month) => {
    if (i18n.language === 'en') {
      const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      return enMonths[month - 1] || month;
    }
    return `T${month}`;
  };

  const getFullMonth = (month) => {
    if (i18n.language === 'en') {
      const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return enMonths[month - 1] || month;
    }
    return `Tháng ${month}`;
  };

  if (!thongKeData) {
    return (
      <div className="l-empty" style={{ padding: '60px 0' }}>
        <img src={emptyInvoiceImg} alt="No data" style={{ width: '180px', marginBottom: '20px', opacity: 0.7 }} />
        <div className="l-empty__text">{t('landlord.no_stats_data')}</div>
      </div>
    );
  }

  const occupancyRate = thongKeData.tongSoPhong > 0
    ? Math.round((thongKeData.soPhongDaThue / thongKeData.tongSoPhong) * 100)
    : 0;

  const maxDT = Math.max(
    ...(thongKeData.bieuDoDoanhThu?.map(d => d.doanhThu) || [1]),
    1
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* === Hero Banner === */}
      <div style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        marginBottom: '24px',
        position: 'relative',
        height: '180px',
        background: 'linear-gradient(135deg, #D47A95 0%, #E09BAE 60%, #ECAFC0 100%)',
        display: 'flex',
        alignItems: 'center',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Ảnh minh hoạ toà nhà */}
        <img
          src={dashboardBanner}
          alt="Dashboard Banner"
          style={{
            position: 'absolute', right: 0, top: 0,
            height: '100%', width: '55%',
            objectFit: 'cover',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.8) 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.8) 60%, transparent 100%)',
          }}
        />
        {/* Text overlay bên trái */}
        <div style={{ padding: '28px 32px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('landlord.overview_this_month')}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            {t('landlord.hello_landlord')}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
            {t('landlord.manage_rooms_summary', { total: thongKeData.tongSoPhong || 0, rented: thongKeData.soPhongDaThue || 0 })}
          </div>
        </div>
      </div>

      {/* === 3 Stat Cards === */}
      <div className="l-stats-grid">
        {/* Doanh thu tháng này */}
        <div className="l-stat-card l-stat-card--revenue">
          <span className="l-stat-card__icon">💰</span>
          <div className="l-stat-card__label">{t('landlord.revenue_this_month')}</div>
          <div className="l-stat-card__value">
            {(thongKeData.tongDoanhThuThangNay || 0).toLocaleString()}
            <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>₫</span>
          </div>
          <div className={`l-stat-card__trend l-stat-card__trend--${thongKeData.tyLeTangTruong >= 0 ? 'up' : 'down'}`}>
            {thongKeData.tyLeTangTruong >= 0 ? '↗' : '↘'}
            {Math.abs(thongKeData.tyLeTangTruong || 0)}% {t('landlord.compared_last_month')}
          </div>
        </div>

        {/* Tỷ lệ lấp đầy */}
        <div className="l-stat-card l-stat-card--occupancy">
          <span className="l-stat-card__icon">🏠</span>
          <div className="l-stat-card__label">{t('landlord.occupancy_rate')}</div>
          <div className="l-stat-card__value">{occupancyRate}%</div>
          <div className="l-stat-card__sub">
            {thongKeData.soPhongDaThue} {t('landlord.rented')} / {thongKeData.tongSoPhong} {t('landlord.total_rooms')}
          </div>
        </div>

        {/* Tiền nợ */}
        <div className="l-stat-card l-stat-card--debt">
          <span className="l-stat-card__icon">⚠️</span>
          <div className="l-stat-card__label">{t('landlord.debt')}</div>
          <div className="l-stat-card__value" style={{ color: 'var(--warning)' }}>
            {(thongKeData.tongTienChuaThanhToan || 0).toLocaleString()}
            <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>₫</span>
          </div>
          <div className="l-stat-card__sub">
            {t('landlord.unpaid_invoices_count', { count: thongKeData.soHoaDonChuaThanhToan || 0 })}
          </div>
        </div>
      </div>

      {/* === Biểu đồ doanh thu === */}
      <div className="l-chart-card">
        <div className="l-chart-card__title">📈 {t('landlord.revenue_chart')}</div>
        <div className="l-chart-bars">
          {thongKeData.bieuDoDoanhThu?.map((d, i) => {
            const height = maxDT > 0 ? (d.doanhThu / maxDT) * 100 : 0;
            const isCurrent = i === (thongKeData.bieuDoDoanhThu.length - 1);
            return (
              <div key={i} className="l-chart-col">
                <div className="l-chart-col__label-top">
                  {d.doanhThu > 0 ? `${Math.round(d.doanhThu / 1000)}k` : ''}
                </div>
                <div
                  className={`l-chart-col__bar ${isCurrent ? 'l-chart-col__bar--current' : 'l-chart-col__bar--past'}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${getFullMonth(d.thang)}: ${d.doanhThu?.toLocaleString()}₫`}
                />
                <div className="l-chart-col__label-bot">{getShortMonth(d.thang)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
