---
marp: true
title: Ứng dụng kiểm thử tự động No-code cho Vietants
paginate: true
theme: default
---

## Ứng dụng kiểm thử tự động No-code cho Vietants

- **Sinh viên**: …
- **GVHD**: …
- **Đơn vị**: …
- **Thời gian**: 2026

---

## 1. Bối cảnh & Vấn đề

- Vietants có nhiều dự án web cần **kiểm thử chức năng/hồi quy** thường xuyên
- QA/BA/PM **không chuyên lập trình** gặp khó khi viết automation code
- Công cụ cần:
  - Tạo kịch bản trực quan (no-code)
  - Chạy tự động trên trình duyệt
  - Báo cáo kết quả chi tiết, dễ đọc

---

## 2. Mục tiêu đề tài

- Xây dựng **web app no-code testing** cho Vietants
- Cho phép người dùng:
  - **Đăng nhập + phân quyền** (Admin/Tester/Viewer)
  - **Tạo/Sửa/Thực thi** kịch bản kiểm thử (keywords + record/playback)
  - **Data-driven testing** (chạy nhiều bộ dữ liệu)
  - **Báo cáo & dashboard** Pass/Fail, lỗi phổ biến

---

## 3. Phạm vi

- **Trong phạm vi**
  - Web functional + regression testing
  - Kịch bản theo bước (keyword-driven)
  - Object Repository, DataSet, Execution, Reporting

- **Ngoài phạm vi**
  - Performance testing, security testing chuyên sâu
  - Desktop/mobile native
  - Tích hợp test management phức tạp

---

## 4. Công nghệ sử dụng

- **Frontend**: Next.js 16 + TypeScript
- **Backend**: Node.js (Express)
- **ORM**: Prisma
- **DB**: PostgreSQL (Supabase / local)
- **Execution**: Playwright (Chromium)
- **Notification**: Telegram Bot API (thông báo khi test fail)
- **API Test**: Postman

---

## 5. Kiến trúc tổng quan

- **Frontend (Next.js)**: UI quản lý kịch bản + báo cáo
- **Backend (Express API)**: Auth, CRUD, execution service
- **Database (PostgreSQL)**: lưu users/projects/scripts/steps/runs/results

Luồng: Login → Quản lý dữ liệu test → Run → Report/Dashboard

---

## 6. Các phân hệ chức năng chính

1) **Identity & RBAC**
2) **Test Script Management**
   - Keywords steps
   - Record & Playback (định hướng)
   - Object Repository
3) **Execution & Data Integration**
   - DataSet, data-driven run
4) **Reporting & Analytics**
   - Run history, Pass/Fail, lỗi & screenshot

---

## 7. Thiết kế dữ liệu (ERD)

Các bảng chính:
- `User` (role)
- `Project`
- `TestScript` – `TestStep`
- `UiObject` (Object Repository)
- `DataSet`
- `TestRun` – `TestResult`

Mục tiêu: truy vết đầy đủ từ script → run → result/screenshot.

---

## 8. Thiết kế keyword steps (No-code)

Mỗi bước gồm:
- `order`: thứ tự
- `keyword`: hành động (navigate/click/fill/assertText…)
- `parameters`: JSON tham số (url/selector/value/expected…)
- `targetId` (tuỳ chọn): tham chiếu đối tượng UI trong Object Repo

Ưu điểm:
- Dễ tạo/sửa bằng UI
- Dễ mở rộng keywords mới

---

## 9. Luồng thực thi (Execution)

- Tạo `TestRun` (queued/running/passed/failed)
- Playwright mở Chromium và chạy steps theo `order`
- Với DataSet:
  - lặp qua nhiều `rows`
  - ghi `TestResult` theo từng bước
- Nếu lỗi:
  - chụp screenshot
  - lưu message/log
  - đánh dấu run failed
  - gửi thông báo qua Telegram (nếu đã cấu hình bot + chat)

---

## 10. Báo cáo & Dashboard

Hiển thị:
- Tổng số lần chạy
- Số **Pass/Fail**
- Danh sách runs gần đây
- Export PDF báo cáo theo từng lần chạy (phục vụ gửi mail/nộp minh chứng)
- (mở rộng) lỗi phổ biến theo keyword/step

Giá trị:
- Dễ theo dõi regression
- QA/PM có báo cáo nhanh, trực quan

---

## 11. Demo chức năng (kịch bản trình bày)

1) Đăng nhập hệ thống (`/login`)
2) Xem dashboard project (`/dashboard`)
3) Xem danh sách kịch bản & steps (`/scripts`)
4) Chạy kịch bản (API `POST /runs`)
5) Xem báo cáo (`/reports`)

---

## 12. Kiểm thử (Test Plan & Test Cases)

Đã xây dựng:
- **Test Plan**: mục tiêu, phạm vi, môi trường, entry/exit, rủi ro
- **Test Cases**: Auth/RBAC, CRUD project/script/object/dataset, run/report

Mục tiêu: đảm bảo luồng chính hoạt động ổn định, đúng quyền.

---

## 13. Kết quả đạt được

- Hoàn thiện hệ thống gồm:
  - Backend API + DB schema + seed data
  - Frontend UI: login/dashboard/scripts/reports
  - Execution service (Playwright) + lưu run/results
  - Bộ tài liệu: SRS, ERD, kiến trúc, use case, sequence/class notes, manual, testcases

---

## 14. Hạn chế & Hướng phát triển

**Hạn chế**
- UI chỉnh sửa steps còn đơn giản (chủ yếu thao tác qua API cho demo)
- Keywords chưa đầy đủ cho mọi tình huống

**Hướng phát triển**
- UI kéo-thả (drag & drop) steps + record/playback thật sự
- Mở rộng keywords (wait, upload, api check, visual compare…)
- Dashboard lỗi phổ biến, export report PDF/HTML

---

## 15. Kết luận

- Đề tài giải quyết nhu cầu automation cho người không biết code
- Mô hình keyword-driven + object repo + data-driven phù hợp nội bộ Vietants
- Hệ thống đã có nền tảng để mở rộng thành công cụ no-code testing hoàn chỉnh

**Xin cảm ơn!**

