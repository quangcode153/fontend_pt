/**
 * LandlordPage.jsx — Trang chính dành cho Chủ Trọ
 * Phase 3: Đã tách toàn bộ UI thành các component con trong ./components/
 * File này chỉ xử lý: State management, API calls, và định tuyến Tab.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import api from '../../api';
import ChatBox from '../../components/ChatBox';
import HoSoForm from '../../components/HoSoForm';
import useAdminContact from '../../hooks/useAdminContact';

/* --- Component con theo từng Tab --- */
import DashboardTab from './components/DashboardTab';
import RoomTab from './components/RoomTab';
import ContractTab from './components/ContractTab';
import InvoiceTab from './components/InvoiceTab';
import UtilityTab from './components/UtilityTab';
import NoticeTab from './components/NoticeTab';
import RoomDetailModal from './components/RoomDetailModal';
import UtilityModal from './components/UtilityModal';

import './LandlordPage.css';

/* --- Hằng số --- */
const ROLES = { LANDLORD: 'ROLE_LANDLORD' };
const ROOM_STATUS = { EMPTY: 'TRONG', RENTED: 'DA_THUE', MAINTENANCE: 'BAO_TRI' };
const CONTRACT_STATUS = { PENDING: 'CHO_DUYET', APPROVED: 'DA_DUYET', REJECTED: 'TU_CHOI' };

/* --- Spinner dùng nội bộ --- */
function Spinner({ text = 'Đang tải...' }) {
  return (
    <div className="l-spinner">
      <div className="l-spinner__circle" />
      <div className="l-spinner__text">{text}</div>
    </div>
  );
}

/* =========================================
   COMPONENT CHÍNH
   ========================================= */
