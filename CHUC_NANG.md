# Trạng thái chức năng — 18/11/2026

Phạm vi chính theo Project_Report mục 1.3.A / FR-01–FR-09 và biên bản BR-01–BR-51. Theo xác nhận của người dùng, mục mở rộng là hướng phát triển. Đọc [DOI_CHIEU_TAI_LIEU.md](DOI_CHIEU_TAI_LIEU.md) để xem các khác biệt và lựa chọn triển khai.

## Đã triển khai trong phạm vi chính

| Nhóm | Chức năng và giới hạn |
|---|---|
| Khách hàng | Danh mục chung, ngành hàng/thương hiệu, tìm tên/khoảng giá, chọn cửa hàng, tồn thực tế, chi tiết sản phẩm, giỏ và đặt đơn |
| Tài khoản | Đăng ký/đăng nhập, sửa hồ sơ/địa chỉ/ngày sinh/giới tính/nghề nghiệp, đổi mật khẩu, thu hồi phiên khác |
| Nhận hàng và theo dõi | Nhận tại cửa hàng/giao tận nơi; lịch sử và lộ trình giữ giao diện gốc, dữ liệu MySQL |
| Thanh toán | COD, thẻ, ngân hàng/QR mô phỏng; online có kết quả thành công/thất bại/thử lại; tách Đã nhận hàng khỏi Đã thanh toán và Hoàn tất |
| Hủy/trả | Theo điều kiện tài liệu; chờ cửa hàng duyệt; chấp nhận → hoàn tất hủy; khóa đơn sau chấp nhận, hoàn tồn một lần; duyệt/từ chối trả toàn đơn |
| Tồn kho | Quản lý xem/tìm/lọc tồn thấp, điều chỉnh kèm lý do và nhật ký; nhân viên chỉ đọc |
| Bổ sung | Cửa hàng tạo yêu cầu và xem trạng thái; điểm dừng hiện tại là chờ trụ sở xử lý |
| Nhân viên | Hồ sơ, loại bán hàng/kho/quản lý, ngừng làm việc, KPI theo tháng và tài khoản nhân viên bán hàng |
| Đơn cửa hàng | Nhận online, phân công người đang làm đúng cửa hàng, chuyển trạng thái hợp lệ, xem bill offline, xác nhận thu tiền và chốt hoàn tất |
| Khuyến mãi | Mã riêng cửa hàng/mã chung từ seed, ngày hiệu lực, đơn tối thiểu, %/trần giảm, điều kiện tuổi/giới tính/nghề nghiệp/kênh; server tính lại |
| Nhân viên bán offline | Trang employee.html: tra tồn, giỏ bill, khách hàng, kiểm tra điều kiện ưu đãi, tạo bill gắn bản thân, ghi nhận giao hàng và xem đơn được phân công |
| KPI/hoa hồng | Cơ sở 5%, số sản phẩm mỗi tháng, công thức nhân viên/quản lý; nhân viên chỉ xem cá nhân; không giảm do trả hàng sau ghi nhận |
| Báo cáo | Ngày/tháng/quý/năm, doanh thu hoàn tất, online/offline, nhân viên, KPI và xuất CSV |
| Phân quyền/đồng bộ | Backend kiểm tra vai trò/cửa hàng/chủ đơn, phiên riêng ba vai trò, giữ tồn transaction, chống bán vượt và hoàn tồn lặp |

## Quy tắc hủy đang dùng

| Điều kiện đơn online | Khách hàng | Cửa hàng |
|---|---|---|
| Trả trước, chưa Hoàn tất | Được gửi yêu cầu, kể cả đang giao/đã nhận | Tiếp tục xử lý để từ chối hoặc Chấp nhận hủy |
| COD chưa ghi nhận thu tiền, chưa Hoàn tất | Được gửi yêu cầu | Cùng quy trình duyệt; khi thu tiền sẽ hết điều kiện hủy |
| COD đã thu tiền | Không được yêu cầu hủy | Tiếp tục hoàn tất; sau đó xử lý trả hàng nếu phù hợp |
| Đã chấp nhận hủy | Chờ hoàn tất hủy | Khóa bán hàng; chỉ Hoàn tất hủy để hoàn tồn/ghi hoàn tiền mô phỏng |
| Hoàn tất | Yêu cầu trả toàn đơn | Kiểm nhận rồi duyệt/từ chối |
| Đã hủy / Đã trả hàng | Chỉ xem lịch sử | Không được xử lý bán hàng hoặc hoàn tồn lần nữa |

Chờ xác nhận không còn hủy ngay. Sẵn sàng nhận/Đang giao không còn bị chặn chỉ vì trạng thái. Đây là thay đổi theo yêu cầu chuyển sang quy tắc tài liệu.

## Hướng phát triển — ngoài phạm vi chính

| Nhánh | Điểm chưa nối / giới hạn |
|---|---|
| Trụ sở/kho tổng | Chưa có trang duyệt bổ sung → xuất kho tổng → điều chuyển → cửa hàng xác nhận nhận hàng |
| Doanh nghiệp toàn chuỗi | Chưa có quản trị danh mục/nhà cung cấp toàn công ty, chuyển nhân viên và báo cáo toàn chuỗi; admin.html chỉ là demo cũ |
| Khuyến mãi nâng cao | Chưa chọn danh sách nhiều cửa hàng hoặc chồng nhiều mã; dùng một mã/đơn |
| Đổi trả nâng cao | Chưa đổi sản phẩm trực tiếp/trả một phần/kiểm định serial; hiện trả toàn đơn |
| Tích hợp bên ngoài | Không kết nối ngân hàng, ví MoMo/VNPAY, vận chuyển, xuất hóa đơn điện tử; thông báo trên giao diện chỉ rõ chưa triển khai |
| Nội dung phụ | Chính sách bảo hành/vận chuyển/trả góp ở footer mở thông báo; chưa có cổng dịch vụ riêng |
| Hạng thành viên | Ngưỡng mẫu 10/30 triệu; BR-50 chưa chốt tiêu chí chính thức và chưa tự giảm giá theo hạng |
| Native app | Nhân viên dùng ứng dụng web, chưa có Android/iOS native |

“Đã triển khai” nghĩa có giao diện/API/lưu MySQL và kiểm thử trong phạm vi mô phỏng đồ án. Không coi các nhánh trên là đã nối nghiệp vụ. Tài liệu Word gốc không bị thay đổi.
