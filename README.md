# V0 TECH — Quản lý cửa hàng & bán hàng trực tuyến

Ứng dụng Node.js/Express + MySQL 8, cổng web **3009**. Hai giao diện đã được nối cùng database `v0_store` và giữ phong cách, hình ảnh của dự án gốc.

- Khách hàng: http://localhost:3009/ (hoặc `/index3.html`).
- Quản lý cửa hàng: http://localhost:3009/manager.html.
- Trạng thái chi tiết và phần đang phát triển: [CHUC_NANG.md](CHUC_NANG.md).
- Kịch bản chạy thử: [KIEM_THU.md](KIEM_THU.md).

## Khởi động trên Windows

Yêu cầu Node.js 20.19+ và MySQL 8.0+ đang chạy. Cổng MySQL là **3306** mặc định; cổng **3009 là của website**, không phải của MySQL.

```powershell
cd C:\Users\...
npm.cmd install
Copy-Item .env.example .env   # Chỉ thực hiện nếu chưa có .env
# Điền DB_PASSWORD trong .env bằng mật khẩu MySQL của bạn
npm.cmd run db:setup
npm.cmd start
```

Trong lần thiết lập này `.env` đã được cấu hình với MySQL local và database đã được tạo. Không chạy lệnh Copy-Item để ghi đè `.env` hiện có. Mật khẩu MySQL chỉ nằm trong `.env` (đã bỏ qua trong Git); không đặt mật khẩu vào mã giao diện.

`db:setup` tạo schema nếu thiếu và chỉ seed khi bảng users chưa có dữ liệu. Chạy lại không xóa/reset dữ liệu đang dùng. Tài khoản MySQL cần quyền tạo database, bảng và đọc/ghi; khi triển khai nên dùng user MySQL riêng có quyền giới hạn thay cho root.

```powershell
npm.cmd run dev  # Tự khởi động lại backend khi thay đổi mã
npm.cmd test     # Test nghiệp vụ và tích hợp với MySQL thật
```

Test tạo database riêng `v0_store_test_<pid>`, chạy server ở cổng 3010 và xóa đúng database đó sau test. Không reset database `v0_store`. Cần quyền CREATE/DROP DATABASE và cổng 3010 trống.

## Tài khoản kiểm thử

Mật khẩu chung của **các tài khoản ứng dụng bên dưới**: `Demo@12345` (khác mật khẩu MySQL).

| Email | Vai trò | Phạm vi |
|---|---|---|
| manager.q1@v0tech.vn | Quản lý | V0 TECH Quận 1 |
| manager.td@v0tech.vn | Quản lý | V0 TECH Thủ Đức |
| nam@example.com | Khách hàng | Đơn của Phạm Hoàng Nam |
| ha@example.com | Khách hàng | Đơn của Võ Thanh Hà |

Có thể mở đồng thời khách hàng và quản lý trong hai tab cùng trình duyệt: hai vai trò dùng cookie phiên riêng. Hai tài khoản cùng vai trò vẫn chia sẻ phiên; dùng cửa sổ riêng tư nếu cần thử hai khách hàng hoặc hai quản lý cùng lúc. Tài khoản demo, tên, địa chỉ, giá và tồn là dữ liệu kiểm thử có cấu trúc; **không phải dữ liệu giao dịch thật của doanh nghiệp**. Mọi thao tác mới đều được lưu thật trong MySQL và tồn tại sau khi tải lại/khởi động lại.

## Dữ liệu & quy tắc

Hai cửa hàng dùng chung 10 sản phẩm, danh mục, thương hiệu và chương trình WELCOME10. Q1SALE chỉ áp dụng tại Quận 1. SSD ở Quận 1 hết hàng nhưng ở Thủ Đức còn hàng để kiểm tra luồng chọn cửa hàng.

Các đơn `DH-SEED-001` và `DH-SEED-003` đã hoàn tất để thử báo cáo và trả hàng; `DH-SEED-002` đang chờ xử lý tại Quận 1. Giá bán và thông số là dữ liệu đại diện của giao diện cũ, không cam kết giá thị trường hiện tại.

