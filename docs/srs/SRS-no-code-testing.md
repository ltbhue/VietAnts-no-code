# Đặc tả yêu cầu phần mềm

## 1. Giới thiệu

Tài liệu này mô tả yêu cầu chi tiết cho **ứng dụng kiểm thử tự động no-code cho web** phục vụ Công ty Vietants, dành cho các vai trò không chuyên lập trình (QA, BA, PM).

## 2. Phạm vi

- Hệ thống cho phép:
  - Đăng ký, đăng nhập và phân quyền người dùng (Admin, Tester, Viewer).
  - Quản lý kịch bản kiểm thử dạng no-code với Record & Playback, chỉnh sửa bằng từ khóa (keyword actions) và kho đối tượng (Object Repository).
  - Thực thi kịch bản trên trình duyệt, hỗ trợ chạy data-driven với nhiều bộ dữ liệu.
  - Ghi nhận kết quả, screenshot, log lỗi và tổng hợp báo cáo, dashboard thống kê.
  - Gửi **thông báo lỗi kiểm thử** (notification) tới kênh Telegram nội bộ khi bước kiểm thử bị fail (tuỳ cấu hình).

Các phần kiểm thử hiệu năng, bảo mật chuyên sâu, desktop/mobile native và tích hợp với hệ thống test management phức tạp **không nằm trong phạm vi**.

## 3. Tác nhân

- **Admin**: quản lý người dùng, phân quyền, cấu hình hệ thống.
- **Tester**: tạo/sửa/xóa kịch bản, đối tượng, dữ liệu kiểm thử, chạy test, xem báo cáo.
- **Viewer**: xem báo cáo, dashboard nhưng không chỉnh sửa cấu hình hay kịch bản.

## 4. Yêu cầu chức năng (tóm tắt)

- **F1 – Identity Management**
  - F1.1: Đăng ký tài khoản mới (theo chính sách Vietants).
  - F1.2: Đăng nhập, đăng xuất an toàn (JWT-based).
  - F1.3: Quản lý vai trò, phân quyền theo role (Admin, Tester, Viewer).

- **F2 – Quản lý kịch bản kiểm thử**
  - F2.1: Record & Playback thao tác trên ứng dụng web mục tiêu.
  - F2.2: Chỉnh sửa kịch bản dạng trực quan bằng bước/từ khóa.
  - F2.3: Quản lý Object Repository (thêm/sửa/xóa đối tượng UI, locator).

- **F3 – Thực thi & Data Integration**
  - F3.1: Thực thi kịch bản trên trình duyệt (Playwright).
  - F3.2: Cấu hình data set và chạy data-driven.
  - F3.3: Lưu trữ lịch sử lần chạy, trạng thái, log.

- **F4 – Báo cáo & Analytics**
  - F4.1: Báo cáo chi tiết cho từng lần chạy (bước, kết quả, screenshot).
  - F4.2: Dashboard tổng quan: tỉ lệ Pass/Fail, lỗi phổ biến theo module/kịch bản.
  - F4.3: Gửi thông báo realtime tới Telegram khi TestRun/Step bị lỗi để QA/PM nắm bắt nhanh.

## 5. Yêu cầu phi chức năng

- Giao diện web hiện đại, dễ sử dụng cho người không biết code.
- Hệ thống có phân quyền rõ ràng, bảo mật JWT + hash mật khẩu.
- Hiệu năng đủ tốt cho quy mô nội bộ (số lượng tester/kịch bản vừa phải).
 - Hệ thống hỗ trợ tích hợp notification bên ngoài (Telegram) nhưng **không phụ thuộc cứng** – nếu Telegram lỗi thì luồng test chính vẫn chạy bình thường.

## 6. Công nghệ

- Backend: NodeJS (Express) + Prisma, PostgreSQL (Supabase).
- Frontend: Next.js 16 (TypeScript), Radix UI, chart library cho dashboard.

