## Ghi chú sơ đồ lớp (Class Diagram) – mô tả logic

### 1. Các lớp miền nghiệp vụ chính (theo schema Prisma)

- `User`
  - Thuộc tính: `id`, `email`, `password`, `fullName`, `role`, `createdAt`, `updatedAt`.
  - Quan hệ: sở hữu nhiều `Project`, thực thi nhiều `TestRun`, tạo nhiều `TestScript`.

- `Project`
  - Thuộc tính: `id`, `name`, `description`, `ownerId`, `createdAt`, `updatedAt`.
  - Quan hệ: thuộc về `User` (owner), chứa nhiều `TestScript`, `UiObject`, `DataSet`.

- `TestScript`
  - Thuộc tính: `id`, `name`, `description`, `projectId`, `createdById`, `createdAt`, `updatedAt`.
  - Quan hệ: thuộc về `Project`, thuộc về `User` (creator), chứa nhiều `TestStep`, nhiều `TestRun`.

- `TestStep`
  - Thuộc tính: `id`, `order`, `keyword`, `targetId`, `parameters`, `scriptId`.
  - Quan hệ: thuộc về `TestScript`, có thể tham chiếu `UiObject`.

- `UiObject`
  - Thuộc tính: `id`, `name`, `description`, `locator`, `projectId`, `createdAt`, `updatedAt`.
  - Quan hệ: thuộc về `Project`, có thể được nhiều `TestStep` dùng lại.

- `DataSet`
  - Thuộc tính: `id`, `name`, `description`, `rows`, `projectId`.
  - Quan hệ: thuộc về `Project`, có thể được liên kết với nhiều `TestRun`.

- `TestRun`
  - Thuộc tính: `id`, `startedAt`, `finishedAt`, `status`, `browser`, `scriptId`, `userId`, `dataSetId`.
  - Quan hệ: thuộc về `TestScript`, `User`, `DataSet` (tùy chọn), chứa nhiều `TestResult`.

- `TestResult`
  - Thuộc tính: `id`, `stepOrder`, `status`, `message`, `screenshot`, `log`, `createdAt`, `runId`.
  - Quan hệ: thuộc về `TestRun`.

### 2. Các lớp kỹ thuật chính ở backend

- `AuthRouter`
  - Nhiệm vụ: xử lý `/auth/register`, `/auth/login`.
  - Phụ thuộc: `PrismaClient`, `bcrypt`, `jsonwebtoken`.

- `AuthMiddleware`
  - Nhiệm vụ: đọc `Authorization` header, verify JWT, gắn `req.user`, kiểm tra role.

- `ProjectsRouter`, `ScriptsRouter`, `ObjectsRouter`, `DatasetsRouter`, `RunsRouter`
  - Nhiệm vụ: controller lớp API REST cho từng miền.
  - Phụ thuộc: `PrismaClient`, `AuthMiddleware`, `Zod` để validate dữ liệu vào.

- `ExecutorService`
  - Lớp chức năng: `executeScriptRun()`.
  - Phụ thuộc: `PrismaClient` (đọc/ghi TestRun và TestResult), `Playwright` (thực thi browser), mô hình dữ liệu (TestScript/TestStep/DataSet).

### 3. Lớp frontend (component)

- `LoginPage`
  - Gửi yêu cầu tới `/auth/login`, lưu JWT.

- `DashboardPage`
  - Gọi `/projects`, hiển thị danh sách project.

- `ScriptsPage`
  - Gọi `/scripts` và `/scripts/:id`, hiển thị danh sách kịch bản và chi tiết steps (keywords).

- `ReportsPage`
  - Gọi `/runs`, hiển thị dashboard Pass/Fail và chi tiết runs.

Các ghi chú này dùng để bạn vẽ lại sơ đồ lớp UML trong bản Word/Draw.io nếu cần cho đồ án.

