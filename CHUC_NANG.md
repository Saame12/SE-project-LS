# Trạng thái chức năng — 13/11/2026

Phạm vi: **3.4 Quản lý cửa hàng** và **3.6 Bán hàng trực tuyến**. Hoàn thiện ở đây có nghĩa đã có giao diện, API và dữ liệu lưu MySQL cho phạm vi mô tả; không đồng nghĩa đã tích hợp dịch vụ thương mại bên ngoài.

## 3.4 — Quản lý cửa hàng

| Chức năng | Trạng thái | Phạm vi hoạt động |
|---|---|---|
| Đăng nhập và giới hạn cửa hàng | Hoàn thiện | Backend kiểm tra role/store; hai quản lý không xem/sửa đơn hoặc nhân viên cửa hàng khác |
| Thống kê riêng của cửa hàng | Hoàn thiện | Doanh thu, số đơn, đơn mới, đơn trả, biểu đồ theo ngày, lọc ngày tạo đơn |
| Xem tồn kho và cảnh báo | Hoàn thiện | Tồn khả dụng sau khi giữ hàng cho đơn; ngưỡng cảnh báo theo sản phẩm |
| Điều chỉnh tồn kho | Hoàn thiện | Nhập số tồn khả dụng mới, bắt buộc lý do, ghi người thao tác và chênh lệch |
| Gửi yêu cầu bổ sung | Hoàn thiện phía cửa hàng | Tạo yêu cầu và xem lại trong MySQL; mặc định chờ công ty xử lý |
| Công ty duyệt yêu cầu → xuất kho → cửa hàng nhận | Đang phát triển | Chưa có trang/API kho công ty, phiếu điều chuyển và xác nhận nhận hàng; yêu cầu bổ sung dừng ở Chờ công ty xử lý |
| Quản lý nhân viên | Hoàn thiện | Thêm/sửa hồ sơ, chức vụ, liên hệ, tỷ lệ hoa hồng, ngừng làm việc; giữ lịch sử đơn |
| Tiếp nhận, xác nhận, xử lý đơn online | Hoàn thiện | Xem đơn mới từ khách, lọc/tìm, xem chi tiết/lịch sử và đúng luồng trạng thái |
| Phân công nhân viên | Hoàn thiện | Chỉ chọn nhân viên đang làm việc thuộc cửa hàng; lưu tỷ lệ hoa hồng lúc phân công |
| Cập nhật trạng thái | Hoàn thiện | Hai nhánh nhận tại cửa hàng/giao tận nơi; kiểm tra nhân viên, thanh toán và yêu cầu hủy đang chờ |
| Xác nhận thu tiền | Hoàn thiện theo nghiệp vụ thủ công | Quản lý xác nhận đã nhận đủ tiền; có lịch sử; không tự lấy kết quả từ ngân hàng |
| Khuyến mãi cửa hàng | Hoàn thiện | Tạo/sửa/tắt, ngày hiệu lực, % giảm, đơn tối thiểu, mức giảm tối đa; đồng bộ sang khách |
| Khuyến mãi toàn công ty | Hoàn thiện chế độ sử dụng | Được áp dụng nếu đủ điều kiện; quản lý cửa hàng chỉ xem |
| Duyệt/từ chối hủy đơn và trả toàn đơn | Hoàn thiện | Ghi lý do/ghi chú, hoàn tồn một lần, chặn thao tác lặp; duyệt trả sau khi kiểm nhận thực tế |
| Doanh số và hoa hồng | Hoàn thiện | Theo nhân viên, chỉ đơn hoàn tất, trừ đơn đã trả khỏi doanh thu; không phải bảng lương |

## 3.6 — Bán hàng trực tuyến

