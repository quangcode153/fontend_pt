import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import ChatBox from '../components/ChatBox';
import HoSoForm from '../components/HoSoForm';
import useAdminContact from '../hooks/useAdminContact';

const ROLES = { LANDLORD: 'ROLE_LANDLORD' };
const ROOM_STATUS = { EMPTY: 'TRONG', RENTED: 'DA_THUE', MAINTENANCE: 'BAO_TRI' };
const CONTRACT_STATUS = { PENDING: 'CHO_DUYET', APPROVED: 'DA_DUYET', REJECTED: 'TU_CHOI' };

const S = {
  navBar: {
    display: 'flex', gap: '2px', background: 'var(--border-light)',
    padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    flexWrap: 'wrap',
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
  sectionTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)',
  },
  tag: (color) => {
    const map = {
      green: { bg: 'var(--success-light)', text: 'var(--success)' },
      red: { bg: 'var(--danger-light)', text: 'var(--danger)' },
      blue: { bg: 'var(--accent-light)', text: 'var(--accent)' },
      amber: { bg: 'var(--warning-light)', text: 'var(--warning)' },
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
  btnDanger: {
    padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'var(--danger)', color: '#fff', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, transition: 'opacity var(--transition)',
  },
  btnContact: (disabled) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '12px', fontWeight: 500, border: '1px solid var(--border)',
    background: 'var(--surface)', color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    opacity: disabled ? 0.6 : 1, transition: 'all var(--transition)', whiteSpace: 'nowrap',
  }),
  formInput: {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
    transition: 'border-color var(--transition)', boxSizing: 'border-box',
  },
  formLabel: {
    fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
    marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em',
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px',
  },
};

const Spinner = ({ text = 'Đang tải...' }) => (
  <div style={{ textAlign: 'center', padding: '40px', animation: 'fadeIn 0.3s ease' }}>
    <div style={{
      width: '24px', height: '24px', border: '3px solid var(--border)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin 0.6s linear infinite', margin: '0 auto 12px',
    }} />
    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{text}</div>
  </div>
);

