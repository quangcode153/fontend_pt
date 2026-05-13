import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color var(--transition)',
  fontFamily: 'var(--font)',
};

const labelStyle = {
  display: 'block', marginBottom: '6px', fontWeight: 500,
  color: 'var(--text-secondary)', fontSize: '12px',
  textTransform: 'uppercase', letterSpacing: '0.03em',
};

function HoSoForm({ user }) {
  const { t } = useTranslation();
  const [hoSo, setHoSo] = useState({
    hoTen: '', ngaySinh: '', gioiTinh: 'Nam',
    soCccd: '', soDienThoai: '', email: '', diaChiThuongTru: '',
    tenNganHang: '', soTaiKhoan: '', chuTaiKhoan: ''
  });
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    const fetchHoSo = async () => {
      try {
        const res = await api.get('/khach-hang/ho-so/me');
        if (res.data) {
          setHoSo({
            hoTen: res.data.hoTen || user.username,
            ngaySinh: res.data.ngaySinh || '',
            gioiTinh: res.data.gioiTinh || 'Nam',
            soCccd: res.data.soCccd || '',
            soDienThoai: res.data.soDienThoai || '',
            email: res.data.email || '',
            diaChiThuongTru: res.data.diaChiThuongTru || '',
            tenNganHang: res.data.tenNganHang || '',
            soTaiKhoan: res.data.soTaiKhoan || '',
            chuTaiKhoan: res.data.chuTaiKhoan || ''
          });
        }
      } catch (err) {
        console.error(t('guest_profile.error_load'), err);
      } finally {
        setDangTai(false);
      }
    };
    fetchHoSo();
  }, [user]);

  const handleChange = (e) => {
    setHoSo({ ...hoSo, [e.target.name]: e.target.value });
  };

  const handleLuuHoSo = async (e) => {
    e.preventDefault();
    try {
      await api.put('/khach-hang/ho-so/me', hoSo);
      alert(t('guest_profile.success_update'));
    } catch (err) {
      let errorMsg = err.response?.data?.message;
      if (!errorMsg && err.response?.data) {
        const errors = err.response.data;
        errorMsg = Object.values(errors)[0];
      }
      alert(errorMsg || t('guest_profile.error_update'));
    }
  };

  if (dangTai) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
        <div style={{
          width: '28px', height: '28px', border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite', margin: '0 auto 12px',
        }} />
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('guest_profile.loading')}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fadeInUp 0.3s ease' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {t('guest_profile.title')}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {t('guest_profile.subtitle')}
        </div>
      </div>

      <form onSubmit={handleLuuHoSo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>{t('guest_profile.fullname')}</label>
          <input type="text" name="hoTen" value={hoSo.hoTen} onChange={handleChange} required style={inputStyle} placeholder={t('guest_profile.fullname_ph')} />
        </div>

        <div>
          <label style={labelStyle}>{t('guest_profile.dob')}</label>
          <input type="date" name="ngaySinh" value={hoSo.ngaySinh} onChange={handleChange} required style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>{t('guest_profile.gender')}</label>
          <select name="gioiTinh" value={hoSo.gioiTinh} onChange={handleChange} style={inputStyle}>
            <option value="Nam">{t('guest_profile.gender_male')}</option>
            <option value="Nữ">{t('guest_profile.gender_female')}</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>{t('guest_profile.id_card')}</label>
          <input type="text" name="soCccd" value={hoSo.soCccd} onChange={handleChange} required style={inputStyle} placeholder={t('guest_profile.id_card_ph')} />
        </div>

        <div>
          <label style={labelStyle}>{t('guest_profile.phone')}</label>
          <input type="tel" name="soDienThoai" value={hoSo.soDienThoai} onChange={handleChange} required style={inputStyle} placeholder={t('guest_profile.phone_ph')} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>{t('guest_profile.email')}</label>
          <input type="email" name="email" value={hoSo.email} onChange={handleChange} style={inputStyle} placeholder={t('guest_profile.email_ph')} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>{t('guest_profile.address')}</label>
          <textarea name="diaChiThuongTru" value={hoSo.diaChiThuongTru} onChange={handleChange} required rows="3" style={{ ...inputStyle, resize: 'vertical' }} placeholder={t('guest_profile.address_ph')} />
        </div>

        {user?.role === 'ROLE_LANDLORD' && (
          <>
            <div style={{ gridColumn: 'span 2', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                🏦 {t('guest_profile.bank_section_title')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {t('guest_profile.bank_section_desc')}
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('guest_profile.bank_name')}</label>
              <input type="text" name="tenNganHang" value={hoSo.tenNganHang} onChange={handleChange} style={inputStyle} placeholder={t('guest_profile.bank_name_ph')} />
            </div>
            <div>
              <label style={labelStyle}>{t('guest_profile.bank_account')}</label>
              <input type="text" name="soTaiKhoan" value={hoSo.soTaiKhoan} onChange={handleChange} style={inputStyle} placeholder={t('guest_profile.bank_account_ph')} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>{t('guest_profile.bank_owner')}</label>
              <input type="text" name="chuTaiKhoan" value={hoSo.chuTaiKhoan} onChange={handleChange} style={inputStyle} placeholder={t('guest_profile.bank_owner_ph')} />
            </div>
          </>
        )}

        <div style={{ gridColumn: 'span 2', textAlign: 'right', marginTop: '4px' }}>
          <button type="submit" style={{
            padding: '10px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--text-primary)', color: '#fff',
            cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            transition: 'opacity var(--transition)',
          }}>
            {t('guest_profile.btn_save')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default HoSoForm;