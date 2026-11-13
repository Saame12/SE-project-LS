# Trạng thái chức năng — 13/11/2026

## Quy tắc hủy đơn hiện hành

| Trạng thái | Khách hàng | Quản lý / hệ thống |
|---|---|---|
| Chờ xác nhận | Hủy đơn → Xác nhận hủy đơn | Hủy ngay, hoàn tồn đúng một lần, lưu người hủy; quản lý chỉ xem chi tiết/lịch sử |
| Đã xác nhận / Đang chuẩn bị | Yêu cầu hủy → Chờ duyệt hủy | Vẫn được phân công/thu tiền; Tiếp tục xử lý sẽ từ chối yêu cầu và ghi lý do, hoặc bấm Chấp nhận hủy |
| Đang hủy (đã chấp nhận) | Hiển thị cửa hàng đã chấp nhận, chờ hoàn tất | Khóa thao tác bán hàng; chỉ còn Hoàn tất hủy, chưa hoàn tồn ở bước chấp nhận |
| Sẵn sàng nhận / Đang giao | Không hủy trực tiếp; hiển thị hướng dẫn liên hệ cửa hàng và địa chỉ | API cũng chặn hủy trực tiếp; không tự đổi trạng thái hoặc hoàn tồn |
| Hoàn tất | Yêu cầu trả toàn đơn | Xử lý trả hàng theo luồng hiện có |
| Đã hủy / Đã trả hàng | Chỉ xem chi tiết và lịch sử | Khóa mọi thao tác xử lý bán hàng; gửi lặp không hoàn tồn thêm |

Luồng Chờ xác nhận không tạo yêu cầu chờ quản lý: service_requests ghi trạng thái approved cùng ghi chú khách hủy ngay, còn orders chuyển cancelled trong cùng transaction với hoàn tồn và ghi lịch sử. Cả hai luồng hủy dùng chung hàm hoàn tồn. Ghi nhận hoàn tiền vẫn theo cơ chế thủ công đã mô tả, chưa tích hợp ngân hàng. Bộ kiểm thử hiện có 11 test, tất cả đạt; đã kiểm tra giao diện bằng database riêng.


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
| Chọn cửa hàng xử lý | Hoàn thiện | Chọn trong chi tiết sản phẩm hoặc giỏ hàng; checkout giữ đúng cửa hàng; chuyển cửa hàng sẽ kiểm tra lại tồn |
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
| VNPAY/MoMo/Visa/Trả góp | Giữ nhãn minh họa ở footer theo giao diện gốc; bấm nhãn sẽ báo Đang phát triển; không có trong lựa chọn checkout | Hợp đồng dịch vụ, sandbox, callback chữ ký và idempotency |
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

- `npm.cmd test`: 12 test chạy qua, trong đó test tích hợp thực hiện các API trên database MySQL riêng.
- Đã kiểm tra: sai mật khẩu/hash, quy tắc chuyển trạng thái, hai nhánh giao/nhận, đơn không đủ hàng, số lượng âm, không tin giá gửi từ trình duyệt, khuyến mãi, quyền khách/quản lý/cửa hàng khác, giữ tồn đồng thời, hủy/trả hoàn tồn và chặn duyệt lặp, doanh số/hoa hồng, nhân viên, yêu cầu bổ sung, đăng ký tài khoản.
- Kiểm tra trình duyệt: đăng nhập khách → thêm RAM → dùng WELCOME10 → tạo đơn → yêu cầu hủy → đăng nhập quản lý Quận 1 → duyệt hủy. Đơn kiểm thử giao diện được giữ trong database với lịch sử để xem lại.
- Chưa kiểm thử tích hợp dịch vụ thanh toán, vận chuyển, hóa đơn vì các dịch vụ này chưa được triển khai.

## Sửa lỗi phiên đăng nhập giữa hai trang

Phiên bản ngày 13/11/2026 tách cookie `v0sid_customer` và `v0sid_manager`. Mỗi giao diện gửi phạm vi phiên qua `X-Session-Scope`; máy chủ vẫn kiểm tra vai trò thật và quyền cửa hàng từ database. Đăng nhập/đăng xuất quản lý không ghi đè hoặc đăng xuất khách hàng ở tab mua hàng. Cookie cũ chỉ được chấp nhận đúng vai trò. Trước khi mở và gửi checkout, giao diện đọc lại phiên; máy chủ chặn đơn nếu tài khoản khách đã đổi từ lúc mở biểu mẫu. Bộ test kiểm tra cùng một cookie jar có cả hai phiên vẫn đặt được đơn bằng khách, quản lý vẫn bị chặn đặt đơn, đăng xuất quản lý vẫn giữ phiên khách. Sau cập nhật cần khởi động lại Node.js và tải lại hai trang.

## Khôi phục giao diện khách hàng gốc

