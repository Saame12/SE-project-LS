# Nghiệm thu phạm vi chính — 18/11/2026

Chạy db:setup, khởi động server 3009 và Ctrl+F5. Tài khoản ứng dụng/mật khẩu ở [README.md](README.md). Các giao dịch dưới đây là mô phỏng; dữ liệu thay đổi được lưu MySQL, nên dùng dữ liệu thử khi lặp nhiều lần.

## 1. Khách hàng và ưu đãi

1. Mở trang khách: bố cục, giỏ trượt, Trung tâm tài khoản và lịch sử giữ giao diện cũ. Chưa đăng nhập mà thêm giỏ phải chuyển đăng nhập.
2. Dùng Nam, sửa hồ sơ: ngày sinh/giới tính/nghề nghiệp/địa chỉ; tải lại vẫn lưu. Thử email trùng, ngày sinh tương lai và số điện thoại sai phải bị chặn.
3. Lọc danh mục/hãng/tên và khoảng giá; chọn SSD: Quận 1 hết hàng, Thủ Đức còn hàng.
4. Quản lý tạo mã cho người 18–30 tuổi, giới tính và nghề nghiệp cụ thể; khách đủ hồ sơ được áp dụng, người không đủ bị từ chối. Thử mã sai cửa hàng/hết hạn/chưa đủ đơn tối thiểu và mã chỉ offline.
5. Với RAM 3.290.000 đ và WELCOME10 còn hiệu lực: giảm 329.000 đ, tổng 2.961.000 đ. Server bỏ qua giá/tổng giả do client gửi.
6. Bấm Đơn hàng → đúng tab Lịch sử mua hàng. Tra cứu mã/số điện thoại chỉ trả đơn của khách đang đăng nhập; lộ trình ba mốc phản ánh lịch sử, không sáng Đã nhận hàng chỉ vì đang giao.

## 2. Đơn online trả trước

1. Chọn thẻ hoặc ngân hàng/QR, đặt đơn. Tồn giảm ngay; đơn Chờ xác nhận/Chưa thanh toán.
2. Mô phỏng thất bại: chưa thu tiền, quản lý chưa xác nhận được. Thử lại thành công: lưu mã tham chiếu, trạng thái Đã thu tiền.
3. Quản lý phân công nhân viên đúng cửa hàng → Đã xác nhận → Đang chuẩn bị → Sẵn sàng nhận hoặc Đang giao → Đã nhận hàng → Hoàn tất.
4. Thử bỏ qua Đã nhận hàng hoặc phân công người cửa hàng khác: API từ chối. Chuyển trạng thái không trừ tồn thêm.
5. Sau khi đóng màn hình thanh toán chưa trả tiền, khách mở lịch sử vẫn có nút tiếp tục thanh toán mô phỏng.

## 3. COD và hóa đơn offline

1. Online COD không cần thanh toán trước Đã xác nhận; quản lý không được thu tiền trước Đã nhận hàng.
2. Đã nhận hàng chưa thu tiền: chưa Hoàn tất được. Xác nhận thu tiền mô phỏng rồi Hoàn tất.
3. Mở employee.html, đăng nhập staff.q1: chỉ thấy tồn Quận 1, không có điều chỉnh kho.
4. Thêm sản phẩm vào bill, thay số lượng, kiểm tra tạm tính; nhập khách/số điện thoại và COD. Tạo bill: gắn đúng nhân viên/cửa hàng; tồn giảm và quản lý nhìn thấy kênh Tại cửa hàng.
5. Nhân viên ghi nhận khách nhận hàng → quản lý thu tiền → Hoàn tất. Bill thẻ/ngân hàng offline đã mô phỏng thanh toán ngay khi lập; vẫn cần nhận hàng và hoàn tất.
6. Mã có điều kiện nhân khẩu học yêu cầu nhân viên nhập thông tin và xác nhận đối chiếu giấy tờ. Không xác nhận thì server từ chối.
7. Nhân viên khác không thấy/sửa bill này; nhân viên không được chốt Hoàn tất hoặc điều chỉnh kho. Ngừng làm việc phải vô hiệu quyền nhân viên ngay cả phiên cũ.

## 4. Hủy theo tài liệu

