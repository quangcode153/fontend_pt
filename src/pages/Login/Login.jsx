import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

// Use the newly copied background image
import loginBg from '../../assets/login-bg.png';
import './Login.css';

export default function Login() {
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

  // Tự động chuyển sang mode Register nếu URL có ?mode=register
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register') {
      setIsRegistering(true);
      // Lấy role từ URL nếu có
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
        if (password !== confirmPassword) throw new Error('Mật khẩu nhập lại không khớp!');
        await api.post('/tai-khoan/register', { username, password, role });
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const loginRes = await api.post('/tai-khoan/login', { username, password });
        const { token } = loginRes.data;
        if (!token) throw new Error('Không nhận được mã xác thực từ máy chủ!');

        localStorage.setItem('token', token);
        const userRes = await api.get('/tai-khoan/me');
        loginSuccess(token, userRes.data);
        setTimeout(() => navigate('/', { replace: true }), 0);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ!');
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
      {/* Left Side: Hero Image & Branding */}
      <div className="auth-hero">
        <img src={loginBg} alt="Luxury Apartment" className="auth-hero__img" />

        <div className="auth-hero__content">
          <div className="auth-hero__logo"></div>
          <h1 className="auth-hero__title">
            Tìm kiếm không gian sống lý tưởng
          </h1>
          <p className="auth-hero__subtitle">
            Hệ thống quản lý phòng trọ thông minh, kết nối trực tiếp giữa chủ nhà và người thuê với trải nghiệm tuyệt vời nhất.
          </p>
        </div>

        <div className="auth-hero__footer">
          &copy; 2026 Hệ Thống Quản Lý Trọ. All rights reserved.
        </div>
      </div>

      {/* Right Side: Authentication Form */}
      <div className="auth-content">
        {/* Added inline style background for mobile responsiveness as fallback */}
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-header__title">
              {isRegistering ? 'Tạo tài khoản mới' : 'Chào mừng trở lại'}
            </h2>
            <p className="auth-header__subtitle">
              {isRegistering
                ? 'Vui lòng điền thông tin để đăng ký thành viên'
                : 'Đăng nhập vào tài khoản của bạn để tiếp tục'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
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
                  <label className="form-label">Nhập lại mật khẩu</label>
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
                  <label className="form-label">Bạn là ai?</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="USER">Khách tìm thuê trọ</option>
                    <option value="LANDLORD">Chủ nhà trọ</option>
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
              {loading ? 'Đang xử lý...' : isRegistering ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>

            {error && (
              <div className="alert alert--error" style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span> {error}
              </div>
            )}
          </form>

          <div className="auth-footer">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <span className="auth-footer__link" onClick={switchMode}>
              {isRegistering ? 'Đăng nhập' : 'Đăng ký ngay'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}