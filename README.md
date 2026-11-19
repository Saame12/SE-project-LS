# V0 TECH — Phạm vi chính đồ án

Node.js/Express + MySQL 8. Website chạy cổng **3009**, MySQL mặc định **3306**.

| Giao diện | Địa chỉ | Tài khoản mẫu |
|---|---|---|
| Khách hàng | http://localhost:3009/ | nam@example.com / ha@example.com |
| Quản lý cửa hàng | http://localhost:3009/manager.html | manager.q1@v0tech.vn / manager.td@v0tech.vn |
| Nhân viên bán hàng | http://localhost:3009/employee.html | staff.q1@v0tech.vn / staff.td@v0tech.vn |

Mật khẩu ứng dụng mẫu: `Demo@12345`. Mỗi vai trò có cookie riêng nên dùng được đồng thời ba trang. Hai tài khoản cùng vai trò cần hai phiên trình duyệt riêng để thử độc lập.

## Khởi động

```powershell
cd C:\Users\SE-project
npm.cmd install
# Chỉ khi chưa có .env: sao chép .env.example thành .env và điền MySQL.
npm.cmd run db:setup
npm.cmd start
```

`.env` đã được cấu hình local, không ghi đè hoặc đưa lên Git. `db:setup` bổ sung schema và dữ liệu khởi tạo cần thiết; không reset đơn/tồn hiện có. Khởi động lại Node.js sau khi cập nhật mã và Ctrl+F5 trình duyệt. Nếu cổng 3009 đã dùng, dừng đúng phiên Node cũ bằng Ctrl+C trước khi chạy lại.

```powershell
npm.cmd run dev
npm.cmd test
```

Kiểm thử tích hợp dùng MySQL thật trong database riêng `v0_store_test_<pid>`, server 3010 và dọn database thử sau khi chạy; cần quyền CREATE/DROP DATABASE và cổng 3010 trống.

## Phạm vi và quy tắc hiện hành

Phạm vi chính gồm khách mua online, quản lý một cửa hàng và nhân viên bán offline/xem KPI. Doanh nghiệp, kho tổng và điều chuyển thuộc hướng phát triển. Chi tiết tại [CHUC_NANG.md](CHUC_NANG.md), đối chiếu hai tài liệu tại [DOI_CHIEU_TAI_LIEU.md](DOI_CHIEU_TAI_LIEU.md), nghiệm thu tại [KIEM_THU.md](KIEM_THU.md).

- Giá/ưu đãi/tồn được kiểm tra lại trên server. Giữ tồn trong transaction, hoàn tồn một lần khi hoàn tất hủy hoặc duyệt trả.
- Online: Chờ xác nhận → Đã xác nhận → Đang chuẩn bị → Sẵn sàng nhận hoặc Đang giao → Đã nhận hàng → Hoàn tất.
- Offline: Nhân viên tạo bill Đã xác nhận → ghi nhận Đã nhận hàng → quản lý chốt Hoàn tất.
- Thanh toán đều mô phỏng theo BR-24. Thẻ/ngân hàng phải thành công trước khi xác nhận; COD thu tiền sau Đã nhận hàng. Chỉ đơn đã thanh toán được Hoàn tất. Không nhập thông tin thẻ thật.
- Theo quy tắc hủy mới của tài liệu: trả trước được yêu cầu hủy trước Hoàn tất; COD chỉ được yêu cầu khi chưa thu tiền, kể cả lúc sẵn sàng nhận/đang giao/đã nhận. Khách luôn gửi yêu cầu chờ cửa hàng; không tự hủy ngay.
- Quản lý tiếp tục xử lý sẽ từ chối yêu cầu hủy; Chấp nhận hủy khóa xử lý bán hàng; Hoàn tất hủy mới hoàn tồn. Đơn hủy/trả chỉ xem lịch sử.
- Hoa hồng cơ sở 5%, xét KPI số sản phẩm/tháng. Nhân viên dưới 80% hưởng 0, 80–dưới 100% hưởng 50% cơ sở, từ 100% hưởng 100% cơ sở. Quản lý có công thức riêng trong file đối chiếu.
- Doanh thu báo cáo theo ngày hoàn tất, loại đơn trả. Hoa hồng có sổ ghi nhận riêng và không thu hồi chỉ vì trả hàng sau đó (BR-51).
- Khuyến mãi có tuổi/giới tính/nghề nghiệp/kênh bán: online dùng hồ sơ đăng nhập; offline nhân viên đối chiếu giấy tờ. Một mã mỗi đơn.
- Hạng thành viên dùng ngưỡng demo 10/30 triệu; tài liệu chưa chốt chính sách chính thức.

Dữ liệu mẫu gồm 2 cửa hàng, 10 sản phẩm và các đơn DH-SEED; đó là dữ liệu kiểm thử, không phải giao dịch doanh nghiệp thật. Thao tác mới lưu bền trong MySQL. SSD Quận 1 hết hàng, Thủ Đức còn hàng để thử chọn cửa hàng.

## Mã nguồn và dữ liệu

| Thành phần | Vai trò |
|---|---|
| server.js | API chung, quyền, đơn hàng, tồn, báo cáo |
| backend/academic-api.js | Hồ sơ, thanh toán mô phỏng, POS nhân viên, KPI/tài khoản |
| backend/migrations.js | Nâng cấp schema idempotent và bổ sung dữ liệu cũ |
| backend/rules.js, commissions.js | Điều kiện ưu đãi/hủy và tính KPI/hoa hồng |
| database/schema.sql | Schema đầy đủ cho cài mới |
| selling-app.js, index3.html | Khách hàng; giữ bố cục gốc |
| manager-app.js, manager.html | Quản lý trong phạm vi cửa hàng |
| employee-app.js, employee.html | Ứng dụng web nhân viên |
| tests/ | Kiểm thử nghiệp vụ và tích hợp MySQL |

Bảng nghiệp vụ: stores, users, sessions, categories, brands, products, inventory, staff, promotions, orders, order_items, order_history, service_requests, replenishments, inventory_movements; bổ sung payment_records, commission_sales và staff_targets. Bảng commission_sales giữ cơ sở doanh số lúc hoàn tất; staff_targets lưu KPI từng tháng.

Quyền cửa hàng lấy từ phiên đăng nhập; nhân viên chỉ đọc tồn và thao tác bill của mình. Mật khẩu ứng dụng hash scrypt, session HttpOnly, kiểm tra Origin cho thao tác ghi. Các file HTML/JS demo cũ (đặc biệt admin.html/admin.js dùng localStorage) không phải module doanh nghiệp đã nối MySQL.

## Lỗi thường gặp

- `EADDRINUSE`: phiên khác đang giữ cổng web; dừng phiên server cũ, không chạy chồng.
- `ECONNREFUSED`: kiểm tra dịch vụ MySQL và DB_HOST/DB_PORT.
- `ER_ACCESS_DENIED_ERROR`: kiểm tra thông tin trong .env.
- Sai vai trò: khách/nhân viên/quản lý dùng tài khoản đúng bảng trên. Quyền do backend kiểm tra.
- Không mở HTML bằng file://; truy cập qua http://localhost:3009.