- Máy chủ tự xác định cửa hàng từ tài khoản quản lý; không tin store_id do trình duyệt gửi cho nghiệp vụ quản lý.
- Giá, giảm giá và tổng tiền được tính lại ở backend từ danh mục chung.
- Đặt hàng giữ/trừ **tồn khả dụng** ngay trong transaction với khóa dòng `FOR UPDATE`; không trừ lần hai khi chuyển trạng thái.
- Duyệt hủy/trả toàn đơn hoàn tồn một lần trong transaction và lưu lịch sử.
- Đơn phải có nhân viên phụ trách mới được xác nhận; chỉ hoàn tất sau khi thu đủ tiền được quản lý xác nhận.
- Nhận tại cửa hàng: Chờ xác nhận → Đã xác nhận → Đang chuẩn bị → Sẵn sàng nhận → Hoàn tất.
- Giao hàng: Chờ xác nhận → Đã xác nhận → Đang chuẩn bị → Đang giao → Hoàn tất.
- Chặn chuyển sai bước, sửa đơn đã kết thúc và xử lý lặp yêu cầu đã duyệt.
- Yêu cầu hủy đang chờ duyệt sẽ chặn tiếp tục xử lý đơn đến khi quản lý duyệt/từ chối.
- Doanh thu/hoa hồng tính trên đơn hoàn tất, lọc theo ngày tạo đơn. Đơn trả hàng bị loại. Tỷ lệ hoa hồng chốt lúc phân công. Đây không phải sổ kế toán theo ngày ghi nhận doanh thu/hoàn tiền.
- Hạng thành viên: dưới 10 triệu = Thành viên, từ 10 triệu = Vàng, từ 30 triệu = Kim cương. Tính từ đơn hoàn tất, không tự cộng ưu đãi hạng.
- Tiền mặt và chuyển khoản được quản lý đối soát thủ công. Chưa kết nối ngân hàng/cổng thanh toán; `refunded` là ghi nhận đã xử lý hoàn tiền ngoài hệ thống.

## Cấu trúc mã nguồn

| File | Mục đích |
|---|---|
| server.js | API, session, kiểm tra quyền, transaction nghiệp vụ, phục vụ tệp public theo danh sách cho phép |
| backend/db.js | Kết nối MySQL và transaction |
| backend/domain.js | Hash mật khẩu, kiểm tra dữ liệu, quy tắc trạng thái và hạng |
| database/schema.sql | Schema, khóa ngoại, ràng buộc tồn không âm |
| scripts/setup-db.js | Tạo database và seed lần đầu |
| client.js | Tiện ích giao diện, API, đăng nhập/đăng ký, modal và lịch sử đơn |
| selling-app.js / index3.html | Trang khách hàng đã nối backend |
| manager-app.js / manager.html | Trang quản lý đã nối backend |
| live.css | Giao diện chức năng mới và màn hình nhỏ |
| tests/ | Test nghiệp vụ và tích hợp MySQL |

Các file `admin.html`, `admin.js`, `app1.js`, `app3.js`, `style1.css` cũ được giữ để tham khảo. `manager.html` và `index3.html` không còn dùng các script demo này. `admin.html` cũ vẫn là demo localStorage, **chưa phải trang quản trị công ty đã nối MySQL**.

## Database

Các bảng: `stores`, `users`, `sessions`, `categories`, `brands`, `products`, `inventory`, `staff`, `promotions`, `orders`, `order_items`, `order_history`, `service_requests`, `replenishments`, `inventory_movements`.

Quan hệ chính: công ty có danh mục sản phẩm dùng chung; `(store_id, product_id)` xác định tồn từng cửa hàng; đơn thuộc khách và cửa hàng, có nhân viên phụ trách; chi tiết đơn lưu tên/giá tại thời điểm mua; lịch sử ghi người xử lý. Khuyến mãi có `store_id = NULL` là chương trình công ty (quản lý cửa hàng chỉ xem).

Mật khẩu ứng dụng được hash bằng scrypt với salt riêng; session lưu ở MySQL, cookie HttpOnly/SameSite=Lax, hạn 7 ngày; giới hạn lượt đăng nhập theo IP và kiểm tra Origin với thao tác ghi. Trước khi đưa lên Internet cần cấu hình HTTPS, tài khoản vận hành, xoay mật khẩu demo, backup và đối soát thanh toán thực tế.

## API chính

| Nhóm | Endpoint |
|---|---|
| Sức khỏe | GET /api/health |
| Đăng nhập, đăng ký, đăng xuất | POST /api/auth/login, /register, /logout |
| Phiên hiện tại / hạng | GET /api/me |
| Danh mục, tồn, khuyến mãi | GET /api/catalog?store=1 |
| Đơn hàng | GET/POST /api/orders |
| Khách yêu cầu hủy/trả | POST /api/orders/:id/requests |
| Dữ liệu cửa hàng | GET /api/manager/data |
| Phân công, trạng thái, thu tiền | PATCH /api/manager/orders/:id |
| Duyệt/từ chối hủy/trả | POST /api/manager/requests/:id/resolve |
| Tồn, bổ sung, nhân viên, khuyến mãi | POST /api/manager/inventory, /replenishments, /staff, /promotions |
| Báo cáo | GET /api/manager/reports?from=2026-01-01&to=2026-12-31 |

## Xử lý lỗi thường gặp

- `ECONNREFUSED`: mở dịch vụ MySQL80, kiểm tra DB_HOST/DB_PORT.
- `ER_ACCESS_DENIED_ERROR`: kiểm tra user và mật khẩu trong .env.
- `EADDRINUSE`: cổng 3009 đang có tiến trình khác; dừng phiên server cũ trước khi chạy.
- Trang báo lỗi dữ liệu: chạy `npm.cmd run db:setup`, kiểm tra MySQL, rồi bấm Làm mới.
- Không mở HTML trực tiếp bằng `file://`; luôn mở qua http://localhost:3009.
