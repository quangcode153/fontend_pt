/**
 * DashboardTab.jsx — Tab Báo cáo & Thống kê
 * Component con của LandlordPage
 * Nhận dữ liệu thongKeData từ parent qua props
 */
import { useTranslation } from 'react-i18next';
import dashboardBanner from '../../../assets/dashboard_banner.png';

export default function DashboardTab({ thongKeData, isAdmin = false }) {
  const { t, i18n } = useTranslation();

  const S = {
    th: { padding: '10px', border: '1px solid #ddd', textAlign: 'left', color: '#666', fontWeight: 600 },
    td: { padding: '10px', border: '1px solid #ddd', color: '#333' }
  };
  
  const handlePrintReport = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Tạo nội dung CSV chuyên nghiệp hơn
    let csv = "\uFEFF"; // BOM support Vietnamese
    
    // Tiêu đề báo cáo
    const title = isAdmin ? t('admin.app_name') : t('landlord.tab_report').toUpperCase();
    csv += `${title}\n`;
    csv += `${t('landlord.recently')}: ${new Date().toLocaleDateString('vi-VN')}\n\n`;

    // Phần 1: Thống kê tổng quan
    csv += `--- ${t('landlord.overview_this_month').toUpperCase()} ---\n`;
    csv += `${t('landlord.total_rooms')},${thongKeData.tongSoPhong}\n`;
    csv += `${t('landlord.rented')},${thongKeData.soPhongDaThue}\n`;
    csv += `${t('landlord.occupancy_rate')},${Math.round((thongKeData.soPhongDaThue/thongKeData.tongSoPhong)*100)}%\n\n`;

    // Phần 2: Chi tiết doanh thu các tháng
    csv += `--- ${t('landlord.revenue_chart').toUpperCase()} ---\n`;
    csv += `${t('landlord.month')},${t('landlord.revenue_this_month')},${t('landlord.status')}\n`;
    
    thongKeData.bieuDoDoanhThu?.forEach(d => {
      csv += `${getFullMonth(d.thang)}/${d.nam},${d.doanhThu},${t('landlord.status_paid')}\n`;
    });
    csv += "\n";

    // Phần 3: Tài chính
    csv += `--- ${t('landlord.debt').toUpperCase()} ---\n`;
    csv += `${t('landlord.revenue_this_month')},${thongKeData.tongDoanhThuThangNay},${t('landlord.currency')}\n`;
    csv += `${t('landlord.debt')},${thongKeData.tongTienChuaThanhToan},${t('landlord.currency')}\n`;
    csv += `${t('landlord.unpaid_invoices_count', { count: thongKeData.soHoaDonChuaThanhToan })}\n`;

    // Tải file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_cao_SmartTro_${new Date().getTime()}.csv`;
    link.click();
  };

  const getShortMonth = (month) => {
    if (i18n.language === 'en') {
      const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      return enMonths[month - 1] || month;
    }
    return i18n.language === 'vi' ? `T${month}` : `M${month}`;
  };

  const getFullMonth = (month) => {
    if (i18n.language === 'en') {
      const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return enMonths[month - 1] || month;
    }
    return i18n.language === 'vi' ? `Tháng ${month}` : `Month ${month}`;
  };

  if (!thongKeData) {
    return (
      <div className="l-empty" style={{ padding: '60px 0' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
        <div className="l-empty__text">{t('landlord.no_stats_data') || 'Chưa có dữ liệu thống kê.'}</div>
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
    <div style={{ animation: 'fadeIn 0.3s ease' }} id="report-printable">
      <div style={{ textAlign: 'right', marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }} className="no-print">
        <button 
          onClick={handleExportExcel}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #107C41',
            background: '#fff', color: '#107C41', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px'
          }}>
          Excel 📊
        </button>
        <button 
          onClick={handlePrintReport}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none',
            background: 'var(--accent)', color: '#fff', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px'
          }}>
          🖨️ {t('landlord.btn_print')}
        </button>
      </div>

      {/* === Hero Banner === */}
      <div 
        className="hero-banner-print"
        style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        marginBottom: '24px',
        position: 'relative',
        height: '180px',
        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 60%, #818CF8 100%)',
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
            {isAdmin ? t('admin.app_name') : t('landlord.hello_landlord')}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
            {isAdmin 
              ? `Hệ thống có ${thongKeData.tongSoPhong || 0} phòng · ${thongKeData.soPhongDaThue || 0} đang thuê`
              : t('landlord.manage_rooms_summary', { total: thongKeData.tongSoPhong || 0, rented: thongKeData.soPhongDaThue || 0 })}
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
            <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>{t('landlord.currency')}</span>
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
            <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '4px' }}>{t('landlord.currency')}</span>
          </div>
          <div className="l-stat-card__sub">
            {t('landlord.unpaid_invoices_count', { count: thongKeData.soHoaDonChuaThanhToan || 0 })}
          </div>
        </div>
      </div>

      {/* Container song song cho biểu đồ và bảng */}
      <div className="dashboard-grid-charts" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px' }}>
        <style>{`
          @media (min-width: 1024px) {
            .dashboard-grid-charts {
              grid-template-columns: 3fr 2fr !important;
            }
          }
        `}</style>

        {/* === Biểu đồ doanh thu === */}
        <div className="l-chart-card" style={{ height: '100%', marginBottom: 0 }}>
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
                    title={`${getFullMonth(d.thang)}: ${d.doanhThu?.toLocaleString()} ${t('landlord.currency')}`}
                  />
                  <div className="l-chart-col__label-bot">{getShortMonth(d.thang)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* === Bảng dữ liệu chi tiết (Dạng Sheet để in) === */}
        <div className="l-report-sheet" style={{ height: '100%', marginBottom: 0 }}>
          <div className="l-chart-card__title">📄 {t('landlord.tab_report')} {t('landlord.recently').toLowerCase()}</div>
          <table style={{
            width: '100%', borderCollapse: 'collapse', marginTop: '10px',
            fontSize: '13px', border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={S.th}>{t('landlord.month')}</th>
                <th style={S.th}>{t('landlord.revenue_this_month')}</th>
                <th style={S.th}>{t('landlord.status')}</th>
              </tr>
            </thead>
            <tbody>
              {thongKeData.bieuDoDoanhThu?.map((d, i) => (
                <tr key={i}>
                  <td style={S.td}>{getFullMonth(d.thang)} / {d.nam}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{d.doanhThu?.toLocaleString()} {t('landlord.currency')}</td>
                  <td style={S.td}>{t('landlord.status_paid')}</td>
                </tr>
              ))}
              <tr style={{ background: '#fff9f9' }}>
                <td style={{ ...S.td, fontWeight: 'bold' }}>{t('landlord.debt')}</td>
                <td style={{ ...S.td, fontWeight: 'bold', color: 'var(--danger)' }}>
                  {thongKeData.tongTienChuaThanhToan?.toLocaleString()} {t('landlord.currency')}
                </td>
                <td style={S.td}>{t('landlord.status_unpaid')} ({thongKeData.soHoaDonChuaThanhToan})</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 15mm; }
          body * { visibility: hidden; }
          #report-printable, #report-printable * { visibility: visible; }
          #report-printable {
            position: absolute; left: 0; top: 0; width: 100%;
            background: #fff !important; color: #000 !important;
            box-shadow: none !important; padding: 0 !important;
          }
          .no-print, .hero-banner-print { display: none !important; }
          .l-stats-grid { display: flex !important; gap: 10px !important; margin-bottom: 20px !important; }
          .l-stat-card { border: 1px solid #ccc !important; background: #fff !important; flex: 1 !important; padding: 15px !important; }
          .l-stat-card__value { color: #000 !important; }
          .l-chart-card, .l-report-sheet { border: 1px solid #ccc !important; padding: 15px !important; margin-top: 20px !important; page-break-inside: avoid; }
          .l-chart-bars { height: 150px !important; }
          .l-chart-col__bar { border: 1px solid #333 !important; background: #eee !important; }
          .l-chart-col__bar--current { background: #333 !important; }
          table { border: 1px solid #000 !important; }
          th, td { border: 1px solid #000 !important; padding: 8px !important; }
        }
      `}</style>
    </div>
  );
}
