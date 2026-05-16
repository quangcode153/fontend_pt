import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

import loginBg from '../../assets/login-bg.png';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register') {
      setIsRegistering(true);
      const roleParam = params.get('role');
      if (roleParam === 'LANDLORD' || roleParam === 'USER') {
        setRole(roleParam);
      }
    } else {
      setIsRegistering(false);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (password !== confirmPassword) throw new Error(t('login.error_password_match'));
        await api.post('/tai-khoan/register', { username, password, role });
        alert(t('login.success_register'));
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const loginRes = await api.post('/tai-khoan/login', { username, password });
        const { token } = loginRes.data;
        if (!token) throw new Error(t('login.error_no_token'));

        localStorage.setItem('token', token);
        const userRes = await api.get('/tai-khoan/me');
        loginSuccess(token, userRes.data);
        setTimeout(() => navigate('/', { replace: true }), 0);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || err.message || t('login.error_server'));
      if (!isRegistering) localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegistering(v => !v);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <img src={loginBg} alt="Luxury Apartment" className="auth-hero__img" />

        <div className="auth-hero__content">
          <div className="auth-hero__logo"></div>
          <h1 className="auth-hero__title">
            {t('login.hero_title')}
          </h1>
          <p className="auth-hero__subtitle">
            {t('login.hero_subtitle')}
          </p>
        </div>

        <div className="auth-hero__footer">
          {t('login.footer_copy')}
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-header__title">
              {isRegistering ? t('login.title_register') : t('login.title_login')}
            </h2>
            <p className="auth-header__subtitle">
              {isRegistering ? t('login.subtitle_register') : t('login.subtitle_login')}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('login.username')}</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t('login.username_ph')}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('login.password')}</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {isRegistering && (
              <>
                <div className="form-group">
                  <label className="form-label">{t('login.confirm_password')}</label>
                  <input
                    className="form-input"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('login.who_are_you')}</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="USER">{t('login.role_user')}</option>
                    <option value="LANDLORD">{t('login.role_landlord')}</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? t('login.btn_processing') : isRegistering ? t('login.btn_register') : t('login.btn_login')}
            </button>

            {error && (
              <div className="alert alert--error" style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span> {error}
              </div>
            )}
          </form>

          <div className="auth-footer">
            {isRegistering ? t('login.have_account') : t('login.no_account')}
            <span className="auth-footer__link" onClick={switchMode}>
              {isRegistering ? t('login.btn_login') : t('login.btn_register')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}