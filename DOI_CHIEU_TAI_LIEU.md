# Đối chiếu tài liệu và phạm vi đồ án

Ngày đối chiếu: 18/11/2026. Hai tài liệu nguồn được đọc từ file Word do người dùng cung cấp, không chỉnh sửa bản gốc.

- **Biên bản mô tả hệ thống doanh nghiệp thiết bị điện tử**: Pegasus Company, 51 quy tắc BR-01–BR-51. Có công thức KPI/hoa hồng và các quy tắc thanh toán/hủy cụ thể.
- **Project_Report (1)**: bản nháp 1.0, Reconstruction V2.0. Phạm vi chính ở mục 1.3.A và FR-01–FR-09; phạm vi doanh nghiệp/kho trung tâm ở mục 1.3.B là mở rộng.

Theo xác nhận trong chat: chỉ hoàn thiện phạm vi chính; phạm vi mở rộng là hướng phát triển. Quy tắc hủy chuyển sang quy tắc tài liệu thay cho các giới hạn hủy của phiên bản trước.

## Phạm vi chính đã triển khai

| Yêu cầu | Nguồn | Kết quả và cách kiểm tra |
|---|---|---|
| Dashboard và báo cáo cửa hàng | Report FR-01, FR-09; Biên bản BR-48 | Doanh thu hoàn tất, online/offline, số đơn, doanh thu ngày, doanh số/KPI/hoa hồng theo tháng; chọn tháng/quý/năm và xuất CSV |
| Tồn kho riêng, tìm kiếm, cảnh báo, điều chỉnh | FR-02; BR-02, BR-05 | Tìm SKU/tên, lọc hàng cần bổ sung, ghi lý do điều chỉnh và nhật ký; chỉ quản lý đúng cửa hàng được ghi |
| Gửi và theo dõi yêu cầu bổ sung | FR-03; BR-06 | Tạo yêu cầu, số lượng/lý do, lưu MySQL và xem trạng thái. Nhận/duyệt ở trụ sở thuộc mở rộng; không có nút tự duyệt ở cửa hàng |
| Nhân viên trong cửa hàng | FR-04; BR-05, BR-35 | Thêm/sửa/ngừng làm việc, phân nhóm bán hàng/kho/quản lý, đặt KPI tháng, cấp tài khoản bán hàng. Tài khoản bị chặn khi nhân viên ngừng làm việc |
| Đơn online, phân công và tiến độ | FR-05; BR-16–BR-22 | Danh mục chung, chọn cửa hàng, kiểm tra/giữ tồn trong transaction, phân công đúng cửa hàng, các trạng thái nhận/giao/hoàn tất, lịch sử người thao tác |
| Khuyến mãi cửa hàng | FR-06; BR-30–BR-33 | Ngày hiệu lực, đơn tối thiểu, %/trần giảm, kênh online/offline, tuổi/giới tính/nghề nghiệp; online dùng hồ sơ thật trong tài khoản, không tin thông tin giả gửi riêng khi checkout |
| Bill offline | FR-07; BR-11–BR-15 | employee.html: tìm tồn, thêm hàng, nhập khách, áp mã và đối chiếu giấy tờ, tạo bill gắn chính nhân viên và cửa hàng; quản lý thấy bill và chốt hoàn tất |
| KPI và hoa hồng nhân viên | FR-08; BR-35–BR-42 | Nhân viên xem KPI/hoa hồng cá nhân; quản lý xem toàn cửa hàng, công thức đúng ba ngưỡng và cơ sở 5% |
| Thanh toán và Received | Report 4.5–4.6; BR-23–BR-28 | COD, thẻ Visa/Credit và Internet Banking/QR đều mô phỏng. Trả trước phải thành công trước Confirmed. Received tách khỏi Paid và Finished. COD chỉ thu tiền sau Received |
| Hồ sơ và mua hàng | Biên bản phần website bán hàng, BR-31/32 | Lọc tên/hãng/ngành/khoảng giá; đăng nhập trước thêm giỏ; cập nhật hồ sơ/ngày sinh/giới tính/nghề nghiệp/địa chỉ; đổi mật khẩu và thu hồi các phiên khác |
| Hủy và trả hàng | BR-43–BR-46 | Trả trước: được yêu cầu hủy trước Finished; COD: được yêu cầu hủy nếu chưa ghi nhận thanh toán. Yêu cầu → chấp nhận → hoàn tất hủy, hoàn tồn một lần; trả toàn đơn sau hoàn tất |
| Hoa hồng sau đổi trả | BR-51 | commission_sales ghi nhận lúc Finished, không xóa/giảm chỉ vì trả hàng sau đó. Báo cáo doanh thu có thể trừ đơn trả; báo cáo hoa hồng dùng cơ sở ghi nhận riêng |
| Phân quyền, đồng bộ và dữ liệu | Report 6, 8, 9 | Cookie riêng cho khách/quản lý/nhân viên; backend kiểm tra role/store/staff; transaction giữ/hoàn tồn; thanh toán có lịch sử và mã tham chiếu mô phỏng |

## Những khác biệt đã giải quyết

