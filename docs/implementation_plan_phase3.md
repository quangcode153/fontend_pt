# Kế hoạch Tái Cấu Trúc & Nâng cấp Giao diện - Phase 3 (Component Splitting & Premium UI)

Sau khi đã tổ chức xong thư mục ở Phase 2, Phase 3 sẽ tập trung vào việc **"Chia nhỏ để trị"** các file JSX khổng lồ và nâng cấp giao diện bên trong các trang quản lý.

## Mục tiêu chính
1. **Tách Component:** Chuyển các khối giao diện lớn (Danh sách phòng, Hóa đơn, Thống kê) thành các file JSX riêng trong thư mục `components/` của từng trang.
2. **Chuyển đổi Style:** Thay thế toàn bộ Inline Styles (`const S = { ... }`) bằng CSS Class (BEM) trong các file `.css` đã tạo.
3. **Đồng bộ Giao diện Premium:** Áp dụng hệ màu, font chữ và hiệu ứng của trang Login vào các trang nội bộ (Admin, Landlord, Tenant).

---

## Lộ trình thực hiện

### 1. Module hóa trang Chủ trọ (Landlord) - [ƯU TIÊN]
File `LandlordPage.jsx` đang quá lớn (580+ dòng). Chúng ta sẽ tách ra:
- `StatCards.jsx`: Hiển thị 3 thẻ thông báo doanh thu, tỷ lệ lấp đầy, tiền nợ.
- `RevenueChart.jsx`: Hiển thị biểu đồ doanh thu hàng tháng.
- `RoomManagement.jsx`: Quản lý danh sách phòng và thêm phòng mới.
- `ContractSection.jsx`: Duyệt các yêu cầu thuê phòng.
- `InvoiceManager.jsx`: Quản lý hóa đơn và chốt điện nước.

### 2. Module hóa trang Khách thuê (Tenant)
Tách các phần:
- `ContractInfo.jsx`: Thông tin hợp đồng hiện tại.
- `InvoiceHistory.jsx`: Danh sách hóa đơn và thanh toán QR.
- `NoticeBoard.jsx`: Xem thông báo từ chủ trọ.

### 3. Module hóa trang Admin
Tách các phần:
- `UserControl.jsx`: Quản lý tài khoản (Khóa/Mở khóa).
- `ComplaintList.jsx`: Xử lý các khiếu nại của người dùng.

### 4. Hoàn thiện Logic Backend
- Đảm bảo các API Thống kê và Tin nhắn hoạt động mượt mà với giao diện mới.

---

> [!IMPORTANT]
> **User Review Required**
> - Bạn có muốn ưu tiên làm trang **Landlord (Chủ nhà)** trước không? Đây là phần có nhiều tính năng nhất.
> - Sau khi tách file, code của bạn sẽ cực kỳ dễ đọc: file chính chỉ còn khoảng 100 dòng thay vì 600 dòng như hiện tại.

## Verification Plan
1. Kiểm tra chức năng chuyển Tab (Tab Switching) vẫn hoạt động đúng.
2. Kiểm tra dữ liệu từ API vẫn hiển thị chính xác sau khi truyền qua các Component con (Props).
3. Kiểm tra giao diện Responsive trên Mobile cho các bảng dữ liệu.
