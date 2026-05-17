import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import heroImg from '../../assets/hero_apartment.png';
import './HomePage.css';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  const FEATURES = [
    { icon: '🏠', color: 'purple', title: t('home.feature_rooms_title'),    desc: t('home.feature_rooms_desc') },
    { icon: '📄', color: 'blue',   title: t('home.feature_contract_title'), desc: t('home.feature_contract_desc') },
    { icon: '⚡', color: 'amber',  title: t('home.feature_bill_title'),     desc: t('home.feature_bill_desc') },
    { icon: '💬', color: 'green',  title: t('home.feature_chat_title'),     desc: t('home.feature_chat_desc') },
    { icon: '📊', color: 'cyan',   title: t('home.feature_stats_title'),    desc: t('home.feature_stats_desc') },
    { icon: '🔔', color: 'pink',   title: t('home.feature_notice_title'),   desc: t('home.feature_notice_desc') },
  ];

  const ROLES_LIST = [
    {
      role: 'LANDLORD', emoji: '🏢', title: t('home.role_landlord'),
      desc: t('home.role_landlord_desc'),
      perks: [
        t('landlord.tab_room'), t('landlord.tab_bill'),
        t('landlord.tab_report'), t('landlord.tab_notice')
      ],
    },
    {
      role: 'USER', emoji: '🧑‍💼', title: t('home.role_user'),
      desc: t('home.role_user_desc'),
      perks: [
        t('guest.btn_rent'), t('tenant.tab_invoice'),
        t('tenant.tab_contract'), t('tenant.btn_chat_admin')
      ],
    },
  ];

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="container">
        <nav className="home-nav">
          <div className="home-nav__brand">
            <span className="home-nav__logo">🏠</span>
            <span className="home-nav__title">{t('home.brand')}</span>
          </div>
          <div className="home-nav__actions">
            <button
              onClick={toggleLanguage}
              className="home-nav__btn-lang"
              title={i18n.language === 'vi' ? 'Switch to English' : 'Đổi sang Tiếng Việt'}
            >
              {i18n.language === 'vi' ? '🇺🇸 EN' : '🇻🇳 VI'}
            </button>
            <Link to="/login" className="home-nav__btn-login">{t('home.login')}</Link>
            <Link to="/login?mode=register&role=USER" className="home-nav__btn-register">{t('home.register_free')}</Link>
          </div>
        </nav>

        <section className="hero">
          <div className="hero__content">
            <div className="hero__badge">{t('home.hero_badge')}</div>
            <h1 className="hero__title" dangerouslySetInnerHTML={{ __html: t('home.hero_title') }} />
            <p className="hero__desc">{t('home.hero_desc')}</p>
            <div className="hero__cta-group">
              <Link to="/login?mode=register&role=USER" className="hero__btn-primary">{t('home.hero_btn_start')}</Link>
              <Link to="/login" className="hero__btn-secondary">{t('home.hero_btn_login')}</Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat-item">
                <div className="hero__stat-value">500+</div>
                <div className="hero__stat-label">{t('home.stat_users')}</div>
              </div>
              <div className="hero__stat-item">
                <div className="hero__stat-value">3,200+</div>
                <div className="hero__stat-label">{t('home.stat_rooms')}</div>
              </div>
              <div className="hero__stat-item">
                <div className="hero__stat-value">98%</div>
                <div className="hero__stat-label">{t('home.stat_satisfaction')}</div>
              </div>
            </div>
          </div>

          <div className="hero__image-wrap">
            <div className="hero__float-card hero__float-card--tl">
              <div className="hero__float-value">🟢 24</div>
              <div className="hero__float-label">{t('home.float_empty_rooms')}</div>
            </div>
            <img src={heroImg} alt="Apartment illustration" className="hero__image" />
            <div className="hero__float-card hero__float-card--br">
              <div className="hero__float-value">💰 +12%</div>
              <div className="hero__float-label">{t('home.float_revenue_growth')}</div>
            </div>
          </div>
        </section>
      </div>

      <section className="features">
        <div className="container">
          <div className="features__label">{t('home.features_label')}</div>
          <h2 className="features__title">{t('home.features_title')}</h2>
          <div className="features__grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s`, animation: 'fadeIn 0.4s ease both' }}>
                <div className={`feature-card__icon feature-card__icon--${f.color}`}>{f.icon}</div>
                <div className="feature-card__title">{f.title}</div>
                <div className="feature-card__desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <section className="roles">
          <div className="roles__inner">
            <h2 className="roles__title">{t('home.roles_title')}</h2>
            <div className="roles__grid">
              {ROLES_LIST.map((r, i) => (
                <div key={i} className="role-card" onClick={() => navigate(`/login?mode=register&role=${r.role}`)} style={{ animationDelay: `${i * 0.1}s`, animation: 'fadeIn 0.4s ease both' }}>
                  <span className="role-card__emoji">{r.emoji}</span>
                  <div className="role-card__title">{r.title}</div>
                  <div className="role-card__desc">{r.desc}</div>
                  <ul className="role-card__perks">
                    {r.perks.map((p, j) => (<li key={j} className="role-card__perk">{p}</li>))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2 className="cta-section__title">{t('home.cta_ready')}</h2>
          <Link to="/login?mode=register" className="cta-section__btn">{t('home.cta_btn')}</Link>
        </section>

        <footer className="home-footer">
          <div className="home-footer__grid">
            {/* Column 1: Brand Info */}
            <div className="home-footer__col">
              <div className="home-footer__brand">
                <span className="home-footer__logo">🏠</span>
                <span className="home-footer__title">{t('home.brand')}</span>
              </div>
              <p className="home-footer__desc">
                {t('footer.desc_home')}
              </p>
              <div className="home-footer__socials">
                <a href="#facebook" className="home-footer__social-btn" title="Facebook">📘</a>
                <a href="#instagram" className="home-footer__social-btn" title="Instagram">📷</a>
                <a href="#twitter" className="home-footer__social-btn" title="Twitter">🐦</a>
                <a href="#linkedin" className="home-footer__social-btn" title="LinkedIn">💼</a>
              </div>
            </div>

            {/* Column 2: Features */}
            <div className="home-footer__col">
              <h3 className="home-footer__col-title">{t('footer.col_features')}</h3>
              <ul className="home-footer__list">
                <li><a href="#features" className="home-footer__list-link">{t('footer.feature_rooms')}</a></li>
                <li><a href="#features" className="home-footer__list-link">{t('footer.feature_contract')}</a></li>
                <li><a href="#features" className="home-footer__list-link">{t('footer.feature_utility')}</a></li>
                <li><a href="#features" className="home-footer__list-link">{t('footer.feature_stats')}</a></li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div className="home-footer__col">
              <h3 className="home-footer__col-title">{t('footer.col_care')}</h3>
              <ul className="home-footer__list">
                <li><a href="#faq" className="home-footer__list-link">{t('footer.care_faq')}</a></li>
                <li><a href="#guide" className="home-footer__list-link">{t('footer.care_guide')}</a></li>
                <li><a href="#terms" className="home-footer__list-link">{t('footer.care_terms')}</a></li>
                <li><a href="#privacy" className="home-footer__list-link">{t('footer.care_privacy')}</a></li>
              </ul>
            </div>

            {/* Column 4: Contact info */}
            <div className="home-footer__col">
              <h3 className="home-footer__col-title">{t('footer.col_contact')}</h3>
              <ul className="home-footer__list">
                <li className="home-footer__contact-item">{t('footer.contact_address')}</li>
                <li className="home-footer__contact-item">{t('footer.contact_hotline')}</li>
                <li className="home-footer__contact-item">✉️ Email: contact@smartrental.vn</li>
                <li className="home-footer__contact-item">{t('footer.contact_version')}</li>
              </ul>
            </div>
          </div>

          <div className="home-footer__bottom">
            <div className="home-footer__copy">{t('home.footer_copy') || '© 2026 Smart Room Rental.'}</div>
            <div className="home-footer__links">
              <Link to="/login" className="home-footer__link">{t('home.footer_login')}</Link>
              <Link to="/login?mode=register" className="home-footer__link">{t('home.footer_register')}</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