| Chức năng | Trạng thái | Phạm vi hoạt động |
|---|---|---|
| Danh mục chung, thương hiệu, ngành hàng | Hoàn thiện | API dùng chung products/categories/brands; tìm kiếm, lọc, sắp xếp giá |
| Chi tiết sản phẩm | Hoàn thiện | Thông số, ảnh local, giá và tồn tại cửa hàng đang chọn |
| Chọn cửa hàng xử lý | Hoàn thiện | Chọn trước khi mua; checkout giữ đúng cửa hàng; chuyển cửa hàng sẽ kiểm tra lại tồn |
| Kiểm tra tồn theo cửa hàng | Hoàn thiện | Tồn MySQL; báo hết hàng, chặn thêm quá tồn, kiểm tra lại trong transaction khi đặt đơn |
| Giỏ hàng | Hoàn thiện | Thêm/tăng/giảm/xóa; giỏ lưu trình duyệt cho tiện dùng; đơn/tồn không lưu localStorage |
| Đăng ký/đăng nhập/đăng xuất | Hoàn thiện | Khách mới được đăng ký; mật khẩu hash; cookie session; chỉ xem/yêu cầu với đơn của mình |
| Tạo đơn trực tuyến | Hoàn thiện | Lưu đơn, snapshot giá/tên, chi tiết, lịch sử, giữ tồn atomically; backend tự tính giá |
| Nhận tại cửa hàng hoặc giao tận nơi | Hoàn thiện | Chọn hình thức; giao hàng bắt buộc địa chỉ; luồng trạng thái tương ứng |
| Phương thức thanh toán khả dụng | Hoàn thiện phạm vi local | Tiền mặt khi nhận / chuyển khoản đối soát thủ công; không mô phỏng thanh toán online thành công |
| Xem và áp dụng khuyến mãi | Hoàn thiện | Mã công ty/cửa hàng, thời gian, điều kiện đơn, trần giảm; chỉ một mã mỗi đơn |
| Hạng thành viên | Hoàn thiện | Hiển thị hạng và chi tiêu từ đơn hoàn tất; ngưỡng 10 triệu / 30 triệu |
| Theo dõi đơn | Hoàn thiện | Tìm mã trong đơn của mình, trạng thái, lịch sử, thanh toán, nhân viên, kết quả hủy/trả; bấm Làm mới để cập nhật |
| Yêu cầu hủy | Hoàn thiện | Trước khi sẵn sàng nhận/đang giao; gửi lý do, chờ duyệt, xem kết quả |
| Yêu cầu trả sản phẩm | Hoàn thiện phạm vi toàn đơn | Đơn đã hoàn tất, trả toàn bộ đơn; quản lý duyệt sau khi nhận và kiểm hàng |
| Đổi trực tiếp / trả một phần | Đang phát triển | Chưa có chọn dòng/serial/số lượng trả hoặc đơn thay thế; có thể xử lý trả toàn đơn rồi khách đặt đơn mới |

## Luồng chưa nối hoặc nằm ngoài phạm vi

