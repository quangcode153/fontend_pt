import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import ChatBox from '../components/ChatBox';
import KhieuNaiForm from '../components/KhieuNaiForm';
import HoSoForm from '../components/HoSoForm';
import useAdminContact from '../hooks/useAdminContact';

const ROLES = { USER: 'ROLE_USER' };

const S = {
  navBar: {
    display: 'flex', gap: '2px', background: 'var(--border-light)',
    padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    width: 'fit-content',
  },
  navBtn: (active) => ({
    padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, transition: 'all var(--transition)',
    background: active ? 'var(--surface)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    boxShadow: active ? 'var(--shadow-xs)' : 'none',
  }),
  card: {
    background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', padding: '24px',
    animation: 'fadeIn 0.3s ease',
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px',
  },
  sectionTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)',
  },
  tag: (color) => {
    const map = {
      green: { bg: 'var(--success-light)', text: 'var(--success)' },
      amber: { bg: 'var(--warning-light)', text: 'var(--warning)' },
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
    fontSize: '13px', fontWeight: 500, transition: 'all var(--transition)',
  },
  btnContact: (disabled) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '12px', fontWeight: 500, border: '1px solid var(--border)',
    background: 'var(--surface)', color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    opacity: disabled ? 0.6 : 1, transition: 'all var(--transition)', whiteSpace: 'nowrap',
  }),
  emptyState: {
    textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)',
    animation: 'fadeIn 0.3s ease',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalContent: {
    background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '90%', maxWidth: '400px',
    padding: '32px', textAlign: 'center', position: 'relative',
    animation: 'modalIn 0.25s ease',
  },
};