Dùng index3.html/style1.css/style3.css do người dùng cung cấp làm chuẩn. Hai CSS gốc giữ nguyên từng byte. HTML chỉ thêm phạm vi phiên customer, CSS bổ trợ cho chức năng backend và nạp selling-app.js thay app3.js demo. Khôi phục header, hero, footer, nút chip danh mục, thẻ sản phẩm, popup chi tiết hai cột, giỏ hàng trượt bên phải và trang đăng nhập/đăng ký theo các lớp CSS gốc. Không chèn khối thông tin quản trị/cửa hàng phía trên banner. Chọn cửa hàng trong popup sản phẩm hoặc giỏ hàng. Giá, tồn, khuyến mãi và đơn vẫn lấy từ MySQL; không hiển thị giá gạch ngang/nhãn giảm giá giả khi danh mục chung chưa có giá so sánh. Các nhãn thanh toán chưa tích hợp ở footer chỉ là minh họa giao diện, có thông báo rõ khi bấm. Hồ sơ khách hàng hiện chỉ xem; cập nhật hồ sơ và đổi mật khẩu chưa được nối backend.

## Lịch sử và lộ trình theo giao diện gốc

- Nút Đơn hàng khi đã đăng nhập mở Trung tâm tài khoản → Lịch sử mua hàng, không mở popup danh sách mới. Thẻ đơn dùng đúng bố cục .ord/.oh/.steps của giao diện cũ: mã, trạng thái, ba bước, người nhận, sản phẩm, voucher, tổng tiền.
- Nút Xem lộ trình đơn hàng sau đặt hàng mở đúng popup tra cứu với mã vừa tạo. Liên kết Tra cứu đơn hàng mở popup .modal.tk gốc, tìm theo mã hoặc số điện thoại trong phạm vi tài khoản đang đăng nhập.
- Trạng thái chi tiết được gom thành ba mốc để giữ bố cục cũ. Nhận tại cửa hàng dùng các mốc sẵn sàng nhận/nhận thành công; giao hàng dùng đang vận chuyển/giao thành công. Hủy/trả là mốc kết thúc riêng. Thời gian lấy từ order_history; nếu dữ liệu cũ thiếu sự kiện, chỉ báo Đã qua bước này, không tạo thời gian giả.
- Các thao tác hủy/trả vẫn dùng API và quyền cũ. Chi tiết xử lý được thu gọn ngay dưới thẻ đơn, không chuyển sang giao diện bảng mới. Form yêu cầu sử dụng popup gốc.
- Giữ tab Đổi mật khẩu theo bố cục cũ, đánh dấu Đang phát triển và vô hiệu hóa form vì backend đổi mật khẩu chưa có.

## Luồng hủy hai bước sau khi khách gửi yêu cầu

1. Đã xác nhận/Đang chuẩn bị → khách gửi yêu cầu → khách thấy Chờ duyệt hủy. Quản lý vẫn phân công, thu tiền được; yêu cầu chưa khóa đơn.
2. Quản lý chọn Tiếp tục xử lý: chuyển sang trạng thái bán hàng tiếp theo và từ chối yêu cầu hủy trong cùng transaction. Khách thấy trạng thái mới và ghi chú Quản lý tiếp tục xử lý đơn, không chấp nhận yêu cầu hủy. Không hoàn tồn.
3. Quản lý chọn Chấp nhận hủy: orders.status chuyển cancelling (Đang hủy), ghi người/thời điểm chấp nhận. Khóa toàn bộ PATCH nghiệp vụ bán hàng; không được từ chối hoặc mở lại đơn sau bước này. Chưa hoàn tồn.
4. Chỉ sau Chấp nhận hủy mới xuất hiện Hoàn tất hủy: chuyển cancelled, hoàn tồn đúng một lần và kết thúc yêu cầu. API cũng chặn bỏ qua bước chấp nhận, bấm lặp hoặc thao tác sai cửa hàng.
5. Danh sách Yêu cầu hủy & trả hàng có cùng hai nút theo từng giai đoạn, không có đường duyệt một bước để bỏ qua chấp nhận. Luồng trả hàng vẫn theo xử lý duyệt/từ chối hiện có.

Trạng thái cancelling dùng cột VARCHAR status hiện có, không cần đổi schema. service_requests vẫn pending trong lúc đã chấp nhận nhưng chưa hoàn tất; giao diện nhận biết bằng trạng thái Đang hủy của đơn. Mọi quyết định được lưu order_history. Tự cập nhật giữa các tab cùng trình duyệt; khi dùng trình duyệt khác, quay lại tab/bấm Làm mới để lấy trạng thái.

Bộ kiểm thử hiện có 12 test, tất cả đạt: trước chấp nhận vẫn được thao tác; tiếp tục xử lý tự từ chối yêu cầu; sau chấp nhận chặn phân công/thu tiền/chuyển trạng thái và từ chối hủy; chỉ hoàn tồn lúc hoàn tất, không hoàn lặp. Đã kiểm tra giao diện trước/sau Chấp nhận hủy bằng database tạm riêng.
