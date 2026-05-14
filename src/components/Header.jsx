import React from 'react';
import { useTranslation } from 'react-i18next';

function Header({ user, onLogout }) {
  const { t, i18n } = useTranslation();

  const role = (user.role || '').replace('ROLE_', '');
  const roleMap = { ADMIN: t('header.role_ADMIN'), LANDLORD: t('header.role_LANDLORD'), USER: t('header.role_USER') };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 0', marginBottom: '24px',
      borderBottom: '1px solid var(--border)',
      animation: 'slideDown 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>🏠</span>
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {t('header.app_name')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleLanguage}
          style={{
            padding: '5px 10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-primary)', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600,
          }}
          title={i18n.language === 'vi' ? 'Switch to English' : 'Đổi sang Tiếng Việt'}
        >
          {i18n.language === 'vi' ? '🇺🇸 EN' : '🇻🇳 VI'}
        </button>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user.username}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {roleMap[role] || role}
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '7px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500,
            transition: 'all var(--transition)',
          }}
        >
          {t('header.logout')}
        </button>
      </div>
    </div>
  );
}

export default Header;