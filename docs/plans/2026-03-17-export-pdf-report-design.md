# Design – Export PDF báo cáo TestRun (2026-03-17)

## Mục tiêu

Thêm chức năng **Export PDF báo cáo** cho một lần chạy kiểm thử (`TestRun`) để:
- QA/PM tải về, gửi mail, lưu hồ sơ regression.
- Tạo output “đẹp – đồng nhất – 1 nút tải” phục vụ demo/nộp đồ án.

## Phạm vi

- Export PDF cho **1 TestRun cụ thể** (kèm danh sách `TestResult`).
- Quyền truy cập theo cơ chế hiện có: user chỉ xem/export các run của mình (hoặc có thể mở rộng theo Project sharing sau).

## API đề xuất

### Endpoint

- `GET /runs/:id/report.pdf`

### Auth/RBAC

- Bắt buộc JWT.
- Vai trò được phép: `ADMIN`, `TESTER`, `VIEWER`.
- Authorization: chỉ export được run thuộc `userId` của token (đồng bộ với `GET /runs` hiện tại).

### Response

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="testrun-<runId>.pdf"`
- Body: PDF bytes

## Cách tạo PDF (khuyến nghị)

**Backend dùng Playwright (Chromium) render HTML → PDF**:
- Tạo HTML template report (inline CSS, print-friendly).
- Headless Chromium render content và gọi `page.pdf({ format: "A4", printBackground: true })`.
- Trả buffer PDF trực tiếp cho client (stream/Buffer).

**Lý do chọn**
- PDF đẹp, đồng nhất giữa máy.
- Tạo file 1 click, không phụ thuộc “Print to PDF” của người dùng.

## Nội dung PDF

- Header: tên hệ thống, thời điểm xuất.
- Thông tin Run:
  - Script name, Run ID, status, browser, startedAt, finishedAt.
- Summary:
  - Tổng steps, passed, failed.
- Bảng Steps:
  - Step order, status, message, screenshot path (nếu có).
- Footer: thông tin phiên bản/đồ án.

## Lỗi & xử lý ngoại lệ

- Nếu run không tồn tại hoặc không thuộc user: `404`.
- Nếu Playwright render lỗi: trả `500` + log server.
- Nếu screenshot path không tồn tại: vẫn hiển thị text path (không fail export).

## Kiểm thử

Thêm test case:
- Export PDF thành công (status 200, pdf bytes).
- Unauthorized export (401).
- Export run không thuộc user (404).

