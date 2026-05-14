/**
 * HomePage.jsx — Landing Page Công khai
 * Trang chủ cho người dùng chưa đăng nhập
 */
import { Link, useNavigate } from 'react-router-dom';
import heroImg from '../../assets/hero_apartment.png';
import './HomePage.css';

/* Danh sách tính năng nổi bật */
const FEATURES = [
  {
    icon: '🏠', color: 'purple',
    title: 'Quản lý phòng trọ',
    desc: 'Thêm, sửa, xoá phòng; theo dõi trạng thái trống/đã thuê theo thời gian thực.',
  },
  {
    icon: '📄', color: 'blue',
    title: 'Hợp đồng điện tử',
    desc: 'Khách thuê gửi yêu cầu, chủ nhà duyệt chỉ với một cú click. Lưu trữ toàn bộ lịch sử.',
  },
  {
    icon: '⚡', color: 'amber',
    title: 'Chốt điện - nước',
    desc: 'Nhập chỉ số điện nước từng tháng, hệ thống tự tính tiền và xuất hóa đơn tức thì.',
  },
  {
    icon: '💬', color: 'green',
    title: 'Nhắn tin nội bộ',
    desc: 'Chat trực tiếp giữa chủ trọ và khách thuê, hoặc liên hệ Admin hỗ trợ 24/7.',
  },
  {
    icon: '📊', color: 'cyan',
    title: 'Thống kê doanh thu',
    desc: 'Biểu đồ doanh thu theo tháng, tỷ lệ lấp đầy và theo dõi các hóa đơn chưa thanh toán.',
  },
  {
    icon: '🔔', color: 'pink',
    title: 'Thông báo & Khiếu nại',
    desc: 'Chủ trọ gửi thông báo tới toàn bộ khách; khách có thể gửi khiếu nại lên Admin.',
  },
];

/* 2 nhóm vai trò cho phép đăng ký công khai */
const ROLES_LIST = [
  {
    role: 'LANDLORD',
    emoji: '🏢', title: 'Chủ Trọ',
    desc: 'Dành cho chủ nhà muốn quản lý nhiều phòng một cách chuyên nghiệp.',
    perks: ['Quản lý phòng & hợp đồng', 'Chốt điện nước & xuất hóa đơn', 'Thống kê doanh thu', 'Đăng thông báo cho khách'],
  },
  {
    role: 'USER',
    emoji: '🧑‍💼', title: 'Khách Thuê',
    desc: 'Dành cho người đang tìm thuê hoặc đang thuê phòng trọ.',
    perks: ['Tìm kiếm phòng phù hợp', 'Xem hợp đồng & hóa đơn', 'Thanh toán qua QR code', 'Gửi khiếu nại & nhắn tin chủ'],
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'var(--font)', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="container">

        {/* ============================
            NAVBAR
        ============================ */}
        <nav className="home-nav">
          <div className="home-nav__brand">
            <span className="home-nav__logo">🏠</span>
            <span className="home-nav__title">Quản Lý Trọ</span>
          </div>
          <div className="home-nav__actions">
            <Link to="/login" className="home-nav__btn-login">Đăng nhập</Link>
            {/* Mặc định đăng ký là Khách thuê nếu nhấn nút chung */}
            <Link to="/login?mode=register&role=USER" className="home-nav__btn-register">✨ Đăng ký miễn phí</Link>
          </div>
        </nav>

        {/* ============================
            HERO SECTION
        ============================ */}
        <section className="hero">
          <div className="hero__content">
            <div className="hero__badge">🚀 Nền tảng quản lý trọ #1 Việt Nam</div>
            <h1 className="hero__title">
              Quản lý nhà trọ <span className="hero__title-highlight">thông minh</span> — dễ như chơi
            </h1>
            <p className="hero__desc">
              Từ việc đăng phòng, ký hợp đồng, chốt điện nước đến thu tiền thuê — tất cả trên một nền tảng duy nhất.
            </p>
            <div className="hero__cta-group">
              <Link to="/login?mode=register&role=USER" className="hero__btn-primary">🚀 Bắt đầu miễn phí</Link>
              <Link to="/login" className="hero__btn-secondary">Đã có tài khoản →</Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat-item">
                <div className="hero__stat-value">500+</div>
                <div className="hero__stat-label">Chủ trọ tin dùng</div>
              </div>
              <div className="hero__stat-item">
                <div className="hero__stat-value">3,200+</div>
                <div className="hero__stat-label">Phòng đã quản lý</div>
              </div>
              <div className="hero__stat-item">
                <div className="hero__stat-value">98%</div>
                <div className="hero__stat-label">Hài lòng</div>
              </div>
            </div>
          </div>

          <div className="hero__image-wrap">
            <div className="hero__float-card hero__float-card--tl">
              <div className="hero__float-value">🟢 24</div>
              <div className="hero__float-label">Phòng trống hôm nay</div>
            </div>
            <img src={heroImg} alt="Apartment building illustration" className="hero__image" />
            <div className="hero__float-card hero__float-card--br">
              <div className="hero__float-value">💰 +12%</div>
              <div className="hero__float-label">Doanh thu tháng này</div>
            </div>
          </div>
        </section>
      </div>

      <section className="features">
        <div className="container">
          <div className="features__label">⚡ Tính năng nổi bật</div>
          <h2 className="features__title">Mọi thứ bạn cần, trong một ứng dụng</h2>
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
            <h2 className="roles__title">Dành cho tất cả mọi người 👥</h2>
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
          <h2 className="cta-section__title">Sẵn sàng bắt đầu?</h2>
          <Link to="/login?mode=register" className="cta-section__btn">🚀 Tạo tài khoản ngay</Link>
        </section>

        <footer className="home-footer">
          <div className="home-footer__copy">© 2024 Quản Lý Trọ. Made with ❤️ in Vietnam.</div>
          <div className="home-footer__links">
            <Link to="/login" className="home-footer__link">Đăng nhập</Link>
            <Link to="/login?mode=register" className="home-footer__link">Đăng ký</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