| Nội dung | Đối chiếu | Quyết định triển khai |
|---|---|---|
| Tổ chức database | Biên bản có câu mỗi cửa hàng khác database; Report đề xuất một database quan hệ tập trung | Giữ một MySQL, phân tách bằng store_id và khóa ngoại. Đây là lựa chọn kỹ thuật, không tạo database riêng cho mỗi cửa hàng |
| Công nghệ | Report ghi chưa chốt | Giữ Node.js/Express + MySQL + cổng web 3009 theo yêu cầu trực tiếp của người dùng |
| Thanh toán | Biên bản BR-24 yêu cầu mô phỏng; Report 4.6 để quyết định | Mô phỏng đầy đủ, có thành công/thất bại cho thanh toán online. Không yêu cầu hợp đồng/cổng thanh toán thật và không nhập số thẻ thật |
| Điều kiện hủy | Luồng chat cũ chặn khi đang giao và hủy ngay lúc chờ xác nhận | Theo xác nhận mới, áp dụng BR-43/44. Khách gửi yêu cầu, không tự hủy ngay. Cho phép yêu cầu khi ready/shipping/received nếu thỏa điều kiện thanh toán và chưa Finished |
| Các bước duyệt hủy | Tài liệu chưa chốt chi tiết | Giữ cơ chế hai bước đã có để xử lý yêu cầu: quản lý tiếp tục/từ chối hoặc Chấp nhận hủy → Hoàn tất hủy. Đây là lựa chọn triển khai, không phải BR mới được gán cho tài liệu |
| Tỷ lệ hoa hồng | Report để mở; Biên bản nêu rõ 5% và KPI | Áp dụng BR-37–BR-42. Tỷ lệ cũ 1,5% trong demo không còn là công thức đang dùng |
| Hoa hồng sau trả hàng | Code cũ tính trực tiếp từ đơn còn completed | Theo BR-51, ghi nhận riêng khi hoàn tất, giữ cơ sở đó sau trả hàng |
| KPI quản lý | Biên bản nói KPI riêng nhưng chưa định nghĩa chính xác đơn vị đo | Cho cấu hình riêng mỗi tháng theo sản phẩm cửa hàng hoặc sản phẩm bill trực tiếp phụ trách. Dữ liệu mẫu mặc định sản phẩm cửa hàng; đây là cấu hình demo có thể chỉnh, không khẳng định tài liệu đã chốt đơn vị |

## Công thức được áp dụng

Nhân viên bán hàng: cơ sở = 5% doanh số bill hoàn tất do người đó phụ trách. Sản phẩm/KPI dưới 80% hưởng 0; từ 80% đến dưới 100% hưởng 50% cơ sở; từ 100% hưởng toàn bộ cơ sở.

Quản lý: dưới 80% hưởng 75% cơ sở 5% trên bill trực tiếp phụ trách; từ 80% đến dưới 100% hưởng 50% cơ sở cộng 1% doanh số ghi nhận của cửa hàng; từ 100% hưởng toàn bộ cơ sở cộng 2%. Ba nhánh thay thế nhau, không cộng dồn thưởng. Nhân viên kho không có hoa hồng bán hàng. KPI tính theo tháng; báo cáo một phần tháng vẫn dùng toàn bộ tháng KPI liên quan để không đổi ngưỡng theo cách lọc ngày.

Dữ liệu ghi nhận hoa hồng là cơ sở tính thưởng tháng trong mô phỏng, không phải bảng lương đã chi tiền. Việc sửa KPI tháng sẽ tính lại thưởng tháng theo cấu hình; trả hàng không tự xóa cơ sở đã ghi nhận.

## Hướng phát triển và quyết định còn mở

- Web quản trị doanh nghiệp, giám sát/điều chuyển nhân viên toàn chuỗi, danh mục tập trung có CRUD, nhà cung cấp, kho trung tâm và điều chuyển: chưa triển khai trong phạm vi chính. admin.html/admin.js cũ là mẫu localStorage, không dùng để nghiệm thu nghiệp vụ MySQL hiện hành.
- Duyệt yêu cầu bổ sung ở trụ sở và tự động trừ kho tổng/cộng kho cửa hàng thuộc hướng phát triển. Yêu cầu trong phiên bản này dừng ở Chờ trụ sở xử lý; không làm giả việc đã cấp hàng.
- Khuyến mãi cho danh sách nhiều cửa hàng do trụ sở chọn: hướng phát triển. Hiện có mã toàn hệ thống dùng chung từ seed và mã riêng từng cửa hàng.
- Kết hợp nhiều mã/nhóm mã/thứ tự ưu tiên chưa chốt. Phiên bản chính giữ một mã/đơn; không tự coi BR-34 là cho phép chồng mọi mã.
- Đổi trực tiếp/trả một phần/điều kiện thời hạn hoàn tiền, kiểm định serial chưa có đặc tả hoàn chỉnh. Giữ trả toàn đơn với ghi chú kiểm nhận.
- Tiêu chí phân hạng khách hàng chưa chốt (BR-50). Ngưỡng demo cũ 10/30 triệu được giữ để chạy thử, không coi là chính sách đã được hai tài liệu xác nhận.
- Không xây cổng thanh toán hoặc vận chuyển thật. Mã thanh toán/thu tiền/hoàn tiền trong phiên bản chính là bản ghi mô phỏng.
- App nhân viên trong phạm vi chính là ứng dụng web dùng trên trình duyệt/mobile, không phải ứng dụng Android/iOS native.
- Các sơ đồ use case, lớp, tuần tự và bản thiết kế báo cáo học thuật là tài liệu bàn giao môn học riêng; file này là đối chiếu yêu cầu với phần mềm đã triển khai, không thay thế toàn bộ bộ hồ sơ thiết kế.
