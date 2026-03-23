# Mô hình ERD – Hệ thống kiểm thử no-code

## Thực thể chính

- **User**
  - Trường: id, email, password, fullName, role (ADMIN/TESTER/VIEWER), createdAt, updatedAt.
  - Quan hệ:
    - 1–N với `Project` (User là owner).
    - 1–N với `TestRun` (User thực thi).
    - 1–N với `TestScript` (User là người tạo).

- **Project**
  - Trường: id, name, description, ownerId, createdAt, updatedAt.
  - Quan hệ:
    - N–1 với `User` (owner).
    - 1–N với `TestScript`.
    - 1–N với `UiObject`.
    - 1–N với `DataSet`.

- **TestScript**
  - Trường: id, name, description, projectId, createdById, createdAt, updatedAt.
  - Quan hệ:
    - N–1 với `Project`.
    - N–1 với `User` (creator).
    - 1–N với `TestStep`.
    - 1–N với `TestRun`.

- **TestStep**
  - Trường: id, order, keyword, targetId, parameters, scriptId.
  - Quan hệ:
    - N–1 với `TestScript`.
    - N–1 với `UiObject` (tùy chọn).

- **UiObject**
  - Trường: id, name, description, locator, projectId, createdAt, updatedAt.
  - Quan hệ:
    - N–1 với `Project`.
    - 1–N với `TestStep`.

- **DataSet**
  - Trường: id, name, description, rows (JSON), projectId.
  - Quan hệ:
    - N–1 với `Project`.
    - 1–N với `TestRun`.

- **TestRun**
  - Trường: id, startedAt, finishedAt, status, browser, scriptId, userId, dataSetId.
  - Quan hệ:
    - N–1 với `TestScript`.
    - N–1 với `User`.
    - N–1 với `DataSet` (tùy chọn).
    - 1–N với `TestResult`.

- **TestResult**
  - Trường: id, stepOrder, status, message, screenshot, log, createdAt, runId.
  - Quan hệ:
    - N–1 với `TestRun`.

Tài liệu này dùng để minh họa ERD trong báo cáo phân tích thiết kế (SRS/Design) và làm cơ sở triển khai schema Prisma/PostgreSQL.

