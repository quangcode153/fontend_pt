# 🏠 Smart Room Rental — Hệ thống Quản lý Phòng trọ Thông minh

> **Stack:** Spring Boot 3 · React 18 · JWT · MySQL · WebSocket
> **Mindset:** Tài liệu tập trung vào Trạng thái + Hành động + Vấn đề + Ranh giới hệ thống.

---

## 🎯 Mục tiêu dự án

Số hóa toàn bộ vòng đời vận hành nhà trọ — từ khi khách tìm phòng đến khi thanh toán hóa đơn hàng tháng — thay thế hoàn toàn quy trình giấy tờ, tin nhắn thủ công và tính tiền bằng tay.

---

## 👥 Đối tượng người dùng

| Role | Mô tả | Quyền chính |
|---|---|---|
| `ROLE_ADMIN` | Quản trị viên hệ thống | Toàn quyền: khóa TK, xem khiếu nại, xem tất cả khu trọ |
| `ROLE_LANDLORD` | Chủ nhà trọ | Quản lý phòng, duyệt hợp đồng, chốt điện nước |
| `ROLE_USER` | Khách đang thuê | Xem HĐ, chat chủ trọ, xem hóa đơn, gửi khiếu nại |
| Guest | Khách vãng lai (chưa có HĐ) | Tìm phòng, đăng ký tài khoản, gửi yêu cầu thuê |

---

## ✨ Tính năng hiện có

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Authentication & JWT | ✅ Hoàn thiện | Stateless, localStorage |
| Phân quyền UI theo Role | ✅ Hoàn thiện | ProtectedRoute, role-based render |
| CRUD Phòng trọ | ✅ Hoàn thiện | Auto-đổi trạng thái khi HĐ duyệt |
| Quản lý Hợp đồng | ✅ Hoàn thiện | Workflow: CHO_DUYET → DA_DUYET / TU_CHOI |
| Chat Realtime | ✅ Hoàn thiện | WebSocket STOMP + Optimistic UI |
| Hồ sơ cá nhân | ✅ Hoàn thiện | Validate CCCD + SĐT trước khi thuê |
| Khiếu nại | ✅ Hoàn thiện | Gửi → Admin xử lý → Đánh dấu hoàn thành |
| Quản lý người dùng | ✅ Hoàn thiện | Admin khóa/mở khóa tài khoản |
| Nâng cấp UI | ✅ Hoàn thiện | Design system thống nhất, lazy loading |
| Điện nước & Hóa đơn | 🔄 Đang làm | BE xong, FE chưa có UI form nhập |
| Dashboard thống kê | ⏭️ Kế hoạch | Biểu đồ doanh thu Recharts |
| Push Notification | ⏭️ Kế hoạch | Thông báo realtime khi có sự kiện |

---

## 🚀 Khởi chạy dự án

### Backend
```bash
# Yêu cầu: Java 17+, MySQL đang chạy
mvn spring-boot:run
# → http://localhost:8080
```

### Frontend
```bash
npm install
npm run dev
# → http://localhost:5173
```

### Cấu hình `application.properties`
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/phongtro_db
spring.datasource.username=root
spring.datasource.password=your_password
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000
```

---

## 📁 Cấu trúc thư mục

```
src/
├── main.jsx                    ← Entry point, wrap BrowserRouter > AuthProvider > App
├── App.jsx                     ← Routes + AppContent (ProtectedRoute)
├── Login.jsx                   ← Đăng nhập / Đăng ký
├── constants.js                ← Source of Truth: ROLES, ROOM_STATUS, CONTRACT_STATUS
├── api.js                      ← Axios singleton + Interceptor (token + 401/403)
├── context/
│   └── AuthContext.jsx         ← Global auth state, fetchMe, loginSuccess, logout
├── hooks/
│   ├── useAuth.js              ← Wrapper useContext(AuthContext)
│   ├── useAdminContact.js      ← Lấy thông tin Admin để chat CSKH
│   └── usePhongTro.js          ← (nếu có) Custom hook danh sách phòng
├── pages/
│   ├── AdminPage.jsx
│   ├── LandlordPage.jsx
│   ├── TenantPage.jsx
│   └── GuestPage.jsx
├── components/
│   ├── Header.jsx
│   ├── ChatBox.jsx             ← WebSocket STOMP + Optimistic UI
│   ├── HoSoForm.jsx
│   ├── KhieuNaiForm.jsx
│   └── QuanLyNguoiDung.jsx
└── services/
    └── apiService.js           ← Tập trung các API call theo domain
```
