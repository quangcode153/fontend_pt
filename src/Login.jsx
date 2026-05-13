import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import api from './api';

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

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color var(--transition)',
  };

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.03em',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'var(--font)',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        padding: '36px 32px',
        animation: 'fadeInUp 0.4s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🏠</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {isRegistering ? 'Tạo tài khoản' : 'Đăng nhập'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {isRegistering ? 'Điền thông tin bên dưới để bắt đầu' : 'Hệ thống quản lý phòng trọ thông minh'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Tên đăng nhập</label>
            <input style={inputStyle} type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nhập tên đăng nhập" required autoFocus />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Mật khẩu</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {isRegistering && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nhập lại mật khẩu</label>
                <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Vai trò</label>
                <select style={inputStyle} value={role} onChange={e => setRole(e.target.value)}>
                  <option value="USER">Khách tìm thuê trọ</option>
                  <option value="LANDLORD">Chủ nhà trọ</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px', borderRadius: 'var(--radius-md)',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: 600, marginTop: '4px',
            background: loading ? 'var(--border)' : 'var(--text-primary)',
            color: '#fff', transition: 'all var(--transition)',
          }}>
            {loading ? 'Đang xử lý...' : isRegistering ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>

          {error && (
            <div style={{
              marginTop: '14px', padding: '10px 14px',
              background: 'var(--danger-light)', border: '1px solid #FECACA',
              borderRadius: 'var(--radius-md)', color: 'var(--danger)',
              fontSize: '13px', textAlign: 'center',
              animation: 'fadeIn 0.2s ease',
            }}>
              {error}
            </div>
          )}
        </form>

        <div style={{ height: '1px', background: 'var(--border-light)', margin: '24px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          <span onClick={switchMode} style={{
            color: 'var(--accent)', cursor: 'pointer', fontWeight: 600,
            marginLeft: '4px', transition: 'opacity var(--transition)',
          }}>
            {isRegistering ? 'Đăng nhập' : 'Đăng ký'}
          </span>
        </div>
      </div>
    </div>
  );
}