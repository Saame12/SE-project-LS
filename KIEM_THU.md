# Kịch bản kiểm tra thủ công

Mở trang khách hàng tại http://localhost:3009/ và trang quản lý tại http://localhost:3009/manager.html trong hai tab cùng trình duyệt (phiên khách hàng và quản lý đã được tách riêng). Mật khẩu ứng dụng demo: `Demo@12345`.

## 1. Danh mục và tồn từng cửa hàng

1. Ở trang khách, chọn Quận 1, chọn ngành hàng SSD: sản phẩm Kingston KC3000 hết hàng, không thể thêm giỏ.
2. Chuyển sang Thủ Đức: sản phẩm có tồn, có thể mua.
3. Thử lọc thương hiệu Kingston, tìm tên/SKU, sắp xếp giá.
4. Quản lý Thủ Đức điều chỉnh tồn SSD với lý do; khách bấm Làm mới tồn kho để thấy số mới.

## 2. Đặt đơn và nhận tại cửa hàng

1. Khách `nam@example.com` chọn Quận 1, mua một RAM Corsair (3.290.000 đ).
2. Mở giỏ → Tiến hành đặt hàng → nhận tại cửa hàng → tiền mặt → mã WELCOME10.
3. Tổng sau giảm phải là **2.961.000 đ**; tồn RAM giảm 1 ngay khi đặt hàng.
4. Quản lý `manager.q1@v0tech.vn` → Đơn hàng trực tuyến → Làm mới → tìm mã mới.
5. Xem đơn → phân công Bùi Anh Tuấn → Đã xác nhận → Đang chuẩn bị → Sẵn sàng nhận.
6. Thử hoàn tất khi chưa thu tiền: hệ thống phải từ chối.
7. Xác nhận đã nhận đủ tiền → chuyển Hoàn tất. Khách mở lịch sử thấy các bước.
8. Báo cáo Quận 1 tăng doanh thu 2.961.000 đ, hoa hồng Tuấn tăng **44.415 đ** (1,5%). Tồn không bị trừ thêm lần nữa.

## 3. Giao tận nơi và chuyển khoản

1. Tạo đơn khác, chọn Giao tận nơi; bỏ địa chỉ trống phải không đặt được.
2. Nhập địa chỉ, chọn chuyển khoản. Đơn ban đầu vẫn Chưa thanh toán.
3. Quản lý phân công → xác nhận → chuẩn bị → đang giao.
4. Sau khi thực tế nhận tiền, quản lý xác nhận thu tiền → Hoàn tất. Hệ thống không tự kết nối ngân hàng.

## 4. Hủy đơn

1. Đặt đơn mới ở Quận 1, ghi tồn trước/sau.
2. Khách → Đơn hàng → Yêu cầu hủy, nhập lý do.
3. Quản lý → Yêu cầu hủy & trả hàng → xem đơn → Duyệt và nhập ghi chú.
4. Khách thấy Đã hủy; tồn trở về trước đặt; đơn hủy không cộng doanh thu.
5. Thử từ chối một yêu cầu khác: lưu ghi chú từ chối, tồn vẫn giữ cho đơn, tiếp tục xử lý được.
6. Mỗi loại yêu cầu chỉ gửi một lần/đơn ở phiên bản này; không có vòng gửi lại sau khi bị từ chối.

## 5. Trả toàn đơn

1. Dùng đơn vừa hoàn tất ở bước 2 hoặc `DH-SEED-001` của Nam.
2. Khách yêu cầu trả hàng và nhập lý do.
3. Sau khi kiểm nhận đủ hàng, quản lý duyệt kèm ghi chú.
4. Đơn Đã trả hàng, tồn tăng đúng số lượng, trạng thái ghi nhận hoàn tiền nếu đã thu tiền; doanh thu/hoa hồng bị loại khỏi báo cáo.
5. Hoàn tiền thực tế cần thực hiện ngoài ứng dụng. Chưa có trả một phần/đổi trực tiếp.

## 6. Nhân viên, ưu đãi và bổ sung

1. Quản lý → Nhân viên & hoa hồng → thêm nhân viên, sửa tỷ lệ, ngừng làm việc.
2. Nhân viên đã ngừng không xuất hiện trong danh sách phân công mới.
3. Quản lý → Khuyến mãi → tạo mã riêng Quận 1 đang hiệu lực; khách Quận 1 thấy và dùng được, khách Thủ Đức không thấy/không dùng được.
4. Thử mã chưa đạt đơn tối thiểu hoặc hết hạn: backend từ chối.
5. Quản lý chỉ xem được chương trình công ty WELCOME10, không sửa được.
6. Tồn kho → Yêu cầu bổ sung → lưu số lượng/lý do → hiển thị Chờ công ty xử lý; đây là điểm dừng đã ghi trong CHUC_NANG.md.

## 7. Phân quyền và dữ liệu lưu bền

1. Quản lý Thủ Đức không thấy đơn Quận 1; dùng API với ID đơn Quận 1 cũng bị chặn.
2. Khách Hà không xem/yêu cầu hủy đơn của Nam.
3. Khách truy cập API quản lý bị 403; chưa đăng nhập bị 401.
4. Tải lại trình duyệt, dừng/mở lại Node.js: đơn, tồn, lịch sử, khuyến mãi và nhân viên đã lưu vẫn còn.
5. Chạy `npm.cmd run db:setup` lần nữa không xóa dữ liệu cũ.
6. Bấm các liên kết chính sách chưa triển khai ở footer sẽ thấy thông báo, không dẫn vào trang trống.

## Kiểm thử tự động

```powershell
npm.cmd test
```

Cần MySQL đang chạy và cổng 3010 trống. Bộ test tạo database `v0_store_test_<pid>` riêng, seed, chạy API, sau đó xóa database thử nghiệm. Bao gồm kiểm tra hai khách cùng mua sản phẩm chỉ còn một đơn vị: đúng một đơn thành công, đơn còn lại nhận 409, tồn không âm.
