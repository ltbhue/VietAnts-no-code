# Test Plan – Vietants No-code Testing

## 1. Mục tiêu

- Xác nhận hệ thống đáp ứng các chức năng theo SRS: **Auth/RBAC**, **quản lý project**, **kịch bản/steps (keywords)**, **object repository**, **dataset**, **thực thi (Playwright)**, **báo cáo**.
- Đảm bảo các luồng chính chạy ổn định và đúng quyền truy cập theo vai trò: **Admin/Tester/Viewer**.

## 2. Phạm vi kiểm thử

- **In-scope**
  - API backend: `/auth`, `/projects`, `/scripts`, `/objects`, `/datasets`, `/runs`.
  - UI frontend: `/login`, `/dashboard`, `/scripts`, `/reports`.
  - Data-driven execution với DataSet (nhiều rows).
  - Ghi nhận kết quả run/step, screenshot khi lỗi.

- **Out-of-scope**
  - Performance testing, security testing chuyên sâu (pentest), mobile/desktop native.
  - Tích hợp hệ thống quản lý test chuyên nghiệp bên thứ ba.

## 3. Môi trường kiểm thử

- OS: Windows 10/11
- NodeJS: 20+
- DB: PostgreSQL (local hoặc Supabase)
- Trình duyệt: Chromium (Playwright)

## 4. Chiến lược kiểm thử

- **API testing**
  - Dùng Postman: kiểm thử request/response, status code, phân quyền JWT.
  - Kiểm thử CRUD, validation, unauthorized/forbidden.

- **UI testing (manual)**
  - Kiểm tra các trang chính, điều hướng, lỗi đăng nhập, hiển thị dữ liệu.

- **Execution testing**
  - Tạo script + steps hợp lệ và chạy `/runs` để sinh `TestRun/TestResult`.
  - Kiểm tra screenshot/log khi bước fail.
  - Kiểm tra **thông báo Telegram** được gửi khi có bước fail (khi đã cấu hình bot token & chat id).

## 5. Tiêu chí vào/ra (Entry/Exit)

- **Entry**
  - Backend chạy được (`/health` OK), DB kết nối được.
  - Đã migrate + seed (ít nhất có 1 user + 1 project + 1 script).

- **Exit**
  - 100% test case mức Critical/High pass.
  - Các lỗi Medium/Low có ghi nhận trong mục Issues (nếu có).

## 6. Rủi ro

- Script demo phụ thuộc website mục tiêu (selector thay đổi → test fail).
- Quyền truy cập cần chặt chẽ theo role; thiếu check có thể gây lộ dữ liệu.
- Kết nối Telegram phụ thuộc mạng/Telegram; nếu Telegram lỗi cần đảm bảo không ảnh hưởng tới kết quả thực thi test.

