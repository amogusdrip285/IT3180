# Sổ Tay Hướng Dẫn Sử Dụng Web BlueMoon (Tiếng Việt)

Tài liệu này hướng dẫn sử dụng các chức năng chính của webapp BlueMoon theo luồng nghiệp vụ cơ bản cho đồ án.

## 1) Đăng nhập và ngôn ngữ

- Mở web tại `http://localhost:3000` (hoặc URL deploy).
- Nhập tên đăng nhập/email và mật khẩu.
- Sau khi vào hệ thống, dùng nút chuyển ngôn ngữ ở góc trên để chọn Việt/Anh.

## 2) Tổng quan giao diện

- Thanh điều hướng bên trái gồm các mục:
  - Tổng quan
  - Danh mục khoản thu
  - Đợt thu
  - Nghĩa vụ & Thu phí
  - Hộ khẩu
  - Nhân khẩu
  - Biến động cư trú
  - Người dùng
  - Báo cáo
- Trên mobile có thanh tác vụ nhanh ở cuối màn hình.

## 3) Tìm kiếm và lọc

- Ô "Tìm kiếm toàn cục" cho phép tìm theo:
  - Mã căn hộ, chủ hộ, cư dân
  - Mã phiếu thu, người thu, người nộp
- Bộ lọc tháng/năm áp dụng cho các bảng và biểu đồ liên quan thu phí.

## 4) Quản lý hộ khẩu

Trong tab "Hộ khẩu":

- Thêm mới hộ với thông tin:
  - Căn hộ, tầng, chủ hộ, số điện thoại
  - Liên hệ khẩn cấp (tên/sđt)
  - Số chỗ xe
  - Ngày vào ở
  - Trạng thái sở hữu (chủ/thuê)
  - Ngày hết hạn hợp đồng (nếu thuê)
  - Diện tích
- Xem danh sách hộ và gửi nhanh log nhắc đóng phí cho từng hộ.
- Xem timeline lịch sử nhắc phí (channel, trạng thái, thời gian, ghi chú).

## 5) Quản lý nhân khẩu và biến động cư trú

Tab "Nhân khẩu":

- Thêm nhân khẩu theo căn hộ.
- Nhập họ tên, ngày sinh, giới tính, CCCD/CMND, loại cư trú.

Tab "Biến động cư trú":

- Ghi nhận tạm trú, tạm vắng, chuyển đến, chuyển đi.
- Theo dõi timeline các biến động gần nhất.

## 6) Danh mục khoản thu và đợt thu

Tab "Danh mục khoản thu":

- Tạo khoản thu bắt buộc/tự nguyện, theo m2 hoặc cố định.
- Khai báo metadata chính sách:
  - Ngày ân hạn
  - Quy tắc phạt trễ
  - Hiệu lực từ ngày/đến ngày
  - Ghi chú chính sách

Tab "Đợt thu":

- Tạo đợt thu theo tháng/năm và loại phí.
- Theo dõi danh sách các đợt hiện có.

## 7) Nghĩa vụ và thu phí

Trong tab "Nghĩa vụ & Thu phí":

- Chọn nghĩa vụ cần thu.
- Nhập số tiền, hình thức thanh toán, người thu.
- Bổ sung thông tin thanh toán mở rộng:
  - Người nộp
  - SĐT người nộp
  - Mã giao dịch ngân hàng
  - URL chứng từ
  - Ghi chú hoàn tác
  - Ghi chú nghiệp vụ
- Theo dõi timeline giao dịch mới nhất.

## 8) Dashboard và phân tích

Tab "Tổng quan":

- KPI: tổng phải thu, đã thu, còn nợ, hộ đã đóng đủ.
- Biểu đồ histogram theo tháng, theo loại phí.
- Bấm vào cột biểu đồ theo tháng để drilldown giao dịch tương ứng.
- Khối "Cần chú ý":
  - Hộ sắp hết hạn hợp đồng
  - Lượt nhắc phí gửi thất bại
- Khối quỹ tự nguyện và tuổi nợ.

## 9) Báo cáo

Tab "Báo cáo":

- Biểu đồ tỷ lệ thu theo tháng.
- Biểu đồ nợ theo tuổi nợ.
- Bảng giao dịch có thể bật/tắt cột hiển thị:
  - Phiếu thu, kỳ, loại phí, số tiền, hình thức, người thu, người nộp, mã GD.
- Bảng top người thu và hiệu quả thu theo tầng.

## 10) Quản trị người dùng

Tab "Người dùng" (phù hợp quyền ADMIN):

- Tạo tài khoản theo vai trò.
- Xem trạng thái tài khoản và nhật ký thao tác hệ thống.

## 11) Quyền truy cập cơ bản

- ADMIN: toàn quyền hệ thống.
- ACCOUNTANT: đọc/ghi module thu phí, đọc báo cáo.
- TEAM_LEADER: đọc/ghi module cư trú, đọc module thu phí/báo cáo.

## 12) Xử lý lỗi thường gặp

- Không đăng nhập được:
  - Kiểm tra username/email và mật khẩu.
  - Nếu nhập sai nhiều lần có thể bị khóa tạm thời.
- Dữ liệu không hiển thị:
  - Bấm làm mới trang.
  - Kiểm tra đã seed dữ liệu chưa (`npm run db:seed`).
- API lỗi quyền:
  - Kiểm tra vai trò tài khoản có đúng chức năng hay không.