function LandlordPage({ currentUser }) {
  const { t } = useTranslation();
  if (currentUser?.role !== ROLES.LANDLORD) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>{t('landlord.access_denied')}</div>;
  }

  const [landlordTab, setLandlordTab] = useState('PHONG');
  const [phongTros, setPhongTros] = useState([]);
  const [hopDongs, setHopDongs] = useState([]);
  const [hoaDons, setHoaDons] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [phongChiTiet, setPhongChiTiet] = useState(null);
  const [hoSoKhachThue, setHoSoKhachThue] = useState(null);

  const [tenPhong, setTenPhong] = useState('');
  const [giaPhong, setGiaPhong] = useState('');
  const [trangThai, setTrangThai] = useState(ROOM_STATUS.EMPTY);

  const [thongBaos, setThongBaos] = useState([]);
  const [tieuDeTB, setTieuDeTB] = useState('');
  const [noiDungTB, setNoiDungTB] = useState('');

  const [dienNuocForm, setDienNuocForm] = useState(null);
  const [lichSuChiSo, setLichSuChiSo] = useState([]);
  const [formDN, setFormDN] = useState({
    thang: new Date().getMonth() + 1,
    nam: new Date().getFullYear(),
    chiSoDauDien: '', chiSoCuoiDien: '',
    chiSoDauNuoc: '', chiSoCuoiNuoc: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thongKeData, setThongKeData] = useState(null);

  const { admin: adminContact, loading: loadingAdmin, error: adminError } = useAdminContact();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [phongRes, hdRes, invRes, tkRes] = await Promise.all([
        api.get(`/phong-tro/chu-tro/${currentUser.id}`),
        api.get(`/hop-dong/chu-tro/${currentUser.id}`),
        api.get(`/hoa-don/chu-tro/${currentUser.id}`),
        api.get(`/thong-ke/chu-tro/${currentUser.id}`)
      ]);
      setPhongTros(phongRes.data || []);
      setHopDongs(hdRes.data || []);
      setHoaDons(invRes.data || []);
      setThongKeData(tkRes.data || null);
    } catch (err) { alert(t('landlord.error_fetch')); }
    finally { setLoading(false); }
  };

  const fetchThongBao = async () => {
    try {
      const res = await api.get(`/thong-bao/chu-tro/${currentUser.id}`);
      setThongBaos(res.data || []);
    } catch (err) { console.error(t('landlord.error_fetch_notice'), err); }
  };

  const handleDangThongBao = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/thong-bao', { tieuDe: tieuDeTB, noiDung: noiDungTB, chuTroId: currentUser.id });
      setTieuDeTB(''); setNoiDungTB('');
      fetchThongBao();
    } catch { alert(t('landlord.error_post_notice')); }
    finally { setIsSubmitting(false); }
  };

  const handleThemPhong = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/phong-tro', { tenPhong, giaPhong: parseFloat(giaPhong), trangThai });
      setPhongTros(prev => [...prev, res.data]);
      setTenPhong(''); setGiaPhong('');
    } catch { alert(t('landlord.error_add_room')); }
    finally { setIsSubmitting(false); }
  };

  const handleXoaPhong = async (id, ten) => {
    if (window.confirm(t('landlord.confirm_delete_room', { ten }))) {
      const prevData = [...phongTros];
      setPhongTros(prev => prev.filter(p => p.id !== id));
      try {
        await api.delete(`/phong-tro/${id}`);
      } catch {
        alert(t('landlord.error_delete_room'));
        setPhongTros(prevData);
      }
    }
  };

  const handleDoiTrangThaiPhong = async (phongId, trangThaiMoi) => {
    const statusText = t(`landlord.room_status_${trangThaiMoi}`);
    if (window.confirm(t('landlord.confirm_change_status', { trangThaiMoi: statusText }))) {
      try {
        await api.put(`/phong-tro/${phongId}/trang-thai`, null, { params: { trangThai: trangThaiMoi } });
        setPhongChiTiet(null);
        fetchData();
      } catch { alert(t('landlord.error_update')); }
    }
  };

  const handleChotDienNuoc = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        phongTro: { id: dienNuocForm.phongId },
        thang: parseInt(formDN.thang), nam: parseInt(formDN.nam),
        soDienCu: parseInt(formDN.chiSoDauDien), soDienMoi: parseInt(formDN.chiSoCuoiDien),
        soNuocCu: parseInt(formDN.chiSoDauNuoc), soNuocMoi: parseInt(formDN.chiSoCuoiNuoc)
      };

      if (dienNuocForm.isUpdate) {
        await api.put(`/dien-nuoc/cap-nhat/${dienNuocForm.hoaDonId}`, payload);
        alert(t('landlord.success_update_bill'));
      } else {
        await api.post('/dien-nuoc/chot-so', payload);
        alert(t('landlord.success_create_bill'));
      }

      setDienNuocForm(null);
      fetchData();
    } catch (err) {
      const serverMsg = err.response?.data?.thongBao || err.response?.data?.message;
      alert(serverMsg || t('landlord.error_save_bill'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLichSuChiSo = async (phongId) => {
    try {
      const res = await api.get(`/dien-nuoc/phong/${phongId}`);
      setLichSuChiSo(res.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử điện nước:', err);
    }
  };

  const handleMoChotSo = (hd) => {
    setDienNuocForm({ hopDongId: hd.id, phongId: hd.phongTro?.id, tenPhong: hd.phongTro?.tenPhong });
    fetchLichSuChiSo(hd.phongTro?.id);
  };

  const handleMoCapNhatSo = async (hd) => {
    try {
      const res = await api.get(`/dien-nuoc/chi-so`, {
        params: { phongId: hd.phongTro.id, thang: hd.thang, nam: hd.nam }
      });
      const cs = res.data;
      setDienNuocForm({
        isUpdate: true,
        hoaDonId: hd.id,
        phongId: hd.phongTro.id,
        tenPhong: hd.phongTro.tenPhong
      });
      setFormDN({
        thang: hd.thang, nam: hd.nam,
        chiSoDauDien: cs.soDienCu, chiSoCuoiDien: cs.soDienMoi,
        chiSoDauNuoc: cs.soNuocCu, chiSoCuoiNuoc: cs.soNuocMoi
      });
      fetchLichSuChiSo(hd.phongTro.id);
    } catch (err) {
      alert(t('landlord.error_fetch_bill'));
    }
  };

  const handleDuyetHopDong = async (hopDongId, trangThaiMoi) => {
    const statusText = t(`landlord.contract_status_${trangThaiMoi}`);
    if (window.confirm(t('landlord.confirm_contract', { trangThaiMoi: statusText }))) {
      try {
        await api.put(`/hop-dong/${hopDongId}/trang-thai`, null, { params: { trangThai: trangThaiMoi } });
        fetchData();
      } catch { alert(t('landlord.error_approve_contract')); }
    }
  };

  const tagColor = (tt) => {
    if (tt === ROOM_STATUS.EMPTY) return 'green';
    if (tt === ROOM_STATUS.RENTED) return 'red';
    return 'amber';
  };

  const pendingCount = hopDongs.filter(hd => hd.trangThai === CONTRACT_STATUS.PENDING).length;

  return (
    <div style={{ fontFamily: 'var(--font)' }}>
      <div className="flex-responsive" style={{ marginBottom: '24px' }}>
        <div style={S.navBar}>
          <button style={S.navItem(landlordTab === 'BAO_CAO')} onClick={() => { setLandlordTab('BAO_CAO'); fetchData(); }}>{t('landlord.tab_report')}</button>
          <button style={S.navItem(landlordTab === 'PHONG')} onClick={() => setLandlordTab('PHONG')}>{t('landlord.tab_room')}</button>
          <button style={S.navItem(landlordTab === 'YEU_CAU')} onClick={() => { setLandlordTab('YEU_CAU'); fetchData(); }}>
            {t('landlord.tab_request')}
            {pendingCount > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: '10px', marginLeft: '6px', fontWeight: 700 }}>{pendingCount}</span>}
          </button>
          <button style={S.navItem(landlordTab === 'DIEN_NUOC')} onClick={() => { setLandlordTab('DIEN_NUOC'); fetchData(); }}>{t('landlord.tab_bill')}</button>
          <button style={S.navItem(landlordTab === 'HOA_DON')} onClick={() => { setLandlordTab('HOA_DON'); fetchData(); }}>{t('landlord.tab_invoice')}</button>
          <button style={S.navItem(landlordTab === 'THONG_BAO')} onClick={() => { setLandlordTab('THONG_BAO'); fetchThongBao(); }}>{t('landlord.tab_notice')}</button>
          <button style={S.navItem(landlordTab === 'HO_SO')} onClick={() => setLandlordTab('HO_SO')}>{t('landlord.tab_profile')}</button>
        </div>

        <div>
          <button style={S.btnContact(loadingAdmin || !!adminError)} onClick={() => adminContact && setChatTarget(adminContact)} disabled={loadingAdmin || !!adminError}>🎧 {loadingAdmin ? t('landlord.btn_connecting') : adminError ? t('landlord.btn_offline') : t('landlord.btn_chat_admin')}</button>
        </div>
      </div>

      {!loading && landlordTab === 'BAO_CAO' && thongKeData && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={S.sectionTitle}>{t('landlord.dashboard_title')}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('landlord.revenue_this_month')}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{thongKeData.tongDoanhThuThangNay?.toLocaleString() || 0} {t('landlord.currency')}</div>
              <div style={{ fontSize: '13px', color: thongKeData.tyLeTangTruong >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                {thongKeData.tyLeTangTruong >= 0 ? '↗' : '↘'} {Math.abs(thongKeData.tyLeTangTruong)}% {t('landlord.compared_last_month')}
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('landlord.occupancy_rate')}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{thongKeData.tongSoPhong > 0 ? Math.round((thongKeData.soPhongDaThue / thongKeData.tongSoPhong) * 100) : 0}%</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {thongKeData.soPhongDaThue} {t('landlord.rented')} / {thongKeData.tongSoPhong} {t('landlord.total_rooms')}
              </div>
            </div>

            <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('landlord.debt')}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--warning)', marginBottom: '8px' }}>{thongKeData.tongTienChuaThanhToan?.toLocaleString() || 0} {t('landlord.currency')}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t('landlord.unpaid_invoices_count', { count: thongKeData.soHoaDonChuaThanhToan })}
              </div>
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>{t('landlord.revenue_chart')}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
              {(() => {
                const maxDT = Math.max(...(thongKeData.bieuDoDoanhThu?.map(d => d.doanhThu) || [1]));
                return thongKeData.bieuDoDoanhThu?.map((d, i) => {
                  const height = maxDT > 0 ? (d.doanhThu / maxDT) * 100 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(d.doanhThu / 1000).toLocaleString()}k</div>
                      <div style={{ width: '100%', maxWidth: '40px', height: `${height}%`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', opacity: i === 5 ? 1 : 0.6, transition: 'height 0.5s ease', minHeight: '4px' }}></div>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>T{d.thang}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {loading && <Spinner text={t('landlord.syncing')} />}

      {!loading && landlordTab === 'HO_SO' && <div style={S.card}><HoSoForm user={currentUser} /></div>}

      {!loading && landlordTab === 'THONG_BAO' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>{t('landlord.post_new_notice')}</div>
          <form onSubmit={handleDangThongBao} style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input style={S.formInput} placeholder={t('landlord.notice_title_ph')} value={tieuDeTB} onChange={e => setTieuDeTB(e.target.value)} required disabled={isSubmitting} />
            <textarea style={{ ...S.formInput, minHeight: '100px', resize: 'vertical' }} placeholder={t('landlord.notice_content_ph')} value={noiDungTB} onChange={e => setNoiDungTB(e.target.value)} required disabled={isSubmitting} />
            <div style={{ textAlign: 'right' }}><button type="submit" style={S.btnPrimary} disabled={isSubmitting}>{isSubmitting ? t('landlord.btn_sending') : t('landlord.btn_post_notice')}</button></div>
          </form>
          <div style={S.sectionTitle}>{t('landlord.notice_history')}</div>
          {thongBaos.length === 0 ? (<div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>{t('landlord.no_notices')}</div>) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {thongBaos.map((tb, i) => (
                <div key={tb.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>{tb.tieuDe}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{tb.noiDung}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>{tb.ngayDang ? new Date(tb.ngayDang).toLocaleString('vi-VN') : t('landlord.recently')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && landlordTab === 'HOA_DON' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>{t('landlord.invoice_manage_title')}</div>
          {hoaDons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>{t('landlord.no_invoices')}</div>
          ) : (
            <div className="grid-cards">
              {hoaDons.map((hd, i) => (
                <div key={hd.id} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg)', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{t('landlord.room')} {hd.phongTro?.tenPhong}</div>
                    <div style={S.tag(hd.trangThai === 'DA_THANH_TOAN' ? 'green' : 'red')}>{t('landlord.month')} {hd.thang}/{hd.nam}</div>
                  </div>
                  <div style={S.infoRow}><span>{t('landlord.total_amount')}</span><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{hd.tongTien?.toLocaleString()} {t('landlord.currency')}</span></div>
                  <div style={S.infoRow}><span>{t('landlord.status')}</span><span style={{ color: hd.trangThai === 'DA_THANH_TOAN' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{hd.trangThai === 'DA_THANH_TOAN' ? t('landlord.status_paid') : t('landlord.status_unpaid')}</span></div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button style={{ ...S.btn, flex: 1 }} onClick={() => alert(t('landlord.print_dev'))}>{t('landlord.btn_print')}</button>
                    {hd.trangThai !== 'DA_THANH_TOAN' && (
                      <button style={{ ...S.btnDanger, flex: 1 }} onClick={() => handleMoCapNhatSo(hd)}>{t('landlord.btn_update_number')}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && landlordTab === 'DIEN_NUOC' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>{t('landlord.bill_record_title')}</div>
          {hopDongs.filter(hd => hd.trangThai === CONTRACT_STATUS.APPROVED).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>{t('landlord.no_rented_rooms')}</div>
          ) : (
            <div className="grid-cards">
              {hopDongs.filter(hd => hd.trangThai === CONTRACT_STATUS.APPROVED).map((hd, i) => (
                <div key={hd.id} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg)', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{hd.phongTro?.tenPhong}</div>
                    <div style={S.tag('blue')}>{t('landlord.price_label')} {hd.phongTro?.giaPhong?.toLocaleString()} {t('landlord.currency')}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{t('landlord.guest_label')} <strong style={{ color: 'var(--text-primary)' }}>{hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username || t('landlord.not_updated')}</strong></div>
                  <button style={{ ...S.btnPrimary, width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => handleMoChotSo(hd)}>{t('landlord.btn_record_bill')}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && landlordTab === 'YEU_CAU' && (
        <div style={S.card}>
          <div className="flex-responsive" style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{t('landlord.request_title')}</div>
            <button style={S.btn} onClick={fetchData}>{t('landlord.btn_refresh')}</button>
          </div>
          {pendingCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>{t('landlord.no_requests')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {hopDongs.filter(hd => hd.trangThai === CONTRACT_STATUS.PENDING).map((hd, i) => (
                <div key={hd.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', flexWrap: 'wrap', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>{(hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username || '?').charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: '120px' }}><div style={{ fontWeight: 600, fontSize: '14px' }}>{hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username || t('landlord.not_updated')}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{hd.khachHang?.khachHang?.soDienThoai || t('landlord.no_phone')}</div></div>
                  <div style={{ minWidth: '100px' }}><div style={{ fontSize: '13px', fontWeight: 600 }}>{hd.phongTro?.tenPhong}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{hd.ngayBatDau}</div></div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button style={S.btn} onClick={async () => { try { const res = await api.get(`/khach-hang/chi-tiet/${hd.khachHang.id}`); setHoSoKhachThue(res.data); setPhongChiTiet({ phong: hd.phongTro, hopDongHienTai: hd }); } catch { alert(t('landlord.error_load_profile')); } }}>{t('landlord.btn_profile')}</button>
                    <button style={S.btn} onClick={() => setChatTarget({ id: hd.khachHang.id, username: hd.khachHang?.khachHang?.hoTen || hd.khachHang?.username || t('landlord.guest_id', { id: hd.khachHang.id }) })}>{t('landlord.btn_chat')}</button>
                    <button style={S.btnSuccess} onClick={() => handleDuyetHopDong(hd.id, CONTRACT_STATUS.APPROVED)}>{t('landlord.btn_accept')}</button>
                    <button style={S.btnDanger} onClick={() => handleDuyetHopDong(hd.id, CONTRACT_STATUS.REJECTED)}>{t('landlord.btn_reject')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && landlordTab === 'PHONG' && (
        <div>
          <div style={{ ...S.card, marginBottom: '20px' }}>
            <div style={S.sectionTitle}>{t('landlord.add_new_room')}</div>
            <form onSubmit={handleThemPhong} className="flex-responsive" style={{ alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: '140px', width: '100%' }}><label style={S.formLabel}>{t('landlord.room_name')}</label><input style={S.formInput} type="text" value={tenPhong} onChange={e => setTenPhong(e.target.value)} required disabled={isSubmitting} /></div>
              <div style={{ flex: 1, minWidth: '110px', width: '100%' }}><label style={S.formLabel}>{t('landlord.price_vnd')}</label><input style={S.formInput} type="number" value={giaPhong} onChange={e => setGiaPhong(e.target.value)} required disabled={isSubmitting} /></div>
              <div style={{ flex: 1, minWidth: '110px', width: '100%' }}><label style={S.formLabel}>{t('landlord.status')}</label><select style={S.formInput} value={trangThai} onChange={e => setTrangThai(e.target.value)} disabled={isSubmitting}><option value={ROOM_STATUS.EMPTY}>{t('landlord.status_empty')}</option><option value={ROOM_STATUS.RENTED}>{t('landlord.status_rented')}</option><option value={ROOM_STATUS.MAINTENANCE}>{t('landlord.status_maintenance')}</option></select></div>
              <button type="submit" style={{ ...S.btnSuccess, padding: '10px 16px', fontSize: '13px' }} disabled={isSubmitting}>{isSubmitting ? t('landlord.btn_saving') : t('landlord.btn_save_room')}</button>
            </form>
          </div>
          <div className="grid-cards">
            {phongTros.map((phong, i) => {
              const hopDongHienTai = hopDongs.find(hd => hd.phongTro?.id === phong.id && hd.trangThai === CONTRACT_STATUS.APPROVED);
              return (
                <div key={phong.id} style={{ ...S.card, position: 'relative', padding: '20px', borderTop: `3px solid ${phong.trangThai === ROOM_STATUS.EMPTY ? 'var(--success)' : phong.trangThai === ROOM_STATUS.RENTED ? 'var(--danger)' : 'var(--warning)'}`, borderRadius: `0 0 var(--radius-lg) var(--radius-lg)`, animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}>
                  <button onClick={() => handleXoaPhong(phong.id, phong.tenPhong)} style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', paddingRight: '36px' }}>{phong.tenPhong}</div>
                  <div style={S.infoRow}><span>{t('landlord.rent_price')}</span><span style={{ fontWeight: 600 }}>{phong.giaPhong?.toLocaleString()} {t('landlord.currency')}</span></div>
                  <div style={{ ...S.infoRow, borderBottom: 'none' }}><span>{t('landlord.status')}</span><span style={S.tag(tagColor(phong.trangThai))}>{phong.trangThai === ROOM_STATUS.EMPTY ? t('landlord.status_empty') : phong.trangThai === ROOM_STATUS.RENTED ? t('landlord.status_rented') : t('landlord.status_maintenance')}</span></div>
                  <button onClick={async () => { setPhongChiTiet({ phong, hopDongHienTai }); setHoSoKhachThue(null); if (hopDongHienTai?.khachHang?.id) { try { const res = await api.get(`/khach-hang/chi-tiet/${hopDongHienTai.khachHang.id}`); setHoSoKhachThue(res.data); } catch (err) { console.error(err); } } }} style={{ ...S.btn, marginTop: '16px', width: '100%' }}>{t('landlord.btn_details')}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phongChiTiet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', animation: 'modalIn 0.25s ease' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontSize: '16px', fontWeight: 600 }}>{phongChiTiet.phong.tenPhong}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('landlord.manage_room')}</div></div><button onClick={() => setPhongChiTiet(null)} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>✕</button></div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-light)' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('landlord.rent_price')}</div><div style={{ fontSize: '15px', fontWeight: 600 }}>{phongChiTiet.phong.giaPhong?.toLocaleString()} {t('landlord.currency')}</div></div>
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-light)' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('landlord.status')}</div><select value={phongChiTiet.phong.trangThai} onChange={e => handleDoiTrangThaiPhong(phongChiTiet.phong.id, e.target.value)} style={{ ...S.formInput, padding: '6px 10px', fontSize: '13px' }}><option value={ROOM_STATUS.EMPTY}>{t('landlord.status_empty')}</option><option value={ROOM_STATUS.RENTED}>{t('landlord.status_rented')}</option><option value={ROOM_STATUS.MAINTENANCE}>{t('landlord.status_maintenance')}</option></select></div>
              </div>
              {phongChiTiet.hopDongHienTai ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600 }}>{(hoSoKhachThue?.hoTen || '?').charAt(0)}</div><div><div style={{ fontSize: '14px', fontWeight: 600 }}>{hoSoKhachThue?.hoTen || t('landlord.loading')}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('landlord.current_tenant')}</div></div></div><button style={S.btnPrimary} onClick={() => { setChatTarget({ id: phongChiTiet.hopDongHienTai.khachHang.id, username: hoSoKhachThue?.hoTen || t('landlord.guest') }); setPhongChiTiet(null); }}>{t('landlord.btn_chat')}</button></div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>{[['CCCD', hoSoKhachThue?.soCccd], [t('landlord.phone'), hoSoKhachThue?.soDienThoai], ['Email', hoSoKhachThue?.email], [t('landlord.address'), hoSoKhachThue?.diaChiThuongTru]].map(([label, value], i) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>{label}</span><span style={{ fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{value || '—'}</span></div>
                  ))}</div>
                </div>
              ) : (<div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>{t('landlord.room_is_empty')}</div>)}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}><button onClick={() => setPhongChiTiet(null)} style={{ ...S.btn, width: '100%' }}>{t('landlord.btn_close')}</button></div>
          </div>
        </div>
      )}

      {dienNuocForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '420px', border: '1px solid var(--border)', animation: 'modalIn 0.25s ease' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontSize: '15px', fontWeight: 600 }}>{t('landlord.bill_modal_title')} {dienNuocForm.tenPhong}</div><button onClick={() => setDienNuocForm(null)} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--bg)', cursor: 'pointer' }}>✕</button></div>
            <form onSubmit={handleChotDienNuoc} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div><label style={S.formLabel}>{t('landlord.month')}</label><input type="number" style={S.formInput} value={formDN.thang} onChange={e => setFormDN({ ...formDN, thang: e.target.value })} required min="1" max="12" disabled={dienNuocForm.isUpdate} /></div>
                <div><label style={S.formLabel}>{t('landlord.year')}</label><input type="number" style={S.formInput} value={formDN.nam} onChange={e => setFormDN({ ...formDN, nam: e.target.value })} required min="2000" disabled={dienNuocForm.isUpdate} /></div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '12px' }}>{t('landlord.electric_index')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={S.formLabel}>{t('landlord.old_index')}</label><input type="number" style={S.formInput} value={formDN.chiSoDauDien} onChange={e => setFormDN({ ...formDN, chiSoDauDien: e.target.value })} required /></div>
                  <div><label style={S.formLabel}>{t('landlord.new_index')}</label><input type="number" style={S.formInput} value={formDN.chiSoCuoiDien} onChange={e => setFormDN({ ...formDN, chiSoCuoiDien: e.target.value })} required /></div>
                </div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '24px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '12px' }}>{t('landlord.water_index')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={S.formLabel}>{t('landlord.old_index')}</label><input type="number" style={S.formInput} value={formDN.chiSoDauNuoc} onChange={e => setFormDN({ ...formDN, chiSoDauNuoc: e.target.value })} required /></div>
                  <div><label style={S.formLabel}>{t('landlord.new_index')}</label><input type="number" style={S.formInput} value={formDN.chiSoCuoiNuoc} onChange={e => setFormDN({ ...formDN, chiSoCuoiNuoc: e.target.value })} required /></div>
                </div>
              </div>
              <button type="submit" style={{ ...S.btnPrimary, width: '100%', padding: '12px' }} disabled={isSubmitting}>{isSubmitting ? t('landlord.btn_saving_bill') : t('landlord.btn_save_export_bill')}</button>
            </form>

            {lichSuChiSo.length > 0 && (
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ ...S.sectionTitle, fontSize: '13px', marginBottom: '12px' }}>{t('landlord.recent_bill_history')}</div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg)', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>{t('landlord.month')}</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{t('landlord.electric_cm')}</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{t('landlord.water_cm')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lichSuChiSo.map(ls => (
                        <tr key={`${ls.thang}-${ls.nam}`}>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-light)' }}>{ls.thang}/{ls.nam}</td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{ls.soDienCu} - {ls.soDienMoi}</td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{ls.soNuocCu} - {ls.soNuocMoi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {chatTarget && <ChatBox currentUser={currentUser} targetUser={chatTarget} isOpen={true} onClose={() => setChatTarget(null)} />}
    </div>
  );
}

export default LandlordPage;