## Kiến trúc tổng quan hệ thống kiểm thử no-code Vietants

### 1. Tổng quan

Hệ thống được chia thành 3 lớp chính:

- **Frontend**: Ứng dụng web Next.js 16 (TypeScript) cung cấp giao diện:
  - Đăng nhập, dashboard.
  - Quản lý project, kịch bản, kho đối tượng, dataset.
  - Xem lịch sử thực thi, báo cáo và dashboard pass/fail.
- **Backend API**: NodeJS (Express) + Prisma với các module:
  - Auth & Identity.
  - Project & Script Management.
  - Object Repository & Dataset.
  - Execution Service (Playwright) & Reporting.
  - Notification Service: tích hợp Telegram Bot API để gửi thông báo khi test fail.
- **Database**: PostgreSQL (Supabase) được ánh xạ thông qua Prisma ORM.

### 2. Luồng chính

1. Người dùng đăng nhập qua frontend → gọi API `/auth/login` → nhận JWT.
2. Frontend lưu JWT và dùng trong header để gọi các API `/projects`, `/scripts`, `/objects`, `/datasets`, `/runs`.
3. Tester tạo project, định nghĩa kịch bản (steps + keywords), Object Repository và DataSet.
4. Khi thực thi, frontend (hoặc Postman) gọi `/runs` với `scriptId` + `dataSetId` → Execution Service dùng Playwright chạy các bước, lưu TestRun/TestResult, screenshot.
5. Nếu bước nào fail, Execution Service gọi Notification Service → Telegram Bot API gửi thông báo lỗi tới kênh Chat nội bộ.
6. Frontend trang `reports` lấy dữ liệu `/runs` và `/runs/:id/results` để hiển thị báo cáo + thống kê.

### 3. Các module backend chính

- `routes/auth.ts`: đăng ký, đăng nhập, cấp JWT.
- `middleware/auth.ts`: xác thực JWT và kiểm tra role (Admin/Tester/Viewer).
- `routes/projects.ts`: CRUD project.
- `routes/scripts.ts`: CRUD test script, quản lý steps (keywords).
- `routes/objects.ts`: CRUD Object Repository.
- `routes/datasets.ts`: CRUD DataSet (dữ liệu cho data-driven testing).
- `services/executor.ts`: thực thi kịch bản bằng Playwright, tạo TestRun/TestResult, screenshot.
- `routes/runs.ts`: khởi chạy kịch bản, xem lịch sử và kết quả chi tiết.

### 4. Các trang frontend chính

- `/` (home): giới thiệu ngắn, điều hướng tới login.
- `/login`: form đăng nhập, gọi API `/auth/login`.
- `/dashboard`: hiển thị các project, điều hướng tới kịch bản và báo cáo.
- `/scripts`: danh sách kịch bản và chi tiết steps (record & keywords).
- `/reports`: thống kê Pass/Fail, bảng chi tiết các lần chạy.