export default function TenantPage({ currentUser, hopDongCuaToi }) {
  const { t } = useTranslation();
  if (currentUser?.role !== ROLES.USER) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>
        {t('tenant.access_denied')}
      </div>
    );
  }

  const [cuDanTab, setCuDanTab] = useState('THONG_TIN');
  const [chatTarget, setChatTarget] = useState(null);
  const [dsThongBao, setDsThongBao] = useState([]);
  const [dsHoaDon, setDsHoaDon] = useState([]);
  const [payingHD, setPayingHD] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [landlordBank, setLandlordBank] = useState(null);

  const fetchHoaDon = () => {
    setLoadingTab(true);
    api.get('/hoa-don/me')
      .then(res => setDsHoaDon(res.data || []))
      .catch(err => console.error(t('tenant.error_fetch_invoice'), err))
      .finally(() => setLoadingTab(false));
  };

  const { admin: adminContact, loading: loadingAdmin, error: adminError } = useAdminContact();
  const noContract = !hopDongCuaToi || Object.keys(hopDongCuaToi).length === 0;

  useEffect(() => {
    if (cuDanTab === 'THONG_BAO' && hopDongCuaToi?.phongTro?.chuTroId) {
      setLoadingTab(true);
      api.get(`/thong-bao/chu-tro/${hopDongCuaToi.phongTro.chuTroId}`)
        .then(res => setDsThongBao(res.data || []))
        .catch(err => console.error(t('tenant.error_fetch_notice'), err))
        .finally(() => setLoadingTab(false));
    }
    if (cuDanTab === 'HOA_DON') {
      fetchHoaDon();
    }
  }, [cuDanTab, hopDongCuaToi]);

  useEffect(() => {
    if (hopDongCuaToi?.phongTro?.chuTroId) {
      api.get(`/tai-khoan/chu-tro/${hopDongCuaToi.phongTro.chuTroId}/chi-tiet`)
        .then(res => {
          if (res.data?.soTaiKhoan) {
            setLandlordBank({
              tenNganHang: res.data.tenNganHang || 'mb',
              soTaiKhoan: res.data.soTaiKhoan || '',
              chuTaiKhoan: res.data.chuTaiKhoan || '',
            });
          }
        })
        .catch(err => console.error('Error fetching landlord bank info:', err));
    }
  }, [hopDongCuaToi]);

  const handleThanhToan = async () => {
    if (!payingHD) return;
    setIsProcessing(true);
    try {
      await api.post(`/hoa-don/${payingHD.id}/thanh-toan`);
      alert(t('tenant.payment_success'));
      setPayingHD(null);
      fetchHoaDon();
    } catch (err) {
      console.error(err);
      alert(t('tenant.payment_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const TABS = [
    { key: 'THONG_TIN', label: t('tenant.tab_contract') },
    { key: 'HO_SO',     label: t('tenant.tab_profile') },
    { key: 'HOA_DON',   label: t('tenant.tab_invoice') },
    { key: 'THONG_BAO', label: t('tenant.tab_notice') },
  ];

  const Spinner = () => (
    <div style={{ textAlign: 'center', padding: '40px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{
        width: '24px', height: '24px', border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.6s linear infinite', margin: '0 auto 12px',
      }} />
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('tenant.loading')}</div>
    </div>
  );

  const fmt = (v) => v != null ? Number(v).toLocaleString('vi-VN') : '0';

  const getVietQRUrl = (amount, month, year) => {
    const bankId = landlordBank?.tenNganHang?.toLowerCase() || 'mb';
    const accNum = landlordBank?.soTaiKhoan || '0000000000';
    const accName = landlordBank?.chuTaiKhoan || 'CHU TRO';
    const desc = `Thanh toan tien phong thang ${month} nam ${year}`;
    return `https://img.vietqr.io/image/${bankId}-${accNum}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(accName)}`;
  };

  return (
    <div style={{ fontFamily: 'var(--font)' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '20px', gap: '12px',
      }}>
        <div style={S.navBar}>
          {TABS.map(t => (
            <button key={t.key} style={S.navBtn(cuDanTab === t.key)} onClick={() => setCuDanTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KhieuNaiForm />
          <button
            style={S.btnContact(loadingAdmin || !!adminError)}
            onClick={() => adminContact && setChatTarget(adminContact)}
            disabled={loadingAdmin || !!adminError}
          >
            🎧 {loadingAdmin ? t('tenant.btn_connecting') : adminError ? t('tenant.btn_offline') : t('tenant.btn_chat_admin')}
          </button>
        </div>
      </div>

      <div style={S.card}>
        {cuDanTab === 'HO_SO' && <HoSoForm user={currentUser} />}

        {cuDanTab === 'THONG_TIN' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={S.sectionTitle}>{t('tenant.contract_info_title')}</div>

            {noContract ? (
              <div style={S.emptyState}>
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.6 }}>📭</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('tenant.no_contract')}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('tenant.no_contract_desc')}</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('tenant.room')}</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}>{hopDongCuaToi.phongTro?.tenPhong}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('tenant.status')}</div>
                    <div style={{ marginTop: '2px' }}><span style={S.tag('green')}>{t('tenant.status_active')}</span></div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', padding: '4px 16px', marginBottom: '16px',
                }}>
                  <div style={S.infoRow}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('tenant.rent_price')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{hopDongCuaToi.phongTro?.giaPhong?.toLocaleString()} {t('landlord.currency')}/tháng</span>
                  </div>
                  <div style={S.infoRow}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('tenant.representative')}</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{currentUser.username}</span>
                  </div>
                  <div style={{ ...S.infoRow, borderBottom: 'none' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('tenant.start_date')}</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{hopDongCuaToi.ngayBatDau}</span>
                  </div>
                </div>

                <button style={S.btnPrimary} onClick={() => setChatTarget({ id: hopDongCuaToi.phongTro?.chuTroId, username: t('tenant.landlord') })}>
                  {t('tenant.contact_landlord')}
                </button>
              </>
            )}
          </div>
        )}

        {cuDanTab === 'HOA_DON' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={S.sectionTitle}>{t('tenant.invoice_title')}</div>
            {loadingTab ? <Spinner /> : dsHoaDon.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.6 }}>🎉</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('tenant.no_invoice')}
                </div>
                <div style={{ fontSize: '13px' }}>{t('tenant.no_invoice_desc')}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dsHoaDon.map((hd, i) => {
                  const daTT = hd.trangThai === 'DA_THANH_TOAN';
                  return (
                    <div key={hd.id} style={{
                      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                      border: `1px solid ${daTT ? '#D1FAE5' : 'var(--border)'}`,
                      background: 'var(--surface)', opacity: daTT ? 0.75 : 1,
                      transition: 'all var(--transition)',
                      animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 20px', borderBottom: '1px solid var(--border-light)',
                        background: daTT ? '#F0FDF4' : 'var(--bg)',
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                            {t('tenant.payment_period')}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {t('tenant.month_year', { thang: hd.thang, nam: hd.nam })}
                          </div>
                        </div>
                        <span style={S.tag(daTT ? 'green' : 'red')}>
                          {daTT ? t('tenant.paid') : t('tenant.unpaid')}
                        </span>
                      </div>

                      <div style={{ padding: '16px 20px' }}>
                        {[
                          { icon: '🏠', label: t('tenant.room_fee'), value: hd.tienPhong, bg: '#EFF6FF' },
                          { icon: '⚡', label: t('tenant.electric_fee'), value: hd.tienDien, bg: '#FEF9C3' },
                          { icon: '💧', label: t('tenant.water_fee'), value: hd.tienNuoc, bg: '#E0F2FE' },
                        ].map((item, idx) => (
                          <div key={idx} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 0', borderBottom: idx < 2 ? '1px solid var(--border-light)' : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                                background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px',
                              }}>{item.icon}</div>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(item.value)} {t('landlord.currency')}</span>
                          </div>
                        ))}

                        <div style={{
                          marginTop: '12px', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                          background: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ fontWeight: 500, color: '#A1A1AA', fontSize: '12px' }}>{t('tenant.total')}</span>
                          <span style={{ fontWeight: 700, color: '#FDE68A', fontSize: '16px' }}>{fmt(hd.tongTien)} {t('landlord.currency')}</span>
                        </div>

                        {!daTT && (
                          <button
                            style={{
                              width: '100%', marginTop: '12px', padding: '11px',
                              borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                              background: 'var(--success)', color: '#fff',
                              fontSize: '13px', fontWeight: 600, transition: 'opacity var(--transition)',
                            }}
                            onClick={() => setPayingHD(hd)}
                          >
                            {t('tenant.btn_pay')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {cuDanTab === 'THONG_BAO' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={S.sectionTitle}>{t('tenant.notice_title')}</div>
            {loadingTab ? <Spinner /> : dsThongBao.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.6 }}>📢</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {t('tenant.no_notice')}
                </div>
                <div style={{ fontSize: '13px' }}>{t('tenant.no_notice_desc')}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dsThongBao.map((tb, i) => (
                  <div key={tb.id} style={{
                    padding: '16px', background: 'var(--bg)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                    borderLeft: '3px solid var(--accent)',
                    animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {tb.tieuDe}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {tb.noiDung}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                      {tb.ngayDang ? new Date(tb.ngayDang).toLocaleString('vi-VN') : t('tenant.recently')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {chatTarget && (
        <ChatBox currentUser={currentUser} targetUser={chatTarget} isOpen={true} onClose={() => setChatTarget(null)} />
      )}

      {payingHD && (
        <div style={S.modalOverlay}>
          <div style={S.modalContent}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {t('tenant.confirm_payment')}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
              {t('tenant.invoice_month', { thang: payingHD.thang, nam: payingHD.nam })} <strong style={{ color: 'var(--accent)' }}>{payingHD.tongTien?.toLocaleString()} {t('landlord.currency')}</strong>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '16px', display: 'inline-block' }}>
              <img 
                src={getVietQRUrl(payingHD.tongTien, payingHD.thang, payingHD.nam)} 
                alt="VietQR" 
                style={{ width: '100%', maxWidth: '240px', height: 'auto', display: 'block', margin: '0 auto' }} 
              />
              <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('tenant.qr_scan_instruction')}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('tenant.qr_scan_note')}</div>
            </div>

            <div style={{
              background: 'var(--warning-light)', padding: '12px', borderRadius: 'var(--radius-md)',
              marginBottom: '20px', textAlign: 'center', fontSize: '12px',
              color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
              {t('tenant.payment_test_msg')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button style={S.btn} onClick={() => setPayingHD(null)} disabled={isProcessing}>{t('tenant.btn_cancel')}</button>
              <button
                style={{ ...S.btnPrimary, padding: '11px', justifyContent: 'center' }}
                onClick={handleThanhToan}
                disabled={isProcessing}
              >
                {isProcessing ? t('tenant.btn_processing') : t('tenant.btn_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}