1. COD mới Chờ xác nhận: gửi Yêu cầu hủy, phải hiện Chờ duyệt hủy, chưa hoàn tồn và chưa tự Đã hủy.
2. Quản lý chọn Tiếp tục xử lý: yêu cầu bị từ chối, lưu lý do và chuyển bước; tồn không tăng.
3. Đơn khác chọn Chấp nhận hủy: chuyển Đang hủy, khóa phân công/thu tiền/chuyển bước, chỉ còn Hoàn tất hủy. Chưa hoàn tồn ở bước chấp nhận.
4. Hoàn tất hủy: Đã hủy, hoàn tồn đúng một lần, ghi hoàn tiền mô phỏng nếu đã trả trước; API thao tác lại phải bị chặn.
5. COD chưa thu tiền ở Sẵn sàng nhận/Đang giao/Đã nhận hàng vẫn yêu cầu hủy được. COD đã thu tiền không được yêu cầu.
6. Đơn trả trước đã thanh toán đang giao vẫn gửi yêu cầu được. Đơn Hoàn tất chỉ yêu cầu trả hàng; đơn hủy/trả chỉ xem lịch sử.
7. Gọi duyệt hủy trước chấp nhận, thao tác sau chấp nhận hoặc dùng quản lý khác cửa hàng: đều phải bị từ chối.

## 5. Trả hàng, KPI và báo cáo

1. Hoàn tất một bill, xem doanh thu ngày hoàn tất và sổ doanh số nhân viên. Đặt KPI tháng cho số lượng vừa bán bằng mục tiêu để dễ kiểm chứng mức 100%.
2. Nhân viên: <80% hưởng 0; 80–<100% hưởng 50% của cơ sở 5%; >=100% hưởng 100% cơ sở. Ví dụ doanh số 2.961.000 đ tại >=100% KPI: 148.050 đ.
3. Quản lý: <80% =75% cơ sở bill phụ trách; 80–<100% =50% cơ sở +1% doanh số cửa hàng; >=100% =100% cơ sở +2%. Không cộng dồn các nhánh. Đơn vị KPI quản lý được cấu hình rõ trong màn hình.
4. Khách yêu cầu trả toàn bill hoàn tất → quản lý kiểm nhận rồi duyệt. Tồn tăng một lần, doanh thu thuần giảm; cơ sở doanh số/hoa hồng đã ghi nhận không bị xóa do trả hàng (BR-51).
5. Lọc tháng/quý/năm, tải CSV, đối chiếu tổng online/offline và nhân viên. Lọc một phần tháng vẫn xét toàn tháng KPI liên quan.
6. Nhân viên xem KPI cá nhân sau bấm Làm mới; không có dữ liệu hoa hồng người khác.

## 6. Quản trị cửa hàng và điểm dừng mở rộng

1. Thêm nhân viên bán hàng, đặt KPI tháng và cấp tài khoản; đăng nhập employee.html bằng tài khoản vừa cấp. Nhân viên kho không được cấp quyền POS.
2. Sửa hồ sơ/ngừng làm việc; nhân viên ngừng không còn được phân công mới. Thủ Đức không xem/sửa người Quận 1.
3. Tìm tồn, lọc tồn thấp, điều chỉnh tồn kèm lý do: lưu chênh lệch và người thao tác. Nhân viên chỉ đọc.
4. Gửi bổ sung hàng: lưu và xem trạng thái Chờ công ty xử lý. Không có nút giả duyệt kho tổng; đây là điểm dừng thuộc hướng phát triển.
5. Mã chung công ty chỉ xem; quản lý chỉ sửa mã cửa hàng mình. Tạo mã mới và kiểm tra khách đồng bộ.
6. Khởi động lại server/db:setup không mất đơn/tồn/yêu cầu hiện có. Không mở file HTML trực tiếp.

## Kiểm thử tự động và kiểm tra đã thực hiện

`npm.cmd test`: 14 test, bao gồm nhóm tích hợp nhiều bước với MySQL thật trong database riêng. Kiểm tra quyền ba vai trò/cửa hàng/chủ đơn, thanh toán thành công/thất bại, Received/Paid/Finished, hủy hai bước, trả hàng không thu hồi hoa hồng, hồ sơ/đổi mật khẩu, điều kiện ưu đãi, POS, ngừng làm việc, schema idempotent và hai người tranh mua một đơn vị tồn.

Đã kiểm tra giao diện trên database thử riêng: đăng nhập ba vai trò, nhân viên lập bill COD → nhận hàng → quản lý thu tiền → hoàn tất → nhân viên làm mới thấy KPI tăng từ 1 lên 2 sản phẩm, doanh số từ 3.290.000 lên 4.180.000 đ. Đã xem lại bố cục lịch sử/lộ trình khách hàng theo bản gốc.

Đã cập nhật schema database v0_store và đối chiếu số dòng trước/sau: 14 orders, 14 order_items, 20 inventory, 6 service_requests, 16 inventory_movements; không reset các dữ liệu này. Bản ghi mô phỏng UI ở database thử không trộn vào v0_store.
