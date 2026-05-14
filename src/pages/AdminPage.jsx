import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import ChatBox from '../components/ChatBox';
import QuanLyNguoiDung from '../components/QuanLyNguoiDung';

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

export default function AdminPage({ currentUser }) {
  const { t } = useTranslation();
  if (currentUser?.role !== ROLES.ADMIN) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>{t('admin.access_denied')}</div>;
  }

  const [adminTab, setAdminTab] = useState('USERS');
  const [chuTros, setChuTros] = useState([]);
  const [tuKhoa, setTuKhoa] = useState('');
  const [chuTroDangChon, setChuTroDangChon] = useState(null);
  const [phongTros, setPhongTros] = useState([]);
  const [khieuNais, setKhieuNais] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoadingInit(true);
    try {
      const [chuTroRes, khieuNaiRes] = await Promise.all([
        api.get('/tai-khoan/chu-tro'), api.get('/khieu-nai')
      ]);
      setChuTros(chuTroRes.data || []);
      setKhieuNais(khieuNaiRes.data || []);
    } catch (err) {
      alert(t('admin.error_init'));
    } finally { setLoadingInit(false); }
  };

  const handleXuLyKhieuNai = async (id) => {
    if (!window.confirm(t('admin.confirm_resolve'))) return;
    try {
      await api.put(`/khieu-nai/${id}/xu-ly`);
      setKhieuNais(prev => prev.map(kn => kn.id === id ? { ...kn, trangThai: 'DA_GIAI_QUYET' } : kn));
    } catch (err) {
      alert(t('admin.error_general') + (err.response?.data?.message || ""));
    }
  };

  const handleChonChuTro = async (ct) => {
    setChuTroDangChon(ct);
    setLoadingRooms(true);
    try {
      const res = await api.get(`/phong-tro/chu-tro/${ct.id}`);
      setPhongTros(res.data || []);
    } catch (err) { alert(t('admin.error_load_rooms')); }
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

          {adminTab === 'PHONG' && (
            !chuTroDangChon ? (
              <div style={S.card}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>{t('admin.search_rooms')}</div>
                <input type="text" placeholder={t('admin.search_placeholder')} value={tuKhoa} onChange={e => setTuKhoa(e.target.value)} style={{ ...S.input, marginBottom: '20px' }} />
                {chuTros.filter(ct => ct.username.toLowerCase().includes(tuKhoa.toLowerCase())).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
                    {t('admin.no_rooms_found')}
                  </div>
                ) : (
                  <div className="grid-cards">
                    {chuTros.filter(ct => ct.username.toLowerCase().includes(tuKhoa.toLowerCase())).map((ct, i) => (
                      <div key={ct.id}
                        onClick={() => { if (!ct.locked) handleChonChuTro(ct); }}
                        style={{
                          padding: '20px', background: 'var(--bg)', border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)', textAlign: 'center',
                          transition: 'all var(--transition)',
                          opacity: ct.locked ? 0.5 : 1, cursor: ct.locked ? 'not-allowed' : 'pointer',
                          animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                        }}>
                        <div style={{ ...S.avatar(i), margin: '0 auto 10px', width: '44px', height: '44px', fontSize: '15px' }}>
                          {ct.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{ct.username}</div>
                        {ct.locked && <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginTop: '4px' }}>🔒 {t('admin.locked')}</div>}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{t('admin.id')}: {ct.id}</div>
                      </div>
                    ))}
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
                        {chuTroDangChon.username} {chuTroDangChon.locked && `(${t('admin.locked')})`}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{phongTros.length} {t('admin.room_count')}</div>
                  </div>
                  <button
                    style={{ ...S.btnPrimary, opacity: chuTroDangChon.locked ? 0.4 : 1, cursor: chuTroDangChon.locked ? 'not-allowed' : 'pointer' }}
                    onClick={() => {
                      if (chuTroDangChon.locked) { alert(t('admin.account_locked')); return; }
                      setChatTarget(chuTroDangChon);
                    }}
                  >{t('admin.btn_chat')}</button>
                </div>

                {loadingRooms ? <Spinner text={t('admin.loading_rooms')} /> : (
                  <div className="grid-cards">
                    {phongTros.map((phong, i) => (
                      <div key={phong.id} style={{
                        ...S.card, padding: '20px',
                        borderTop: `3px solid ${phong.trangThai === ROOM_STATUS.EMPTY ? 'var(--success)' : phong.trangThai === ROOM_STATUS.RENTED ? 'var(--danger)' : 'var(--warning)'}`,
                        borderRadius: `0 0 var(--radius-lg) var(--radius-lg)`,
                        animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{phong.tenPhong}</div>
                          <span style={S.tag(tagColorPhong(phong.trangThai))}>{t('admin.room_status_' + phong.trangThai) || phong.trangThai}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('admin.price')}: <strong style={{ color: 'var(--accent)' }}>{phong.giaPhong?.toLocaleString()} đ</strong></div>
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
                            style={{ ...S.btn, opacity: kn.nguoiGui?.locked ? 0.4 : 1, cursor: kn.nguoiGui?.locked ? 'not-allowed' : 'pointer' }}
                            onClick={() => {
                              if (kn.nguoiGui?.locked) { alert(t('admin.account_locked')); return; }
                              setChatTarget({ id: kn.nguoiGui?.id, username: kn.nguoiGui?.username });
                            }}
                          >{t('admin.btn_contact')}</button>
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

      {chatTarget && <ChatBox currentUser={currentUser} targetUser={chatTarget} isOpen={true} onClose={() => setChatTarget(null)} />}
    </div>
  );
}