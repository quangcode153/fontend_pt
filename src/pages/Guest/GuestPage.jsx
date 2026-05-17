import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import ChatBox from '../../components/ChatBox';
import KhieuNaiForm from '../../components/KhieuNaiForm';
import HoSoForm from '../../components/HoSoForm';
import ContractModal from '../../components/ContractModal';
import ConfirmModal from '../../components/ConfirmModal';
import useAdminContact from '../../hooks/useAdminContact';
import './GuestPage.css';

const ROLES = { USER: 'ROLE_USER' };
const ROOM_STATUS = { EMPTY: 'TRONG', RENTED: 'DA_THUE', MAINTENANCE: 'BAO_TRI' };

const validateHoSo = (hoSo) => hoSo && hoSo.soCccd && hoSo.soDienThoai;

const S = {
  navBar: {
    display: 'flex', gap: '2px', background: 'var(--border-light)',
    padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    marginBottom: '20px', width: 'fit-content',
  },
  navItem: (active) => ({
    padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, transition: 'all var(--transition)',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  }),
  card: {
    background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '20px',
  },
  tag: (color) => {
    const map = {
      green: { bg: 'var(--success-light)', text: 'var(--success)' },
      red: { bg: 'var(--danger-light)', text: 'var(--danger)' },
    };
    return {
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600,
      background: map[color].bg, color: map[color].text,
    };
  },
  btn: {
    padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, transition: 'all var(--transition)',
  },
  btnPrimary: {
    padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'opacity var(--transition)',
  },
  btnSuccess: {
    padding: '10px', borderRadius: 'var(--radius-md)', border: 'none',
    background: 'var(--text-primary)', color: '#fff', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600, width: '100%',
    transition: 'opacity var(--transition)',
  },
  btnContact: (disabled) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '12px', fontWeight: 500, border: '1px solid var(--border)',
    background: 'var(--surface)', color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    opacity: disabled ? 0.6 : 1, transition: 'all var(--transition)', whiteSpace: 'nowrap',
  }),
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px',
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color var(--transition)',
  },
};

const Spinner = ({ text }) => {
  const { t } = useTranslation();
  const loadingText = text || t('landlord.loading');
  return (
    <div className="l-spinner">
      <div className="l-spinner__circle" />
      <div className="l-spinner__text">{loadingText}</div>
    </div>
  );
};

