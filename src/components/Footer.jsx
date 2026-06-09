import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer" style={{ marginTop: '40px' }}>
      <div className="app-footer__grid">
        {/* Column 1: Introduction */}
        <div className="app-footer__col">
          <div className="app-footer__title">🏠 Smart Room Rental</div>
          <div className="app-footer__desc">
            {t('footer.desc_app')}
          </div>
        </div>

        {/* Column 2: VIP Support */}
        <div className="app-footer__col">
          <div className="app-footer__title">{t('footer.col_vip')}</div>
          <div className="app-footer__desc">
            {t('footer.contact_hotline_fast')}<br/>
            ✉️ Email: vip.support@smartrental.vn
          </div>
        </div>

        {/* Column 3: Status Badges */}
        <div className="app-footer__col">
          <div className="app-footer__title">{t('footer.col_status')}</div>
          <div className="app-footer__badges" style={{ marginTop: '4px' }}>
            <span className="app-footer__badge">🛡️ Session Secure</span>
            <span className="app-footer__badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', borderColor: '#BBF7D0' }}>🟢 API Connected</span>
          </div>
        </div>
      </div>

      <div className="app-footer__bottom">
        <span className="app-footer__copy">
          {t('home.footer_copy') || '© 2026 Smart Room Rental.'}
        </span>
        <span className="app-footer__version" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Premium Dashboard v2.2.0
        </span>
      </div>
    </footer>
  );
}