| Luồng / vị trí | Điểm dừng hiện tại | Công việc cần bổ sung |
|---|---|---|
| Yêu cầu bổ sung hàng | Chờ công ty xử lý | Duyệt cấp công ty, tồn kho tổng, điều chuyển, nhận hàng và đối chiếu chứng từ |
| Chuyển khoản / hoàn tiền | Quản lý ghi nhận thủ công | Tài khoản ngân hàng thực tế, webhook xác thực, đối soát, thực hiện hoàn tiền |
| VNPAY/MoMo/Visa/Trả góp | Chưa khả dụng; đã bỏ các nhãn thanh toán chưa tích hợp khỏi danh sách khả dụng | Hợp đồng dịch vụ, sandbox, callback chữ ký và idempotency |
| Giao hàng | Quản lý tự cập nhật Đang giao / Hoàn tất | API vận chuyển, phí theo địa chỉ, mã vận đơn, theo dõi giao nhận tự động |
| Chính sách bảo hành/vận chuyển/hoàn tiền/trả góp ở footer | Mở thông báo Đang phát triển | Nội dung chính sách được phê duyệt và luồng tiếp nhận tương ứng; không còn link im lặng |
| Hạng thành viên → quyền lợi tự động | Hiển thị hạng | Chính sách tích điểm, đổi điểm, ưu đãi hạng; hiện chưa tự giảm thêm theo hạng |
| Đổi hàng / trả một phần | Chưa có nghiệp vụ | Kiểm nhận từng dòng, serial, điều chỉnh tiền và lập đơn thay thế |
| Nhân viên → tài khoản đăng nhập riêng | Hồ sơ nhân viên để phân công | Trang cấp tài khoản, quyền nhân viên, giao diện thực thi nhiệm vụ |
| Quản trị danh mục công ty | Dữ liệu chung được seed và chỉ đọc trên hai trang | CRUD danh mục/giá tập trung và lịch sử phê duyệt; trang admin.html cũ vẫn là demo độc lập |
| Hóa đơn VAT / kế toán / bảng lương | Chưa tích hợp | Hóa đơn điện tử, giá vốn/lợi nhuận, đối soát lương và hoa hồng thực trả |
| Email/SMS/quên mật khẩu | Chưa có | Nhà cung cấp gửi mail/SMS, token phục hồi, xác minh thông tin |
| Thông báo realtime | Cập nhật khi tải lại/bấm Làm mới | WebSocket/SSE hoặc polling theo thiết kế vận hành |
| Tồn theo serial, tồn vật lý và tồn giữ riêng | Đang dùng một chỉ số tồn khả dụng | Phân tách physical/reserved/available, quản lý serial và sổ kho đầy đủ |

Dữ liệu kiểm thử được tạo có chủ đích và lưu thật trong MySQL; không phải doanh thu, tài khoản hay giao dịch khách hàng thật. Các banner/hình ảnh của giao diện cũ chỉ phục vụ minh họa, không đại diện cam kết vận chuyển/bảo hành thương mại.

## Kết quả kiểm tra trong lần bàn giao

- `npm.cmd test`: 4 test chạy qua, trong đó test tích hợp thực hiện các API trên database MySQL riêng.
- Đã kiểm tra: sai mật khẩu/hash, quy tắc chuyển trạng thái, hai nhánh giao/nhận, đơn không đủ hàng, số lượng âm, không tin giá gửi từ trình duyệt, khuyến mãi, quyền khách/quản lý/cửa hàng khác, giữ tồn đồng thời, hủy/trả hoàn tồn và chặn duyệt lặp, doanh số/hoa hồng, nhân viên, yêu cầu bổ sung, đăng ký tài khoản.
- Kiểm tra trình duyệt: đăng nhập khách → thêm RAM → dùng WELCOME10 → tạo đơn → yêu cầu hủy → đăng nhập quản lý Quận 1 → duyệt hủy. Đơn kiểm thử giao diện được giữ trong database với lịch sử để xem lại.
- Chưa kiểm thử tích hợp dịch vụ thanh toán, vận chuyển, hóa đơn vì các dịch vụ này chưa được triển khai.

## Sửa lỗi phiên đăng nhập giữa hai trang

Phiên bản ngày 13/11/2026 tách cookie `v0sid_customer` và `v0sid_manager`. Mỗi giao diện gửi phạm vi phiên qua `X-Session-Scope`; máy chủ vẫn kiểm tra vai trò thật và quyền cửa hàng từ database. Đăng nhập/đăng xuất quản lý không ghi đè hoặc đăng xuất khách hàng ở tab mua hàng. Cookie cũ chỉ được chấp nhận đúng vai trò. Trước khi mở và gửi checkout, giao diện đọc lại phiên; máy chủ chặn đơn nếu tài khoản khách đã đổi từ lúc mở biểu mẫu. Bộ test kiểm tra cùng một cookie jar có cả hai phiên vẫn đặt được đơn bằng khách, quản lý vẫn bị chặn đặt đơn, đăng xuất quản lý vẫn giữ phiên khách. Sau cập nhật cần khởi động lại Node.js và tải lại hai trang.
