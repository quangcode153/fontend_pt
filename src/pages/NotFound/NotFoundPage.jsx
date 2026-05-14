/**
 * NotFoundPage.jsx — Trang 404
 * Hiển thị khi người dùng truy cập vào đường dẫn không tồn tại
 */
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-code">404</div>
        <div className="notfound-emoji">🏚️</div>
        <h1 className="notfound-title">Trang không tìm thấy</h1>
        <p className="notfound-desc">
          Có vẻ như căn phòng bạn tìm kiếm đã được thuê rồi,
          hoặc đường dẫn này không tồn tại!
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn--primary">
            🏠 Về Trang chủ
          </Link>
          <Link to="/login" className="notfound-btn notfound-btn--secondary">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
