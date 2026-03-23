## Use Case chính của hệ thống

### UC01 – Đăng nhập hệ thống

- **Tác nhân**: Admin, Tester, Viewer.
- **Mô tả**: Người dùng nhập email/mật khẩu để đăng nhập vào hệ thống.
- **Luồng chính**:
  1. Người dùng mở trang `/login`.
  2. Nhập email và mật khẩu.
  3. Hệ thống gửi yêu cầu tới API `/auth/login`.
  4. Backend xác thực thông tin, sinh JWT và trả về cho frontend.
  5. Frontend lưu JWT, điều hướng tới `/dashboard`.

### UC02 – Quản lý Project kiểm thử

- **Tác nhân**: Admin, Tester.
- **Mô tả**: Tạo/cập nhật/xoá project chứa kịch bản kiểm thử.

### UC03 – Quản lý Kịch bản kiểm thử (Test Script)

- **Tác nhân**: Tester.
- **Mô tả**: Tester định nghĩa kịch bản bằng cách tổ chức các bước (steps) với các từ khóa (keywords) như navigate, click, fill, assertText.

### UC04 – Quản lý Kho Đối tượng (Object Repository)

- **Tác nhân**: Tester.
- **Mô tả**: Lưu trữ và tái sử dụng các đối tượng UI với locator để dùng trong nhiều kịch bản.

### UC05 – Quản lý DataSet (Data-Driven Testing)

- **Tác nhân**: Tester.
- **Mô tả**: Tạo các bộ dữ liệu để chạy cùng một kịch bản với nhiều bộ input khác nhau.

### UC06 – Thực thi kịch bản

- **Tác nhân**: Tester.
- **Mô tả**: Tester chọn kịch bản và data set (nếu có), gửi yêu cầu thực thi.

### UC07 – Xem báo cáo & Dashboard

- **Tác nhân**: Admin, Tester, Viewer.
- **Mô tả**: Xem lịch sử các lần chạy, chi tiết kết quả từng bước, tỷ lệ Pass/Fail và thống kê lỗi.

### UC08 – Nhận thông báo lỗi qua Telegram

- **Tác nhân**: Admin, Tester, PM (qua kênh Telegram nội bộ).
- **Mô tả**: Khi một lần chạy kịch bản bị lỗi (bước fail), hệ thống tự động gửi thông báo tới Telegram để người liên quan nắm bắt kịp thời.
- **Luồng tóm tắt**:
  1. Tester khởi chạy kịch bản (`POST /runs`).
  2. Execution Service thực thi từng bước bằng Playwright.
  3. Khi một bước fail, hệ thống tạo `TestResult` và screenshot.
  4. Notification Service dựng message (tên script, Run ID, step, lỗi) và gọi Telegram Bot API.
  5. Người dùng nhận thông báo trong nhóm Telegram.

