import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import ChatBox from '../../components/ChatBox';
import QuanLyNguoiDung from '../../components/QuanLyNguoiDung';
import DashboardTab from '../Landlord/components/DashboardTab';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminPage.css';

const ROLES = { ADMIN: 'ROLE_ADMIN' };
const ROOM_STATUS = { EMPTY: 'TRONG', RENTED: 'DA_THUE', MAINTENANCE: 'BAO_TRI' };

const S = {
  navBar: {
    display: 'flex', gap: '2px', background: 'var(--border-light)',
    padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    marginBottom: '24px', width: 'fit-content',
  },
  navItem: (active) => ({
    padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, transition: 'all var(--transition)',
    background: active ? 'var(--text-primary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  }),
  card: {
    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '24px',
    animation: 'fadeIn 0.3s ease',
  },
  tag: (color) => {
    const map = {
      green: { bg: 'var(--success-light)', text: 'var(--success)' },
      red: { bg: 'var(--danger-light)', text: 'var(--danger)' },
      amber: { bg: 'var(--warning-light)', text: 'var(--warning)' },
      blue: { bg: 'var(--accent-light)', text: 'var(--accent)' },
    };
    return {
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: '999px', fontSize: '11px', fontWeight: 600,
      background: map[color]?.bg || 'var(--border-light)', color: map[color]?.text || 'var(--text-secondary)',
    };
  },
  btn: {
    padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, transition: 'all var(--transition)',
  },
  btnPrimary: {
    padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, transition: 'opacity var(--transition)',
  },
  btnSuccess: {
    padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'var(--text-primary)', color: '#fff', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, transition: 'opacity var(--transition)',
  },
  input: {
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text-primary)', fontSize: '14px', width: '100%',
    boxSizing: 'border-box', outline: 'none', transition: 'border-color var(--transition)',
  },
  avatar: (i) => {
    const colors = [
      ['var(--accent-light)', 'var(--accent)'],
      ['var(--success-light)', 'var(--success)'],
      ['var(--danger-light)', 'var(--danger)'],
      ['#F3E8FF', '#7C3AED'],
      ['var(--warning-light)', 'var(--warning)'],
    ];
    const [bg, text] = colors[i % colors.length];
    return {
      width: '38px', height: '38px', borderRadius: '50%',
      background: bg, color: text, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', fontWeight: 600,
    };
  },
};

const Spinner = ({ text }) => {
  const { t } = useTranslation();
  const loadingMsg = text || t('common.loading');
  return (
    <div style={{ textAlign: 'center', padding: '40px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{
        width: '24px', height: '24px', border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.6s linear infinite', margin: '0 auto 12px',
      }} />
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{loadingMsg}</div>
    </div>
  );
};

export default function AdminPage({ currentUser, unreadSenderIds = [], setUnreadSenderIds, onSetChatTarget }) {
  const { t } = useTranslation();
  const userRole = (currentUser?.role || '').startsWith('ROLE_') ? currentUser.role : `ROLE_${currentUser.role}`;
  if (userRole !== ROLES.ADMIN) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>{t('admin.access_denied')}</div>;
  }

  const [adminTab, setAdminTab] = useState('USERS');
  const [thongKeData, setThongKeData] = useState(null);
  const [chuTros, setChuTros] = useState([]);
  const [tuKhoa, setTuKhoa] = useState('');
  const [chuTroDangChon, setChuTroDangChon] = useState(null);
  const [phongTros, setPhongTros] = useState([]);
  const [phongDangXem, setPhongDangXem] = useState(null);
  const [hopDongs, setHopDongs] = useState([]);
  const [hoaDons, setHoaDons] = useState([]);
  const [khieuNais, setKhieuNais] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoadingInit(true);
    try {
      // Gọi hai API chính phục vụ các tab quản trị
      const [chuTroRes, khieuNaiRes] = await Promise.all([
        api.get('/tai-khoan/chu-tro'),
        api.get('/khieu-nai')
      ]);
      const listChuTro = chuTroRes.data || [];
      setChuTros(listChuTro);
      setKhieuNais(khieuNaiRes.data || []);

      // Tính toán dữ liệu thống kê hệ thống ngay tại Client-side mà không cần thay đổi Java backend
      let allRooms = [];
      let allInvoices = [];

      try {
        const detailPromises = listChuTro.map(async (ct) => {
          try {
            const [phongRes, hoaDonRes] = await Promise.all([
              api.get(`/phong-tro/chu-tro/${ct.id}`),
              api.get(`/hoa-don/chu-tro/${ct.id}`)
            ]);
            return {
              rooms: phongRes.data || [],
              invoices: hoaDonRes.data || []
            };
          } catch (e) {
            console.warn(`Không tải được chi tiết hóa đơn/phòng cho chủ trọ ${ct.id}, thử tải lại phòng:`, e);
            try {
              const phongRes = await api.get(`/phong-tro/chu-tro/${ct.id}`);
              return { rooms: phongRes.data || [], invoices: [] };
            } catch (innerE) {
              return { rooms: [], invoices: [] };
            }
          }
        });

        const results = await Promise.all(detailPromises);
        results.forEach(res => {
          allRooms = [...allRooms, ...res.rooms];
          allInvoices = [...allInvoices, ...res.invoices];
        });
      } catch (err) {
        console.error("Lỗi khi gom dữ liệu thống kê:", err);
      }

      // Xử lý tính toán thông số thống kê
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const tongSoPhong = allRooms.length;
      const soPhongDaThue = allRooms.filter(r => r.trangThai === 'DA_THUE').length;
      const soPhongTrong = allRooms.filter(r => r.trangThai === 'TRONG').length;

      const invoicesChuaThanhToan = allInvoices.filter(inv => inv.trangThai === 'CHUA_THANH_TOAN');
      const soHoaDonChuaThanhToan = invoicesChuaThanhToan.length;
      const tongTienChuaThanhToan = invoicesChuaThanhToan.reduce((sum, inv) => sum + (inv.tongTien || 0), 0);

      const tongDoanhThuThangNay = allInvoices
        .filter(inv => inv.trangThai === 'DA_THANH_TOAN' && inv.thang === currentMonth && inv.nam === currentYear)
        .reduce((sum, inv) => sum + (inv.tongTien || 0), 0);

      const tongDoanhThuThangTruoc = allInvoices
        .filter(inv => inv.trangThai === 'DA_THANH_TOAN' && inv.thang === lastMonth && inv.nam === lastMonthYear)
        .reduce((sum, inv) => sum + (inv.tongTien || 0), 0);

      let tyLeTangTruong = 0;
      if (tongDoanhThuThangTruoc === 0) {
        tyLeTangTruong = tongDoanhThuThangNay > 0 ? 100 : 0;
      } else {
        tyLeTangTruong = Math.round(((tongDoanhThuThangNay - tongDoanhThuThangTruoc) / tongDoanhThuThangTruoc) * 100 * 100) / 100;
      }

      // Tính toán dữ liệu biểu đồ doanh thu 6 tháng qua
      const bieuDoDoanhThu = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();

        const dt = allInvoices
          .filter(inv => inv.trangThai === 'DA_THANH_TOAN' && inv.thang === m && inv.nam === y)
          .reduce((sum, inv) => sum + (inv.tongTien || 0), 0);

        bieuDoDoanhThu.push({ thang: m, nam: y, doanhThu: dt });
      }

      setThongKeData({
        tongSoPhong,
        soPhongDaThue,
        soPhongTrong,
        soHoaDonChuaThanhToan,
        tongTienChuaThanhToan,
        tongDoanhThuThangNay,
        tongDoanhThuThangTruoc,
        tyLeTangTruong,
        bieuDoDoanhThu
      });

    } catch (err) {
      setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('admin.error_init'), onConfirm: null });
    } finally { setLoadingInit(false); }
  };

  const handleXuLyKhieuNai = async (id) => {
    setConfirmState({
      isOpen: true,
      type: 'success',
      title: t('common.confirm'),
      message: t('admin.confirm_resolve'),
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          await api.put(`/khieu-nai/${id}/xu-ly`);
          setKhieuNais(prev => prev.map(kn => kn.id === id ? { ...kn, trangThai: 'DA_GIAI_QUYET' } : kn));
        } catch (err) {
          setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('admin.error_general') + (err.response?.data?.message || ""), onConfirm: null });
        }
      }
    });
  };

  const handleChonChuTro = async (ct) => {
    setChuTroDangChon(ct);
    setLoadingRooms(true);
    try {
      const [phongRes, hopDongRes, hoaDonRes] = await Promise.all([
        api.get(`/phong-tro/chu-tro/${ct.id}`),
        api.get(`/hop-dong/chu-tro/${ct.id}`),
        api.get(`/hoa-don/chu-tro/${ct.id}`)
      ]);
      setPhongTros(phongRes.data || []);
      setHopDongs(hopDongRes.data || []);
      setHoaDons(hoaDonRes.data || []);
    } catch (err) {
      console.warn("Backend might not support hop-dong or hoa-don for landlord yet, falling back to rooms:", err);
      try {
        const res = await api.get(`/phong-tro/chu-tro/${ct.id}`);
        setPhongTros(res.data || []);
      } catch (innerErr) {
        setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('admin.error_load_rooms'), onConfirm: null });
      }
    }
    finally { setLoadingRooms(false); }
  };

  const tagColorPhong = (tt) => {
    if (tt === ROOM_STATUS.EMPTY) return 'green';
    if (tt === ROOM_STATUS.RENTED) return 'red';
    return 'amber';
  };

  const pendingCount = khieuNais.filter(kn => kn.trangThai === 'CHO_XU_LY').length;

  return (
    <div style={{ fontFamily: 'var(--font)' }}>
      <div style={S.navBar}>
        <button style={S.navItem(adminTab === 'USERS')} onClick={() => setAdminTab('USERS')}>{t('admin.tab_users')}</button>
        <button style={S.navItem(adminTab === 'BAO_CAO')} onClick={() => setAdminTab('BAO_CAO')}>📊 {t('landlord.tab_report')}</button>
        <button style={S.navItem(adminTab === 'PHONG')} onClick={() => { setAdminTab('PHONG'); setChuTroDangChon(null); }}>{t('admin.tab_rooms')}</button>
        <button style={S.navItem(adminTab === 'KHIEU_NAI')} onClick={() => setAdminTab('KHIEU_NAI')}>
          {t('admin.tab_complaints')}
          {pendingCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'var(--danger)', color: '#fff', fontSize: '10px',
              marginLeft: '6px', fontWeight: 700,
            }}>{pendingCount}</span>
          )}
        </button>
      </div>

      {loadingInit ? <Spinner text={t('admin.init_loading')} /> : (
        <>
          {adminTab === 'USERS' && <QuanLyNguoiDung />}

          {adminTab === 'BAO_CAO' && <DashboardTab thongKeData={thongKeData} isAdmin={true} />}

          {adminTab === 'PHONG' && (
            !chuTroDangChon ? (
              <div style={S.card}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>{t('admin.search_rooms')}</div>
                <input type="text" placeholder={t('admin.search_placeholder')} value={tuKhoa} onChange={e => setTuKhoa(e.target.value)} style={{ ...S.input, marginBottom: '20px' }} />
                {chuTros.filter(ct =>
                  ct.username.toLowerCase().includes(tuKhoa.toLowerCase()) ||
                  (ct.hoTen && ct.hoTen.toLowerCase().includes(tuKhoa.toLowerCase()))
                ).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
                    {t('admin.no_rooms_found')}
                  </div>
                ) : (
                  <div className="grid-cards">
                    {chuTros.filter(ct =>
                      ct.username.toLowerCase().includes(tuKhoa.toLowerCase()) ||
                      (ct.hoTen && ct.hoTen.toLowerCase().includes(tuKhoa.toLowerCase()))
                    ).map((ct, i) => {
                      const isUnread = unreadSenderIds.some(id => String(id) === String(ct.id));
                      return (
                        <div key={ct.id}
                          onClick={() => { if (!ct.locked) handleChonChuTro(ct); }}
                          style={{
                            position: 'relative',
                            padding: '20px', background: 'var(--bg)', border: isUnread ? '1px solid var(--danger)' : '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)', textAlign: 'center',
                            transition: 'all var(--transition)',
                            opacity: ct.locked ? 0.5 : 1, cursor: ct.locked ? 'not-allowed' : 'pointer',
                            animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                            boxShadow: isUnread ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none',
                          }}>
                          <style>{`
                            @keyframes pulseDot {
                              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                              70% { transform: scale(1.1); box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
                              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                            }
                          `}</style>
                          {isUnread && (
                            <span style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              width: '10px',
                              height: '10px',
                              backgroundColor: 'var(--danger)',
                              borderRadius: '50%',
                              display: 'inline-block',
                              boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3)',
                              animation: 'pulseDot 1.2s infinite'
                            }} />
                          )}
                          <div style={{ ...S.avatar(i), margin: '0 auto 10px', width: '44px', height: '44px', fontSize: '15px' }}>
                            {(ct.hoTen || ct.username).charAt(0).toUpperCase()}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ct.hoTen ? `${ct.hoTen} (${ct.username})` : ct.username}
                          </div>
                          {ct.locked && <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginTop: '4px' }}>🔒 {t('admin.locked')}</div>}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{t('admin.id')}: {ct.id}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', ...S.card }}>
                  <button style={S.btn} onClick={() => setChuTroDangChon(null)}>{t('admin.back')}</button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t('admin.room_label')} <span style={{ color: chuTroDangChon.locked ? 'var(--danger)' : 'var(--success)' }}>
                        {chuTroDangChon.hoTen ? `${chuTroDangChon.hoTen} (${chuTroDangChon.username})` : chuTroDangChon.username} {chuTroDangChon.locked && `(${t('admin.locked')})`}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{phongTros.length} {t('admin.room_count')}</div>
                  </div>
                  <button
                    style={{ 
                      ...S.btnPrimary, 
                      opacity: chuTroDangChon.locked ? 0.4 : 1, 
                      cursor: chuTroDangChon.locked ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => {
                      if (chuTroDangChon.locked) {
                        setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('admin.account_locked'), onConfirm: null });
                        return;
                      }
                      onSetChatTarget(chuTroDangChon);
                    }}
                  >
                    {t('admin.btn_chat')}
                    {unreadSenderIds.some(id => String(id) === String(chuTroDangChon.id)) && (
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

                {loadingRooms ? <Spinner text={t('admin.loading_rooms')} /> : (
                  <div className="grid-cards">
                    {phongTros.map((phong, i) => (
                      <div key={phong.id}
                        onClick={() => setPhongDangXem(phong)}
                        style={{
                          ...S.card, padding: '20px',
                          borderTop: `3px solid ${phong.trangThai === ROOM_STATUS.EMPTY ? 'var(--success)' : phong.trangThai === ROOM_STATUS.RENTED ? 'var(--danger)' : 'var(--warning)'}`,
                          borderRadius: `0 0 var(--radius-lg) var(--radius-lg)`,
                          animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                        className="admin-room-card"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{phong.tenPhong}</div>
                          <span style={S.tag(tagColorPhong(phong.trangThai))}>{t('admin.room_status_' + phong.trangThai) || phong.trangThai}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('admin.price')}: <strong style={{ color: 'var(--accent)' }}>{phong.giaPhong?.toLocaleString()} {t('landlord.currency')}</strong></div>
                        <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🔍 Xem chi tiết phòng →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {adminTab === 'KHIEU_NAI' && (
            <div style={S.card}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                {t('admin.complaint_list')}
              </div>
              {khieuNais.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>📭</div>
                  {t('admin.no_complaints')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {khieuNais.map((kn, i) => (
                    <div key={kn.id} style={{
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
                      opacity: kn.trangThai === 'DA_GIAI_QUYET' ? 0.6 : 1,
                      animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={S.avatar(i)}>{(kn.nguoiGui?.username || '?').charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{kn.tieuDe}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{kn.nguoiGui?.username} — {t('admin.id')}: {kn.nguoiGui?.id || kn.nguoiGuiId}</div>
                          </div>
                        </div>
                        <span style={S.tag(kn.trangThai === 'DA_GIAI_QUYET' ? 'blue' : 'amber')}>{kn.trangThai === 'DA_GIAI_QUYET' ? t('admin.status_resolved') : t('admin.status_pending')}</span>
                      </div>
                      <div style={{ padding: '12px 16px' }}>
                        <div style={{
                          fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic',
                          padding: '10px 14px', background: 'var(--warning-light)',
                          borderRadius: 'var(--radius-sm)', border: '1px solid #FDE68A',
                          borderLeft: '3px solid var(--warning)', marginBottom: '12px',
                        }}>"{kn.noiDung}"</div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            style={{ 
                              ...S.btn, 
                              opacity: kn.nguoiGui?.locked ? 0.4 : 1, 
                              cursor: kn.nguoiGui?.locked ? 'not-allowed' : 'pointer',
                              position: 'relative',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onClick={() => {
                              if (kn.nguoiGui?.locked) {
                                setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('admin.account_locked'), onConfirm: null });
                                return;
                              }
                              onSetChatTarget({ id: kn.nguoiGui?.id, username: kn.nguoiGui?.username });
                            }}
                          >
                            {t('admin.btn_contact')}
                            {unreadSenderIds.some(id => String(id) === String(kn.nguoiGui?.id || kn.nguoiGuiId)) && (
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
                          {kn.trangThai === 'CHO_XU_LY' && (
                            <button style={S.btnSuccess} onClick={() => handleXuLyKhieuNai(kn.id)}>{t('admin.btn_resolved')}</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}



      {phongDangXem && (
        <AdminRoomDetailModal
          phong={phongDangXem}
          hopDongs={hopDongs}
          hoaDons={hoaDons}
          onClose={() => setPhongDangXem(null)}
          t={t}
          tagColorPhong={tagColorPhong}
        />
      )}

      <ConfirmModal
        {...confirmState}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// ==========================================
// AdminRoomDetailModal component — Hiển thị chi tiết phòng cho Admin
// ==========================================
const AdminRoomDetailModal = ({
  phong,
  hopDongs,
  hoaDons,
  onClose,
  t,
  tagColorPhong,
}) => {
  const [activeModalTab, setActiveModalTab] = useState('INFO');

  const phongHopDongs = hopDongs.filter(hd => hd.phongTro?.id === phong.id);
  const phongHoaDons = hoaDons.filter(hd => hd.phongTro?.id === phong.id);

  const activeContract = phongHopDongs.find(hd => hd.trangThai === 'DA_DUYET' || hd.trangThai === 'YEU_CAU_HUY');
  const pendingContract = phongHopDongs.find(hd => hd.trangThai === 'CHO_DUYET');
  const activeOrPendingContract = activeContract || pendingContract;

  const renderTabContent = () => {
    switch (activeModalTab) {
      case 'INFO':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease' }}>
            {phong.hinhAnh && (
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '180px', border: '1px solid var(--border-light)' }}>
                {phong.hinhAnh.includes('|||') ? (
                  <img src={phong.hinhAnh.split('|||')[0]} alt={phong.tenPhong} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <img src={phong.hinhAnh} alt={phong.tenPhong} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={modalInfoRowStyle}>
                <span style={modalInfoLabelStyle}>{t('landlord.rent_price')}</span>
                <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{phong.giaPhong?.toLocaleString()} {t('landlord.currency')}</strong>
              </div>
              <div style={modalInfoRowStyle}>
                <span style={modalInfoLabelStyle}>{t('landlord.area')}</span>
                <span style={modalInfoValueStyle}>{phong.dienTich ? `${phong.dienTich} m²` : '—'}</span>
              </div>
              <div style={modalInfoRowStyle}>
                <span style={modalInfoLabelStyle}>{t('landlord.electric_price')}</span>
                <span style={modalInfoValueStyle}>{phong.giaDien?.toLocaleString()} {t('landlord.currency')}/kWh</span>
              </div>
              <div style={modalInfoRowStyle}>
                <span style={modalInfoLabelStyle}>{t('landlord.water_price')}</span>
                <span style={modalInfoValueStyle}>{phong.giaNuoc?.toLocaleString()} {t('landlord.currency')}/m³</span>
              </div>
              <div style={modalInfoRowStyle}>
                <span style={modalInfoLabelStyle}>{t('landlord.deposit')}</span>
                <span style={modalInfoValueStyle}>{phong.tienCoc?.toLocaleString()} {t('landlord.currency')}</span>
              </div>
              <div style={modalInfoRowStyle}>
                <span style={modalInfoLabelStyle}>{t('landlord.status')}</span>
                <span style={modalInfoValueStyle}>{t('admin.room_status_' + phong.trangThai) || phong.trangThai}</span>
              </div>
            </div>
            <div style={{ ...modalInfoRowStyle, gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', borderBottom: 'none' }}>
              <span style={modalInfoLabelStyle}>{t('landlord.address')}</span>
              <span style={{ ...modalInfoValueStyle, lineHeight: '1.4', fontWeight: '500' }}>📍 {phong.diaChi || '—'}</span>
            </div>
            {phong.moTa && (
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ ...modalInfoLabelStyle, display: 'block', marginBottom: '6px' }}>{t('landlord.more_description')}</span>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{phong.moTa}</div>
              </div>
            )}
          </div>
        );
      case 'CONTRACT':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease' }}>
            {activeOrPendingContract ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Hợp đồng hiện tại</span>
                    <span style={tagStyle(activeOrPendingContract.trangThai)}>
                      {activeOrPendingContract.trangThai === 'DA_DUYET' ? 'Đang hiệu lực' :
                        activeOrPendingContract.trangThai === 'YEU_CAU_HUY' ? 'Chờ hủy' : 'Chờ duyệt'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Mã hợp đồng:</span> #{activeOrPendingContract.id}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Tiền cọc:</span> {activeOrPendingContract.tienCoc?.toLocaleString()} đ</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Ngày bắt đầu:</span> {activeOrPendingContract.ngayBatDau}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Ngày kết thúc:</span> {activeOrPendingContract.ngayKetThuc || 'Hợp đồng vô thời hạn'}</div>
                  </div>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
                    👤 Thông tin khách thuê
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Họ và tên:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {activeOrPendingContract.khachHang?.khachHang?.hoTen || activeOrPendingContract.khachHang?.username}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số điện thoại:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{activeOrPendingContract.khachHang?.khachHang?.soDienThoai || 'Chưa cập nhật'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số CCCD:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{activeOrPendingContract.khachHang?.khachHang?.soCccd || 'Chưa cập nhật'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{activeOrPendingContract.khachHang?.khachHang?.email || 'Chưa cập nhật'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Địa chỉ thường trú:</span>
                      <span style={{ color: 'var(--text-primary)', maxWidth: '60%', textAlign: 'right' }}>
                        {activeOrPendingContract.khachHang?.khachHang?.diaChiThuongTru || 'Chưa cập nhật'}
                      </span>
                    </div>
                    {activeOrPendingContract.khachHang?.khachHang?.tenNganHang && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tài khoản ngân hàng:</span>
                        <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                          {activeOrPendingContract.khachHang.khachHang.tenNganHang} - {activeOrPendingContract.khachHang.khachHang.soTaiKhoan} ({activeOrPendingContract.khachHang.khachHang.chuTaiKhoan})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📭</span>
                <span>Hiện chưa có hợp đồng nào đang hiệu lực cho phòng này.</span>
              </div>
            )}

            {phongHopDongs.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  Lịch sử hợp đồng ({phongHopDongs.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {phongHopDongs.map(hd => (
                    <div key={hd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '12px' }}>
                      <div>
                        <strong>#{hd.id}</strong> — Khách: {hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Kỳ hạn: {hd.ngayBatDau} đến {hd.ngayKetThuc || 'Vô thời hạn'}</div>
                      </div>
                      <span style={tagStyle(hd.trangThai)}>{hd.trangThai}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'BILL_HISTORY':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease' }}>
            {phongHoaDons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>🧾</span>
                <span>Chưa có hóa đơn nào được xuất cho phòng này.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {phongHoaDons.map(hd => (
                  <div key={hd.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px', background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Hóa đơn tháng {hd.thang}/{hd.nam}</strong>
                      <span style={tagStyle(hd.trangThai)}>
                        {hd.trangThai === 'DA_THANH_TOAN' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div>Tiền phòng: <strong>{hd.tienPhong?.toLocaleString()}đ</strong></div>
                      <div>Tiền điện: <strong>{hd.tienDien?.toLocaleString()}đ</strong></div>
                      <div>Tiền nước: <strong>{hd.tienNuoc?.toLocaleString()}đ</strong></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dotted var(--border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hóa đơn ID: #{hd.id}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                        Tổng cộng: {hd.tongTien?.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const tagStyle = (status) => {
    let colors = { bg: 'var(--border-light)', text: 'var(--text-secondary)' };
    if (status === 'DA_DUYET' || status === 'DA_THANH_TOAN' || status === 'DA_THANH_LY') {
      colors = { bg: 'var(--success-light)', text: 'var(--success)' };
    } else if (status === 'CHUA_THANH_TOAN' || status === 'TU_CHOI' || status === 'HUY') {
      colors = { bg: 'var(--danger-light)', text: 'var(--danger)' };
    } else if (status === 'CHO_DUYET' || status === 'YEU_CAU_HUY') {
      colors = { bg: 'var(--warning-light)', text: 'var(--warning)' };
    }
    return {
      padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
      background: colors.bg, color: colors.text, display: 'inline-block',
    };
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease',
  };

  const modalStyle = {
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--surface)' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏠 {phong.tenPhong}
              <span style={tagColorPhong ? tagStyle(phong.trangThai) : {}}>{t('admin.room_status_' + phong.trangThai) || phong.trangThai}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Chi tiết thông tin phòng & tài chính</div>
          </div>
          <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', outline: 'none' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 20px', background: 'var(--bg)', gap: '16px' }}>
          {[
            ['INFO', 'ℹ️ Thông tin phòng'],
            ['CONTRACT', '📄 Hợp đồng & Khách thuê'],
            ['BILL_HISTORY', '🧾 Lịch sử Hóa đơn'],
          ].map(([tabKey, label]) => {
            const isActive = activeModalTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setActiveModalTab(tabKey)}
                style={{
                  padding: '12px 4px', border: 'none', background: 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all var(--transition)', outline: 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: 'var(--surface)' }}>
          {renderTabContent()}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 'var(--radius-md)', border: 'none',
              background: 'var(--text-primary)', color: '#fff', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition)',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const modalInfoRowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px',
};
const modalInfoLabelStyle = {
  color: 'var(--text-muted)', fontWeight: 500,
};
const modalInfoValueStyle = {
  color: 'var(--text-primary)', fontWeight: 600,
};
