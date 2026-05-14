# 📝 Changelog — Lịch sử Phát triển

> Ghi lại các thay đổi, tính năng mới, và sửa lỗi theo thời gian để dễ dàng theo dõi quá trình phát triển của dự án.

---

## [2026-05-03] - Tính năng Cốt lõi: Điện Nước & Hóa Đơn

### Tính năng mới (Feature)
- **Chủ trọ:** Thêm tab `💰 Điện Nước` vào trang quản lý. Bổ sung Modal form chốt chỉ số điện/nước hàng tháng, tự động gọi API để xuất hóa đơn.
- **Khách thuê:** Thêm tab `🧾 Hóa đơn` vào bảng điều khiển. Tự động lấy danh sách hóa đơn từ hệ thống, hiển thị chi tiết các khoản phí và trạng thái thanh toán.

### Sửa lỗi (Hotfix)
- **Backend:** Bổ sung API `GET /api/hoa-don/me` bị thiếu trong thiết kế ban đầu. Cập nhật `HoaDonRepository`, `HoaDonService`, `HoaDonController` để khách thuê có thể lấy danh sách hóa đơn dựa trên các hợp đồng đang thuê (`DA_DUYET`).
- **Frontend:** Sửa lỗi lệch cấu trúc JSON payload gửi lên khi gọi API `POST /api/dien-nuoc/chot-so` ở `LandlordPage` (đồng bộ field theo entity `ChiSoDienNuoc.java`).

---

## [2026-05-03] - Cấu trúc lại dự án (Monorepo)

### Thay đổi kiến trúc (Refactor)
- Tách dự án thành 2 thư mục độc lập `frontend/` và `backend/` để dễ quản lý.
- Di chuyển toàn bộ mã nguồn Spring Boot, `pom.xml`, `mvnw` vào thư mục `backend/`.
- Di chuyển toàn bộ mã nguồn ReactJS (`src copy/` đổi lại thành `src/`), `package.json`, `vite.config.js` vào thư mục `frontend/`.
- Giữ các tài liệu dự án trong thư mục `docs/` ở cấp cao nhất.

---

## [2026-05-03] - Refactor & Đồng bộ kiểu dữ liệu Backend

### Sửa lỗi (Fixes)
- Khắc phục lỗi lệch kiểu dữ liệu (Type Mismatch) giữa Entity và Repository bằng cách đổi generic của `HoaDonRepository` và `KhachHangRepository` sang `Long`.
- Cập nhật tham số của phương thức xóa hóa đơn trong `HoaDonService` và `HoaDonController` từ `Integer` sang `Long` để tránh lỗi khi thao tác với ID.

### Thay đổi kiến trúc (Refactor)
- Đồng bộ kiểu dữ liệu của khóa chính (ID) từ `Integer` sang `Long` cho các Entity: `ChiSoDienNuoc`, `TinNhan`, `NhatKyHoatDong`.
- Chuyển kiểu dữ liệu các trường liên kết ID người dùng (`nguoiGuiId`, `nguoiNhanId` trong `TinNhan` và `userId` trong `NhatKyHoatDong`) sang `Long` để thống nhất với Entity `TaiKhoan`.
- Cập nhật các Repository tương ứng (`ChiSoDienNuocRepository`, `NhatKyRepository`, `TinNhanRepository`) để sử dụng `Long`.

### Khác
- Đánh dấu hoàn thành task "Refactor ID sang Long" trong `todo.md`.
