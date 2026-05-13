import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import api from './api';

import Header from './components/Header';
import Login from './Login';
import AdminPage from './pages/AdminPage';
import LandlordPage from './pages/LandlordPage';
import GuestPage from './pages/GuestPage';
import TenantPage from './pages/TenantPage';
import ChatBox from './components/ChatBox';
import { ROLES } from './constants';

function LoadingScreen({ message = 'Đang tải...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)',
    }}>
      <div style={{
        width: '28px', height: '28px', border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.6s linear infinite', marginBottom: '16px',
      }} />
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{message}</div>
    </div>
  );
}

function WaitingScreen({ hopDong, onOpenChat }) {
  return (
    <div style={{
      maxWidth: '440px', margin: '60px auto',
      background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border)',
      padding: '40px 32px', textAlign: 'center',
      animation: 'fadeInUp 0.4s ease',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'var(--warning-light)', margin: '0 auto 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
      }}>⏳</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        Yêu cầu đang chờ duyệt
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
        Phòng: <strong>{hopDong.phongTro?.tenPhong}</strong>
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
        Chủ trọ sẽ phản hồi sớm nhất có thể.
      </div>
      <button
        onClick={onOpenChat}
        style={{
          padding: '10px 24px', borderRadius: 'var(--radius-md)', border: 'none',
          background: 'var(--accent)', color: '#fff', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600, transition: 'opacity var(--transition)',
        }}
      >
        💬 Nhắn tin chủ trọ
      </button>
    </div>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const [hopDongCuaToi, setHopDongCuaToi] = useState(null);
  const [dangKiemTra, setDangKiemTra] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const kiemTraHopDong = async (isBackground = false) => {
    if (user?.role !== ROLES.USER) return;
    if (!isBackground && isMounted.current) setDangKiemTra(true);

    try {
      const res = await api.get(`/hop-dong/khach/${user.id}`);
      if (isMounted.current) {
        const hd = (res.data || []).find(
          h => h.trangThai === 'DA_DUYET' || h.trangThai === 'CHO_DUYET'
        );
        setHopDongCuaToi(hd || null);
      }
    } catch (err) {
      console.error('Lỗi kiểm tra hợp đồng:', err);
    } finally {
      if (!isBackground && isMounted.current) setDangKiemTra(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    kiemTraHopDong(false);
    const interval = setInterval(() => kiemTraHopDong(true), 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleOpenChat = () => {
    const chuTroId = hopDongCuaToi?.phongTro?.chuTroId ?? hopDongCuaToi?.phongTro?.chuTro?.id;
    if (!chuTroId) {
      alert('Không tìm thấy thông tin chủ trọ!');
      return;
    }
    setChatTarget({
      id: chuTroId,
      username: `Chủ trọ phòng ${hopDongCuaToi.phongTro?.tenPhong}`,
    });
  };

  const rawRole = user?.role || '';
  const normalizedRole = rawRole.startsWith('ROLE_') ? rawRole : `ROLE_${rawRole}`;

  const renderContent = () => {
    if (normalizedRole === ROLES.ADMIN) return <AdminPage currentUser={user} />;
    if (normalizedRole === ROLES.LANDLORD) return <LandlordPage currentUser={user} />;

    if (normalizedRole === ROLES.USER) {
      if (dangKiemTra) {
        return (
          <div style={{
            textAlign: 'center', padding: '60px', animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              width: '24px', height: '24px', border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.6s linear infinite', margin: '0 auto 12px',
            }} />
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Đang đồng bộ dữ liệu...</div>
          </div>
        );
      }

      if (hopDongCuaToi?.trangThai === 'DA_DUYET') {
        return <TenantPage currentUser={user} hopDongCuaToi={hopDongCuaToi} />;
      }

      if (hopDongCuaToi?.trangThai === 'CHO_DUYET') {
        return <WaitingScreen hopDong={hopDongCuaToi} onOpenChat={handleOpenChat} />;
      }

      return <GuestPage currentUser={user} onRentSuccess={() => kiemTraHopDong(false)} />;
    }

    return (
      <div style={{
        textAlign: 'center', marginTop: '60px', padding: '20px 24px',
        background: 'var(--danger-light)', border: '1px solid #FECACA',
        borderRadius: 'var(--radius-lg)', color: 'var(--danger)', fontWeight: 600,
        maxWidth: '480px', margin: '60px auto',
      }}>
        Hệ thống không nhận diện được quyền truy cập của bạn ({rawRole}).
      </div>
    );
  };

  return (
    <div className="container" style={{ fontFamily: 'var(--font)', minHeight: '100vh' }}>
      <Header user={user} onLogout={logout} />

      {dangKiemTra && (
        <div style={{
          position: 'fixed', top: '16px', right: '20px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '6px 14px', borderRadius: '999px',
          fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)',
          zIndex: 999, animation: 'fadeIn 0.2s ease',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <div style={{
            width: '12px', height: '12px', border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)', borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }} />
          Đang đồng bộ...
        </div>
      )}

      {renderContent()}

      <ChatBox
        currentUser={user}
        targetUser={chatTarget}
        isOpen={!!chatTarget}
        onClose={() => setChatTarget(null)}
      />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <LoadingScreen message="Đang xác thực phiên đăng nhập..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}