function LandlordPage({ currentUser }) {
  const { t } = useTranslation();

  /* Kiểm tra quyền truy cập */
  if (currentUser?.role !== ROLES.LANDLORD) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>
        {t('landlord.access_denied')}
      </div>
    );
  }

  /* ===== STATE ===== */
  const [landlordTab, setLandlordTab] = useState('PHONG');

  /* Dữ liệu chính */
  const [phongTros, setPhongTros] = useState([]);
  const [hopDongs, setHopDongs] = useState([]);
  const [hoaDons, setHoaDons] = useState([]);
  const [thongBaos, setThongBaos] = useState([]);
  const [thongKeData, setThongKeData] = useState(null);

  /* Loading states */
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Modal states */
  const [chatTarget, setChatTarget] = useState(null);
  const [phongChiTiet, setPhongChiTiet] = useState(null);   // Modal chi tiết phòng
  const [hoSoKhachThue, setHoSoKhachThue] = useState(null);
  const [dienNuocForm, setDienNuocForm] = useState(null);   // Modal điện nước
  const [lichSuChiSo, setLichSuChiSo] = useState([]);

  /* Form thêm phòng */
  const [tenPhong, setTenPhong] = useState('');
  const [giaPhong, setGiaPhong] = useState('');
  const [trangThai, setTrangThai] = useState(ROOM_STATUS.EMPTY);

  /* Form thông báo */
  const [tieuDeTB, setTieuDeTB] = useState('');
  const [noiDungTB, setNoiDungTB] = useState('');

  /* Form điện nước */
  const [formDN, setFormDN] = useState({
    thang: new Date().getMonth() + 1,
    nam: new Date().getFullYear(),
    chiSoDauDien: '', chiSoCuoiDien: '',
    chiSoDauNuoc: '', chiSoCuoiNuoc: '',
  });

  /* Contact admin */
  const { admin: adminContact, loading: loadingAdmin, error: adminError } = useAdminContact();

  /* ===== API CALLS ===== */
  useEffect(() => { fetchData(); }, []);

  /** Fetch tất cả dữ liệu chính khi load trang */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [phongRes, hdRes, invRes, tkRes] = await Promise.all([
        api.get(`/phong-tro/chu-tro/${currentUser.id}`),
        api.get(`/hop-dong/chu-tro/${currentUser.id}`),
        api.get(`/hoa-don/chu-tro/${currentUser.id}`),
        api.get(`/thong-ke/chu-tro/${currentUser.id}`),
      ]);
      setPhongTros(phongRes.data || []);
      setHopDongs(hdRes.data || []);
      setHoaDons(invRes.data || []);
      setThongKeData(tkRes.data || null);
    } catch (err) {
      console.error(err);
      // alert(t('landlord.error_fetch'));
    } finally {
      setLoading(false);
    }
  };

  /** Fetch thông báo (chỉ gọi khi chuyển sang tab Thông báo) */
  const fetchThongBao = async () => {
    try {
      const res = await api.get(`/thong-bao/chu-tro/${currentUser.id}`);
      setThongBaos(res.data || []);
    } catch (err) {
      console.error(t('landlord.error_fetch_notice'), err);
    }
  };

  /** Fetch lịch sử chỉ số điện nước của một phòng */
  const fetchLichSuChiSo = async (phongId) => {
    try {
      const res = await api.get(`/dien-nuoc/phong/${phongId}`);
      setLichSuChiSo(res.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử điện nước:', err);
    }
  };

  /* ===== HANDLERS ===== */

  /** Thêm phòng mới */
  const handleThemPhong = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/phong-tro', {
        tenPhong,
        giaPhong: parseFloat(giaPhong),
        trangThai,
        chuTroId: currentUser.id
      });

      alert(t('landlord.success_add_room'));
      setTenPhong('');
      setGiaPhong('');
      setTrangThai(ROOM_STATUS.EMPTY);
      fetchData(); // Cập nhật lại danh sách từ server
    } catch (err) {
      console.error(err);
      alert(t('landlord.error_add_room'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Xoá phòng (với Optimistic UI) */
  const handleXoaPhong = async (id, ten) => {
    if (!window.confirm(t('landlord.confirm_delete_room', { ten }))) return;
    const prevData = [...phongTros];
    setPhongTros(prev => prev.filter(p => p.id !== id));
    try {
      await api.delete(`/phong-tro/${id}`);
    } catch {
      alert(t('landlord.error_delete_room'));
      setPhongTros(prevData);
    }
  };

  /** Đổi trạng thái phòng */
  const handleDoiTrangThaiPhong = async (phongId, trangThaiMoi) => {
    const statusText = t(`landlord.room_status_${trangThaiMoi}`);
    if (!window.confirm(t('landlord.confirm_change_status', { trangThaiMoi: statusText }))) return;
    try {
      await api.put(`/phong-tro/${phongId}/trang-thai`, null, {
        params: { trangThai: trangThaiMoi },
      });
      setPhongChiTiet(null);
      fetchData();
    } catch {
      alert(t('landlord.error_update'));
    }
  };

  /** Xem chi tiết phòng (mở modal) */
  const handleXemChiTiet = async (phong, hopDongHienTai) => {
    setPhongChiTiet({ phong, hopDongHienTai });
    setHoSoKhachThue(null);
    if (hopDongHienTai?.khachHang?.id) {
      try {
        const res = await api.get(`/khach-hang/chi-tiet/${hopDongHienTai.khachHang.id}`);
        setHoSoKhachThue(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  /** Mở form xem hồ sơ khách từ tab Yêu cầu */
  const handleXemHoSoKhach = async (hd) => {
    try {
      const res = await api.get(`/khach-hang/chi-tiet/${hd.khachHang.id}`);
      setHoSoKhachThue(res.data);
      setPhongChiTiet({ phong: hd.phongTro, hopDongHienTai: hd });
    } catch {
      alert(t('landlord.error_load_profile'));
    }
  };

  /** Duyệt / Từ chối hợp đồng */
  const handleDuyetHopDong = async (hopDongId, trangThaiMoi) => {
    const statusText = t(`landlord.contract_status_${trangThaiMoi}`);
    if (!window.confirm(t('landlord.confirm_contract', { trangThaiMoi: statusText }))) return;
    try {
      await api.put(`/hop-dong/${hopDongId}/trang-thai`, null, {
        params: { trangThai: trangThaiMoi },
      });
      fetchData();
    } catch {
      alert(t('landlord.error_approve_contract'));
    }
  };

  /** Mở modal chốt chỉ số điện nước (tạo mới) */
  const handleMoChotSo = (hd) => {
    setDienNuocForm({
      hopDongId: hd.id,
      phongId: hd.phongTro?.id,
      tenPhong: hd.phongTro?.tenPhong,
    });
    setFormDN({
      thang: new Date().getMonth() + 1,
      nam: new Date().getFullYear(),
      chiSoDauDien: '', chiSoCuoiDien: '',
      chiSoDauNuoc: '', chiSoCuoiNuoc: '',
    });
    fetchLichSuChiSo(hd.phongTro?.id);
  };

  /** Mở modal chỉnh sửa chỉ số (cập nhật) */
  const handleMoCapNhatSo = async (hd) => {
    try {
      const res = await api.get('/dien-nuoc/chi-so', {
        params: { phongId: hd.phongTro.id, thang: hd.thang, nam: hd.nam },
      });
      const cs = res.data;
      setDienNuocForm({
        isUpdate: true,
        hoaDonId: hd.id,
        phongId: hd.phongTro.id,
        tenPhong: hd.phongTro.tenPhong,
      });
      setFormDN({
        thang: hd.thang, nam: hd.nam,
        chiSoDauDien: cs.soDienCu, chiSoCuoiDien: cs.soDienMoi,
        chiSoDauNuoc: cs.soNuocCu, chiSoCuoiNuoc: cs.soNuocMoi,
      });
      fetchLichSuChiSo(hd.phongTro.id);
    } catch {
      alert(t('landlord.error_fetch_bill'));
    }
  };

  /** Submit form chốt / cập nhật điện nước */
  const handleChotDienNuoc = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        phongTro: { id: dienNuocForm.phongId },
        thang: parseInt(formDN.thang),
        nam: parseInt(formDN.nam),
        soDienCu: parseInt(formDN.chiSoDauDien),
        soDienMoi: parseInt(formDN.chiSoCuoiDien),
        soNuocCu: parseInt(formDN.chiSoDauNuoc),
        soNuocMoi: parseInt(formDN.chiSoCuoiNuoc),
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
      const msg = err.response?.data?.thongBao || err.response?.data?.message;
      alert(msg || t('landlord.error_save_bill'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Đăng thông báo */
  const handleDangThongBao = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/thong-bao', {
        tieuDe: tieuDeTB,
        noiDung: noiDungTB,
        chuTroId: currentUser.id,
      });
      setTieuDeTB('');
      setNoiDungTB('');
      fetchThongBao();
    } catch {
      alert(t('landlord.error_post_notice'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===== COMPUTED ===== */
  const pendingCount = hopDongs.filter(hd => hd.trangThai === CONTRACT_STATUS.PENDING).length;

  /* ===== TABS CONFIG ===== */
  const TABS = [
    { key: 'BAO_CAO', label: t('landlord.tab_report'), icon: '📊', onClick: fetchData },
    { key: 'PHONG', label: t('landlord.tab_room'), icon: '🏠' },
    { key: 'YEU_CAU', label: t('landlord.tab_request'), icon: '📋', badge: pendingCount, onClick: fetchData },
    { key: 'DIEN_NUOC', label: t('landlord.tab_bill'), icon: '⚡', onClick: fetchData },
    { key: 'HOA_DON', label: t('landlord.tab_invoice'), icon: '🧾', onClick: fetchData },
    { key: 'THONG_BAO', label: t('landlord.tab_notice'), icon: '📣', onClick: fetchThongBao },
    { key: 'HO_SO', label: t('landlord.tab_profile'), icon: '👤' },
  ];

  /* ===== RENDER ===== */
  return (
    <div>
      {/* === Thanh điều hướng Tab + Nút liên hệ Admin === */}
      <div className="landlord-header">
        <div className="landlord-nav-bar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`landlord-nav-bar__btn ${landlordTab === tab.key ? 'landlord-nav-bar__btn--active' : ''}`}
              onClick={() => {
                setLandlordTab(tab.key);
                tab.onClick?.();
              }}
            >
              {tab.icon} {tab.label}
              {tab.badge > 0 && (
                <span className="landlord-nav-bar__badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Nút liên hệ Admin */}
        <button
          className="landlord-contact-btn"
          onClick={() => adminContact && setChatTarget(adminContact)}
          disabled={loadingAdmin || !!adminError}
        >
          🎧 {loadingAdmin
            ? t('landlord.btn_connecting')
            : adminError
              ? t('landlord.btn_offline')
              : t('landlord.btn_chat_admin')}
        </button>
      </div>

      {/* === Spinner khi đang tải lần đầu === */}
      {loading && <Spinner text={t('landlord.syncing')} />}

      {/* === Nội dung từng Tab === */}
      {!loading && landlordTab === 'BAO_CAO' && (
        <DashboardTab thongKeData={thongKeData} />
      )}

      {!loading && landlordTab === 'PHONG' && (
        <RoomTab
          phongTros={phongTros}
          hopDongs={hopDongs}
          tenPhong={tenPhong} setTenPhong={setTenPhong}
          giaPhong={giaPhong} setGiaPhong={setGiaPhong}
          trangThai={trangThai} setTrangThai={setTrangThai}
          isSubmitting={isSubmitting}
          onThemPhong={handleThemPhong}
          onXoaPhong={handleXoaPhong}
          onXemChiTiet={handleXemChiTiet}
        />
      )}

      {!loading && landlordTab === 'YEU_CAU' && (
        <ContractTab
          hopDongs={hopDongs}
          onDuyetHopDong={handleDuyetHopDong}
          onSetChatTarget={setChatTarget}
          onXemHoSo={handleXemHoSoKhach}
          onRefresh={fetchData}
        />
      )}

      {!loading && landlordTab === 'DIEN_NUOC' && (
        <UtilityTab
          hopDongs={hopDongs}
          onMoChotSo={handleMoChotSo}
        />
      )}

      {!loading && landlordTab === 'HOA_DON' && (
        <InvoiceTab
          hoaDons={hoaDons}
          onCapNhatSo={handleMoCapNhatSo}
        />
      )}

      {!loading && landlordTab === 'THONG_BAO' && (
        <NoticeTab
          thongBaos={thongBaos}
          tieuDeTB={tieuDeTB} setTieuDeTB={setTieuDeTB}
          noiDungTB={noiDungTB} setNoiDungTB={setNoiDungTB}
          isSubmitting={isSubmitting}
          onDangThongBao={handleDangThongBao}
        />
      )}

      {!loading && landlordTab === 'HO_SO' && (
        <div className="l-card">
          <HoSoForm user={currentUser} />
        </div>
      )}

      {/* === Modals === */}
      <RoomDetailModal
        phongChiTiet={phongChiTiet}
        hoSoKhachThue={hoSoKhachThue}
        onClose={() => setPhongChiTiet(null)}
        onDoiTrangThai={handleDoiTrangThaiPhong}
        onSetChatTarget={setChatTarget}
      />

      <UtilityModal
        dienNuocForm={dienNuocForm}
        formDN={formDN}
        setFormDN={setFormDN}
        lichSuChiSo={lichSuChiSo}
        isSubmitting={isSubmitting}
        onSubmit={handleChotDienNuoc}
        onClose={() => setDienNuocForm(null)}
      />

      {/* === ChatBox === */}
      {chatTarget && (
        <ChatBox
          currentUser={currentUser}
          targetUser={chatTarget}
          isOpen={true}
          onClose={() => setChatTarget(null)}
        />
      )}
    </div>
  );
}

export default LandlordPage;
