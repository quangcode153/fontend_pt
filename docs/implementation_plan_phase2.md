# Kế hoạch Tái Cấu Trúc Frontend - Phase 2 (Phân chia Component & Bổ sung Chức năng)

Sau khi phân tích kỹ file API (`api.md`) từ backend, hệ thống của chúng ta có rất nhiều module (Phòng trọ, Hợp đồng, Điện nước, Hóa đơn, Tin nhắn, Khiếu nại, Thông báo). Nếu nhét tất cả vào 1 file `LandlordPage.jsx` hay `TenantPage.jsx` thì file đó sẽ dài hàng ngàn dòng, cực kỳ khó bảo trì.

Vì vậy, mình đề xuất một cấu trúc **Folder theo Role (Vai trò)** và bên trong chia thành các **Component con theo Tính năng (Feature)**.

## Phạm vi công việc (Phase 2)

### 1. Tổ chức lại cấu trúc thư mục toàn diện
Mình sẽ phân tách toàn bộ hệ thống thành cấu trúc chuẩn như sau:

```text
src/
 ├── pages/
 │    ├── Login/
 │    │    ├── Login.jsx       (Giao diện)
 │    │    └── Login.css       (Style)
 │    │
 │    ├── Guest/ (Dành cho Khách vãng lai tìm trọ)
 │    │    ├── GuestPage.jsx   
 │    │    └── GuestPage.css   
 │    │
 │    ├── Tenant/ (Dành cho Khách đã có hợp đồng thuê)
 │    │    ├── TenantPage.jsx
 │    │    ├── TenantPage.css
 │    │    └── components/
 │    │         ├── InvoiceList.jsx      (Xem hóa đơn)
 │    │         └── AnnouncementList.jsx (Xem bảng tin)
 │    │
 │    ├── Landlord/ (Dành cho Chủ trọ)
 │    │    ├── LandlordPage.jsx
 │    │    ├── LandlordPage.css
 │    │    └── components/
 │    │         ├── RoomManagement.jsx       (Quản lý phòng trọ)
 │    │         ├── ContractManagement.jsx   (Duyệt hợp đồng)
 │    │         ├── UtilityManagement.jsx    (Chốt điện nước)
 │    │         ├── InvoiceManagement.jsx    (Quản lý hóa đơn)
 │    │         └── AnnouncementManager.jsx  (Đăng thông báo)
 │    │
 │    └── Admin/ (Dành cho Quản trị viên)
 │         ├── AdminPage.jsx
 │         ├── AdminPage.css
 │         └── components/
 │              ├── AccountManagement.jsx    (Khóa/Mở khóa User)
 │              └── ComplaintManagement.jsx  (Xử lý khiếu nại)
 │
 ├── components/ (Các UI Component dùng chung toàn app)
 │    ├── Header/
 │    │    ├── Header.jsx
 │    │    └── Header.css
 │    ├── ChatBox/
 │    │    ├── ChatBox.jsx
 │    │    └── ChatBox.css
 │    └── GlobalForm/ (Ví dụ: KhieuNaiForm, HoSoForm)
```

### 2. Tách CSS từ file tổng (`index.css`)
- Giữ lại `index.css` làm nơi chứa **biến màu sắc toàn cục, font chữ, base UI** (như `.btn`, `.card`, layout auth-page).
- Chuyển logic CSS chuyên biệt vào từng file `.css` trong thư mục tương ứng.

### 3. Cập nhật & Mapping Code
- Cập nhật lại đường dẫn `import` trong `App.jsx` để kết nối đúng các trang mới.
- Chuyển code hiện hành từ các file `*Page.jsx` cũ vào thư mục mới tương ứng, đảm bảo mọi thứ vẫn hoạt động mượt mà.

---

> [!IMPORTANT]
> **User Review Required**
> - Bạn thấy cấu trúc phân bổ chi tiết tới từng `components/` của mỗi Role (Landlord, Tenant, Admin) như trên đã đầy đủ theo Backend chưa? 
> - Nếu bạn OK với "bản đồ" này, mình sẽ dùng script để cấu trúc lại thư mục ngay nhé!

## Verification Plan
1. Chạy lại dự án.
2. Kiểm tra không có lỗi `Module not found`.
3. Kiểm tra App vẫn hoạt động bình thường như cũ, nhưng dưới vỏ bọc cấu trúc thư mục siêu gọn gàng.