function GuestPage({ currentUser, onRentSuccess }) {
  const { t } = useTranslation();
  if (currentUser?.role !== ROLES.USER) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>{t('guest.access_denied')}</div>;
  }

  const [activeTab, setActiveTab] = useState('TIM_TRO');
  const [searchMode, setSearchMode] = useState('ROOM'); // 'ROOM' (Tìm phòng trực tiếp) hoặc 'HOST' (Tìm theo chủ nhà)
  
  // States cho tìm kiếm chủ nhà (Host browsing)
  const [chuTros, setChuTros] = useState([]);
  const [chuTroDangChon, setChuTroDangChon] = useState(null);
  const [phongTros, setPhongTros] = useState([]);
  const [hoSoChuTro, setHoSoChuTro] = useState(null);
  const [tuKhoa, setTuKhoa] = useState('');

  // States cho bộ lọc tìm kiếm phòng trực tiếp (Room search)
  const [searchTenPhong, setSearchTenPhong] = useState('');
  const [searchDiaChi, setSearchDiaChi] = useState('');
  const [searchGiaMin, setSearchGiaMin] = useState('');
  const [searchGiaMax, setSearchGiaMax] = useState('');
  const [searchTrangThai, setSearchTrangThai] = useState('TRONG');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [chatTarget, setChatTarget] = useState(null);
  const [phongDangCho, setPhongDangCho] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewContract, setPreviewContract] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  const { admin: adminContact, loading: loadingAdmin, error: adminError } = useAdminContact();
  const latestClickId = useRef(null);

  // Fetch danh sách chủ trọ cho tab 'Tìm theo chủ nhà'
  useEffect(() => {
    const fetchDanhSachChuTro = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tai-khoan/chu-tro');
        setChuTros(res.data || []);
      } catch (err) {
        setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('guest.error_system'), onConfirm: null });
      } finally {
        setLoading(false);
      }
    };
    fetchDanhSachChuTro();
  }, [t]);

  // Gọi API tìm kiếm phòng trực tiếp
  const handleSearchRooms = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    try {
      const params = {};
      if (searchTenPhong.trim()) params.tenPhong = searchTenPhong.trim();
      if (searchDiaChi.trim()) params.diaChi = searchDiaChi.trim();
      if (searchGiaMin.trim()) params.giaToiThieu = Number(searchGiaMin);
      if (searchGiaMax.trim()) params.giaToiDa = Number(searchGiaMax);
      if (searchTrangThai && searchTrangThai !== 'ALL') params.trangThai = searchTrangThai;

      const res = await api.get('/phong-tro/search', { params });
      setSearchResults(res.data || []);
    } catch (err) {
      setConfirmState({ 
        isOpen: true, 
        type: 'danger', 
        title: t('common.error'), 
        message: err.response?.data?.message || err.message, 
        onConfirm: null 
      });
    } finally {
      setSearching(false);
    }
  };

  // Tự động tìm kiếm phòng khi chuyển sang tab tìm phòng hoặc khi đổi bộ lọc nhanh
  useEffect(() => {
    if (searchMode === 'ROOM') {
      handleSearchRooms();
    }
  }, [searchMode]);

  // Đặt lại các bộ lọc tìm phòng về mặc định
  const handleResetFilters = () => {
    setSearchTenPhong('');
    setSearchDiaChi('');
    setSearchGiaMin('');
    setSearchGiaMax('');
    setSearchTrangThai('TRONG');
    setTimeout(() => {
      api.get('/phong-tro/search', { params: { trangThai: 'TRONG' } })
        .then(res => setSearchResults(res.data || []))
        .catch(console.error);
    }, 0);
  };

  const handleChonChuTro = async (ct) => {
    latestClickId.current = ct.id;
    setChuTroDangChon(ct);
    setHoSoChuTro(null);
    setLoading(true);

    try {
      const [phongRes, chiTietRes] = await Promise.all([
        api.get(`/phong-tro/chu-tro/${ct.id}`),
        api.get(`/tai-khoan/chu-tro/${ct.id}/chi-tiet`)
      ]);
      if (latestClickId.current !== ct.id) return;
      setPhongTros(phongRes.data || []);
      setHoSoChuTro(chiTietRes.data || null);
    } catch (err) {
      if (latestClickId.current === ct.id) {
        setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('guest.error_room_info'), onConfirm: null });
      }
    } finally {
      if (latestClickId.current === ct.id) setLoading(false);
    }
  };

  const openContractPreview = async (phong) => {
    try {
      let hoSo;
      try {
        const hoSoRes = await api.get('/khach-hang/ho-so/me');
        hoSo = hoSoRes.data;
      } catch (err) {
        if (err.response?.status === 404) {
          alert(t('guest.profile_missing'));
          setActiveTab('HO_SO');
          return;
        }
        throw err;
      }
      if (!validateHoSo(hoSo)) {
        setConfirmState({
          isOpen: true, type: 'warning', title: t('common.confirm'),
          message: t('guest.profile_incomplete'),
          onConfirm: () => {
            setConfirmState(prev => ({ ...prev, isOpen: false }));
            setActiveTab('HO_SO');
          }
        });
        return;
      }

      // Nếu đang tìm trực tiếp ngoài màn hình search, ta cần lấy thông tin chi tiết của chủ trọ phòng đó
      let chuTroInfoObj = hoSoChuTro || chuTroDangChon;
      if (!chuTroInfoObj || chuTroInfoObj.id !== phong.chuTroId) {
        setLoading(true);
        try {
          const detailRes = await api.get(`/tai-khoan/chu-tro/${phong.chuTroId}/chi-tiet`);
          chuTroInfoObj = detailRes.data;
          setHoSoChuTro(chuTroInfoObj);
        } catch (err) {
          console.error("Không lấy được thông tin chi tiết chủ trọ", err);
          chuTroInfoObj = { id: phong.chuTroId, username: t('guest.host_name') };
          setHoSoChuTro(chuTroInfoObj);
        } finally {
          setLoading(false);
        }
      }

      setPreviewContract({ ...phong, hoSoKhachHang: hoSo });
    } catch (err) {
      setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('guest.error') + (err.response?.data?.message || err.message), onConfirm: null });
    }
  };

  const handleDangKyThue = async () => {
    const phong = previewContract;
    if (!phong) return;
    setIsSubmitting(true);
    try {
      await api.post('/hop-dong', {
        phongTroId: phong.id,
        ngayBatDau: new Date().toISOString().split('T')[0],
        tienCoc: phong.tienCoc || 0,
      });

      // Đảm bảo có thông tin chủ trọ để chat và gửi thông báo
      let activeHost = chuTroDangChon;
      if (!activeHost) {
        try {
          const ctListRes = await api.get('/tai-khoan/chu-tro');
          const found = (ctListRes.data || []).find(ct => ct.id === phong.chuTroId);
          if (found) {
            activeHost = found;
            setChuTroDangChon(found);
          }
        } catch (e) {
          console.error(e);
        }
      }

      setPhongDangCho({ ...phong, chuTroId: phong.chuTroId });
      setConfirmState({
        isOpen: true, type: 'success', title: t('common.success'),
        message: t('guest.rent_success'),
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          onRentSuccess?.();
        }
      });
    } catch (err) {
      setConfirmState({ isOpen: true, type: 'danger', title: t('common.error'), message: t('guest.error') + (err.response?.data?.message || err.message), onConfirm: null });
    } finally {
      setIsSubmitting(false);
      setPreviewContract(null);
    }
  };

  const displayName = hoSoChuTro?.hoTen || chuTroDangChon?.username || "?";
  const avatarChar = displayName.charAt(0).toUpperCase();

  if (phongDangCho) {
    return (
      <div style={{ fontFamily: 'var(--font)' }}>
        <div style={{
          maxWidth: '440px', margin: '40px auto', background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
          padding: '40px 32px', textAlign: 'center', animation: 'fadeInUp 0.4s ease',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--warning-light)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
          }}>⏳</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{t('guest.pending_request')}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('guest.room')} <strong>{phongDangCho.tenPhong}</strong></div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>{t('guest.host_reply_soon')}</div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button style={S.btnPrimary} onClick={() => setChatTarget({ id: phongDangCho.chuTroId, username: displayName })}>{t('guest.btn_chat')}</button>
            <button style={S.btn} onClick={() => setPhongDangCho(null)}>{t('guest.btn_back')}</button>
          </div>
        </div>
        {chatTarget && <ChatBox currentUser={currentUser} targetUser={chatTarget} isOpen={true} onClose={() => setChatTarget(null)} />}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font)' }}>
      {/* Header Navigation tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px' }}>
        <div style={S.navBar}>
          <button style={S.navItem(activeTab === 'TIM_TRO')} onClick={() => setActiveTab('TIM_TRO')}>{t('guest.tab_market')}</button>
          <button style={S.navItem(activeTab === 'HO_SO')} onClick={() => setActiveTab('HO_SO')}>{t('guest.tab_profile')}</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KhieuNaiForm />
          <button
            style={S.btnContact(loadingAdmin || !!adminError)}
            onClick={() => adminContact && setChatTarget(adminContact)}
            disabled={loadingAdmin || !!adminError}
          >
            🎧 {loadingAdmin ? t('guest.btn_connecting') : adminError ? t('guest.btn_offline') : t('guest.btn_chat_admin')}
          </button>
        </div>
      </div>

      {activeTab === 'HO_SO' && <HoSoForm user={currentUser} />}

      {activeTab === 'TIM_TRO' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Sub-selector for Search Mode (ROOM or HOST) */}
          {!chuTroDangChon && (
            <div className="search-mode-selector">
              <button 
                className={`search-mode-btn ${searchMode === 'ROOM' ? 'search-mode-btn--active' : ''}`}
                onClick={() => setSearchMode('ROOM')}
              >
                🔍 {t('guest.search_room_directly')}
              </button>
              <button 
                className={`search-mode-btn ${searchMode === 'HOST' ? 'search-mode-btn--active' : ''}`}
                onClick={() => setSearchMode('HOST')}
              >
                🏢 {t('guest.search_by_host')}
              </button>
            </div>
          )}

          {/* MODE 1: SEARCH ROOM DIRECTLY */}
          {searchMode === 'ROOM' && !chuTroDangChon && (
            <div>
              {/* Premium Search Engine Panel */}
              <form onSubmit={handleSearchRooms} className="search-engine">
                <div className="search-engine__title">
                  ⚡ {t('guest.search_room_title')}
                </div>
                
                <div className="search-engine__grid">
                  {/* Field 1: Room name keyword */}
                  <div className="search-engine__field">
                    <label className="search-engine__label">{t('guest.room_name_keyword')}</label>
                    <input 
                      type="text" 
                      placeholder={t('guest.room_name_ph')}
                      value={searchTenPhong} 
                      onChange={e => setSearchTenPhong(e.target.value)}
                      className="search-engine__input" 
                    />
                  </div>

                  {/* Field 2: Address */}
                  <div className="search-engine__field">
                    <label className="search-engine__label">{t('guest.address_keyword')}</label>
                    <input 
                      type="text" 
                      placeholder={t('guest.address_ph')}
                      value={searchDiaChi} 
                      onChange={e => setSearchDiaChi(e.target.value)}
                      className="search-engine__input" 
                    />
                  </div>

                  {/* Field 3: Price range */}
                  <div className="search-engine__field">
                    <label className="search-engine__label">{t('guest.price_range')} (VNĐ)</label>
                    <div className="search-engine__range">
                      <input 
                        type="number" 
                        placeholder={t('guest.price_min')}
                        value={searchGiaMin} 
                        onChange={e => setSearchGiaMin(e.target.value)}
                        className="search-engine__input" 
                      />
                      <span className="search-engine__separator">-</span>
                      <input 
                        type="number" 
                        placeholder={t('guest.price_max')}
                        value={searchGiaMax} 
                        onChange={e => setSearchGiaMax(e.target.value)}
                        className="search-engine__input" 
                      />
                    </div>
                  </div>

                  {/* Field 4: Status */}
                  <div className="search-engine__field">
                    <label className="search-engine__label">{t('guest.room_status')}</label>
                    <select 
                      value={searchTrangThai} 
                      onChange={e => setSearchTrangThai(e.target.value)}
                      className="search-engine__select"
                    >
                      <option value="ALL">{t('guest.all_status')}</option>
                      <option value="TRONG">{t('guest.status_empty')}</option>
                      <option value="DA_THUE">{t('guest.status_rented')}</option>
                      <option value="BAO_TRI">{t('guest.status_maintenance')}</option>
                    </select>
                  </div>
                </div>

                <div className="search-engine__actions">
                  <button type="button" onClick={handleResetFilters} className="btn-search-secondary">
                    {t('guest.btn_reset')}
                  </button>
                  <button type="submit" className="btn-search-primary" disabled={searching}>
                    {searching ? t('guest.btn_processing') : t('guest.btn_search')}
                  </button>
                </div>
              </form>

              {/* Search Results Display */}
              {searching ? (
                <Spinner text={t('common.loading')} />
              ) : searchResults.length === 0 ? (
                <div style={S.card}>
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
                    {t('guest.no_rooms_found')}
                  </div>
                </div>
              ) : (
                <div className="grid-cards">
                  {searchResults.map((phong, i) => (
                    <div key={phong.id} style={{
                      ...S.card,
                      borderTop: `3px solid ${phong.trangThai === ROOM_STATUS.EMPTY ? 'var(--success)' : 'var(--danger)'}`,
                      borderRadius: `0 0 var(--radius-lg) var(--radius-lg)`,
                      animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                      display: 'flex', flexDirection: 'column'
                    }}>
                      {phong.hinhAnh && (
                        <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                          <img src={phong.hinhAnh.includes('|||') ? phong.hinhAnh.split('|||')[0] : phong.hinhAnh} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{phong.tenPhong}</div>
                        <span style={S.tag(phong.trangThai === ROOM_STATUS.EMPTY ? 'green' : 'red')}>
                          {phong.trangThai === ROOM_STATUS.EMPTY ? t('guest.status_empty') : phong.trangThai === ROOM_STATUS.RENTED ? t('guest.status_rented') : t('guest.status_maintenance')}
                        </span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={S.infoRow}>
                          <span style={{ color: 'var(--text-muted)' }}>{t('guest.rent_price')}</span>
                          <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px' }}>{phong.giaPhong?.toLocaleString()} {t('guest.currency_month')}</span>
                        </div>
                        {phong.dienTich && (
                          <div style={S.infoRow}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('guest.area')}</span>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{phong.dienTich} m²</span>
                          </div>
                        )}
                        {phong.tienCoc != null && (
                          <div style={S.infoRow}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('guest.deposit')}</span>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{phong.tienCoc?.toLocaleString()} {t('landlord.currency')}</span>
                          </div>
                        )}
                        {(phong.giaDien != null || phong.giaNuoc != null) && (
                          <div style={S.infoRow}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('guest.utility')}</span>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {phong.giaDien ? `${phong.giaDien.toLocaleString()} ${t('landlord.currency')}` : '—'} / {phong.giaNuoc ? `${phong.giaNuoc.toLocaleString()} ${t('landlord.currency')}` : '—'}
                            </span>
                          </div>
                        )}
                        {phong.diaChi && (
                          <div style={{ ...S.infoRow, alignItems: 'flex-start', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('guest.address')}</span>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>📍 {phong.diaChi}</span>
                          </div>
                        )}
                        {phong.moTa && (
                          <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>{t('guest.description')}</div>
                            <div style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                              {phong.moTa}
                            </div>
                          </div>
                        )}

                        {/* Room host metadata identifier */}
                        <div className="room-card__host-info">
                          <div className="room-card__host-avatar">🏠</div>
                          <div className="room-card__host-name">{t('guest.host_label')} ID {phong.chuTroId}</div>
                        </div>
                      </div>

                      {phong.trangThai === ROOM_STATUS.EMPTY && (
                        <button
                          style={{ ...S.btnSuccess, marginTop: '16px', opacity: isSubmitting ? 0.6 : 1 }}
                          onClick={() => openContractPreview(phong)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? t('guest.btn_processing') : t('guest.btn_rent')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODE 2: BROWSE BY HOST */}
          {searchMode === 'HOST' && !chuTroDangChon && (
            <div>
              {loading && <Spinner text={t('guest.loading_host_list')} />}

              {!loading && (
                <div style={S.card}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>{t('guest.search_host')}</div>
                  <input type="text" placeholder={t('guest.search_placeholder')} value={tuKhoa} onChange={e => setTuKhoa(e.target.value)} style={{ ...S.input, marginBottom: '20px' }} />
                  {chuTros.filter(ct => ct.username.toLowerCase().includes(tuKhoa.toLowerCase())).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
                      {t('guest.no_host_found')}
                    </div>
                  ) : (
                    <div className="grid-cards">
                      {chuTros.filter(ct => ct.username.toLowerCase().includes(tuKhoa.toLowerCase())).map((ct, i) => (
                        <div key={ct.id} onClick={() => handleChonChuTro(ct)} style={{
                          padding: '20px', background: 'var(--bg)', border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                          transition: 'all var(--transition)', animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                        }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 10px',
                            background: 'var(--accent-light)', color: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '16px',
                          }}>
                            {ct.username.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('guest.host_name')} {ct.username}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW: DETAILED ROOMS OF SELECTED HOST */}
          {chuTroDangChon && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', ...S.card }}>
                <button style={S.btn} onClick={() => setChuTroDangChon(null)}>{t('guest.btn_back')}</button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('guest.host_label')} <span style={{ color: 'var(--success)' }}>{chuTroDangChon.username}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {loading ? t('guest.loading') : `${phongTros.filter(p => p.trangThai === ROOM_STATUS.EMPTY).length} ${t('guest.empty_rooms_count')}`}
                  </div>
                </div>
              </div>

              {loading ? <Spinner text={t('guest.loading_host_data')} /> : (
                <>
                  <div style={{
                    ...S.card, marginBottom: '16px', background: 'var(--success-light)',
                    border: '1px solid #BBF7D0', animation: 'fadeIn 0.3s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          background: '#DCFCE7', color: 'var(--success)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', fontWeight: 700,
                        }}>{avatarChar}</div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>{displayName}</div>
                          <div style={{ fontSize: '12px', color: '#15803D', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <span>📞 {hoSoChuTro?.soDienThoai || t('guest.not_updated')}</span>
                            <span>✉️ {hoSoChuTro?.email || t('guest.not_updated')}</span>
                          </div>
                        </div>
                      </div>
                      <button style={S.btnPrimary} onClick={() => setChatTarget({ id: chuTroDangChon.id, username: displayName })}>
                        {t('guest.btn_chat')}
                      </button>
                    </div>
                  </div>

                  <div className="grid-cards">
                    {phongTros.map((phong, i) => (
                      <div key={phong.id} style={{
                        ...S.card,
                        borderTop: `3px solid ${phong.trangThai === ROOM_STATUS.EMPTY ? 'var(--success)' : 'var(--danger)'}`,
                        borderRadius: `0 0 var(--radius-lg) var(--radius-lg)`,
                        animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                        display: 'flex', flexDirection: 'column'
                      }}>
                        {phong.hinhAnh && (
                          <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                            <img src={phong.hinhAnh.includes('|||') ? phong.hinhAnh.split('|||')[0] : phong.hinhAnh} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{phong.tenPhong}</div>
                          <span style={S.tag(phong.trangThai === ROOM_STATUS.EMPTY ? 'green' : 'red')}>
                            {phong.trangThai === ROOM_STATUS.EMPTY ? t('guest.status_empty') : phong.trangThai === ROOM_STATUS.RENTED ? t('guest.status_rented') : t('guest.status_maintenance')}
                          </span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={S.infoRow}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('guest.rent_price')}</span>
                            <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px' }}>{phong.giaPhong?.toLocaleString()} {t('guest.currency_month')}</span>
                          </div>
                          {phong.dienTich && (
                            <div style={S.infoRow}>
                              <span style={{ color: 'var(--text-muted)' }}>{t('guest.area')}</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{phong.dienTich} m²</span>
                            </div>
                          )}
                          {phong.tienCoc != null && (
                            <div style={S.infoRow}>
                              <span style={{ color: 'var(--text-muted)' }}>{t('guest.deposit')}</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{phong.tienCoc?.toLocaleString()} {t('landlord.currency')}</span>
                            </div>
                          )}
                          {(phong.giaDien != null || phong.giaNuoc != null) && (
                            <div style={S.infoRow}>
                              <span style={{ color: 'var(--text-muted)' }}>{t('guest.utility')}</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {phong.giaDien ? `${phong.giaDien.toLocaleString()} ${t('landlord.currency')}` : '—'} / {phong.giaNuoc ? `${phong.giaNuoc.toLocaleString()} ${t('landlord.currency')}` : '—'}
                              </span>
                            </div>
                          )}
                          {phong.diaChi && (
                            <div style={{ ...S.infoRow, alignItems: 'flex-start', flexDirection: 'column', gap: '6px', borderBottom: 'none' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{t('guest.address')}</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>📍 {phong.diaChi}</span>
                            </div>
                          )}
                          {phong.moTa && (
                            <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>{t('guest.description')}</div>
                              <div style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                {phong.moTa}
                              </div>
                            </div>
                          )}
                        </div>

                        {phong.trangThai === ROOM_STATUS.EMPTY && (
                          <button
                            style={{ ...S.btnSuccess, marginTop: '16px', opacity: isSubmitting ? 0.6 : 1 }}
                            onClick={() => openContractPreview(phong)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? t('guest.btn_processing') : t('guest.btn_rent')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {chatTarget && <ChatBox currentUser={currentUser} targetUser={chatTarget} isOpen={true} onClose={() => setChatTarget(null)} />}

      <ContractModal
        isOpen={!!previewContract}
        onClose={() => setPreviewContract(null)}
        phong={previewContract}
        chuTroInfo={hoSoChuTro || chuTroDangChon}
        khachThueInfo={previewContract?.hoSoKhachHang}
        onConfirm={handleDangKyThue}
        confirmText={t('guest.confirm_rent_contract')}
        isProcessing={isSubmitting}
        role="TENANT"
      />

      <ConfirmModal
        {...confirmState}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default GuestPage;