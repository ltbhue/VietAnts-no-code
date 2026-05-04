# Bộ tài liệu hệ thống

Tài liệu được tổ chức theo 3 lớp:

- `srs/`: đặc tả yêu cầu.
- `design/`: thiết kế chi tiết theo từng chủ đề.
- `final/`: tài liệu dùng để nộp/đóng gói cuối kỳ.

## Tài liệu khuyến nghị đọc theo thứ tự

1. `docs/final/01-srs.md`
2. `docs/final/02-architecture-and-design.md`
3. `docs/final/03-test-plan.md`
4. `docs/final/04-user-manual.md`
5. `docs/final/06-system-architecture-diagrams.md`  ← bộ sơ đồ tổng hợp mới nhất

## Ghi chú đồng bộ

- Bộ sơ đồ ở `06-system-architecture-diagrams.md` đã cập nhật theo codebase hiện tại:
  - Backend: Express + Prisma + Playwright.
  - Frontend: Next.js App Router.
  - Phân quyền: ADMIN / TESTER / VIEWER.
  - Truy cập project theo owner + thành viên (`ProjectMember`).
- Khi thay đổi schema hoặc luồng nghiệp vụ, ưu tiên cập nhật file này trước, sau đó mới cập nhật các tài liệu còn lại.

