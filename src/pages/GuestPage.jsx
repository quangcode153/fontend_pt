import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import ChatBox from '../components/ChatBox';
import KhieuNaiForm from '../components/KhieuNaiForm';
import HoSoForm from '../components/HoSoForm';
import useAdminContact from '../hooks/useAdminContact';

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

function GuestPage({ currentUser, onRentSuccess }) {
  const { t } = useTranslation();
  if (currentUser?.role !== ROLES.USER) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>{t('guest.access_denied')}</div>;
  }

  const [activeTab, setActiveTab] = useState('TIM_TRO');
  const [chuTros, setChuTros] = useState([]);
  const [chuTroDangChon, setChuTroDangChon] = useState(null);
  const [phongTros, setPhongTros] = useState([]);
  const [hoSoChuTro, setHoSoChuTro] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);
  const [tuKhoa, setTuKhoa] = useState('');
  const [phongDangCho, setPhongDangCho] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { admin: adminContact, loading: loadingAdmin, error: adminError } = useAdminContact();
  const latestClickId = useRef(null);

  useEffect(() => {
    const fetchDanhSachChuTro = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tai-khoan/chu-tro');
        setChuTros(res.data || []);
      } catch (err) { alert(t('guest.error_system')); }
      finally { setLoading(false); }
    };
    fetchDanhSachChuTro();
  }, []);

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
      if (latestClickId.current === ct.id) alert(t('guest.error_room_info'));
    } finally {
      if (latestClickId.current === ct.id) setLoading(false);
    }
  };

  const handleDangKyThue = async (phong) => {
    setIsSubmitting(true);
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
        alert(t('guest.profile_incomplete'));
        setActiveTab('HO_SO');
        return;
      }
      if (window.confirm(`${t('guest.confirm_rent')} ${phong.tenPhong}?`)) {
        await api.post('/hop-dong', {
          phongTroId: phong.id,
          ngayBatDau: new Date().toISOString().split('T')[0],
          tienCoc: 0,
        });
        setPhongDangCho({ ...phong, chuTroId: chuTroDangChon.id });
        alert(t('guest.rent_success'));
        if (onRentSuccess) onRentSuccess();
      }
    } catch (err) {
      alert(t('guest.error') + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
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
          {loading && !chuTroDangChon && <Spinner text={t('guest.loading_host_list')} />}

          {!loading && !chuTroDangChon && (
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
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
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{phong.tenPhong}</div>
                          <span style={S.tag(phong.trangThai === ROOM_STATUS.EMPTY ? 'green' : 'red')}>
                            {phong.trangThai === ROOM_STATUS.EMPTY ? t('guest.status_empty') : phong.trangThai === ROOM_STATUS.RENTED ? t('guest.status_rented') : t('guest.status_maintenance')}
                          </span>
                        </div>
                        <div style={S.infoRow}>
                          <span style={{ color: 'var(--text-muted)' }}>{t('guest.rent_price')}</span>
                          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{phong.giaPhong?.toLocaleString()} {t('guest.currency_month')}</span>
                        </div>
                        {phong.trangThai === ROOM_STATUS.EMPTY && (
                          <button
                            style={{ ...S.btnSuccess, marginTop: '14px', opacity: isSubmitting ? 0.6 : 1 }}
                            onClick={() => handleDangKyThue(phong)}
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
    </div>
  );
}

export default GuestPage;