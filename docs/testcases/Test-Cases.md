# Test Cases – Vietants No-code Testing

> Format: **ID | Module | Priority | Preconditions | Test Data | Steps | Expected | Actual | Status**

## A. Auth & RBAC

### TC-AUTH-01 – Register thành công
- **Module**: Auth
- **Priority**: High
- **Preconditions**: API chạy, DB trống hoặc chưa có email test.
- **Test Data**:
  - email: `new.user@vietants.com`
  - password: `Password123!`
  - fullName: `New User`
  - role: `TESTER`
- **Steps**:
  1. Gửi `POST /auth/register` với body trên.
- **Expected**:
  - Status `201`
  - Response có `id`, `email`, `fullName`, `role`, `createdAt`.
- **Actual**: …
- **Status**: …

### TC-AUTH-02 – Register trùng email
- **Module**: Auth
- **Priority**: High
- **Preconditions**: Email `tester@vietants.com` đã tồn tại (seed).
- **Test Data**: email `tester@vietants.com`, password bất kỳ, fullName bất kỳ.
- **Steps**:
  1. Gửi `POST /auth/register`.
- **Expected**:
  - Status `409`
  - `error = "Email already registered"`
- **Actual**: …
- **Status**: …

### TC-AUTH-03 – Login thành công
- **Module**: Auth
- **Priority**: Critical
- **Preconditions**: Có user seed `tester@vietants.com`/`Password123!`.
- **Test Data**: email `tester@vietants.com`, password `Password123!`.
- **Steps**:
  1. Gửi `POST /auth/login`.
- **Expected**:
  - Status `200`
  - Response có `token` và `user` (id/email/fullName/role).
- **Actual**: …
- **Status**: …

### TC-AUTH-04 – Login sai mật khẩu
- **Module**: Auth
- **Priority**: High
- **Preconditions**: Có user seed.
- **Test Data**: email `tester@vietants.com`, password `wrong`.
- **Steps**:
  1. Gửi `POST /auth/login`.
- **Expected**:
  - Status `401`
  - `error = "Invalid credentials"`
- **Actual**: …
- **Status**: …

### TC-RBAC-01 – Gọi API không có token
- **Module**: RBAC
- **Priority**: Critical
- **Preconditions**: API chạy.
- **Test Data**: none
- **Steps**:
  1. Gửi `GET /projects` không có header Authorization.
- **Expected**:
  - Status `401`
  - `error = "Missing authorization header"`
- **Actual**: …
- **Status**: …

### TC-RBAC-02 – Viewer không được tạo project
- **Module**: RBAC
- **Priority**: High
- **Preconditions**:
  - Có user role `VIEWER`.
  - Login lấy token viewer.
- **Test Data**: name `P1`.
- **Steps**:
  1. Gửi `POST /projects` với token viewer.
- **Expected**:
  - Status `403`
  - `error = "Forbidden"`
- **Actual**: …
- **Status**: …

## B. Project Management

### TC-PROJ-01 – Tạo project (Tester/Admin)
- **Module**: Project
- **Priority**: Critical
- **Preconditions**: Login Tester/Admin lấy token.
- **Test Data**: name `Project Demo`, description `Mô tả`.
- **Steps**:
  1. `POST /projects` với token.
- **Expected**:
  - `201`
  - Trả về project có `ownerId` = user hiện tại.
- **Actual**: …
- **Status**: …

### TC-PROJ-02 – List project (theo owner)
- **Module**: Project
- **Priority**: High
- **Preconditions**: User A có project; User B có token riêng.
- **Test Data**: none
- **Steps**:
  1. User A gọi `GET /projects`.
  2. User B gọi `GET /projects`.
- **Expected**:
  - Mỗi user chỉ thấy project của mình.
- **Actual**: …
- **Status**: …

## C. Test Script & Steps (Keywords)

### TC-SCRIPT-01 – Tạo test script hợp lệ
- **Module**: Script
- **Priority**: Critical
- **Preconditions**: Có `projectId` thuộc owner.
- **Test Data**: projectId, name `Login test`, description `...`
- **Steps**:
  1. `POST /scripts`.
- **Expected**: `201`, trả về script có `createdById` đúng user.
- **Actual**: …
- **Status**: …

### TC-SCRIPT-02 – Xem chi tiết script kèm steps
- **Module**: Script
- **Priority**: High
- **Preconditions**: Có script và steps.
- **Test Data**: scriptId
- **Steps**:
  1. `GET /scripts/:id`.
- **Expected**: `200`, có trường `steps` sắp xếp theo `order` tăng dần.
- **Actual**: …
- **Status**: …

### TC-STEP-01 – Cập nhật steps (replace all)
- **Module**: Steps
- **Priority**: High
- **Preconditions**: Có scriptId của user.
- **Test Data**: body `{ steps: [ {order:1, keyword:"navigate", parameters:{url:"..."}} ] }`
- **Steps**:
  1. `PUT /scripts/:id/steps`.
  2. `GET /scripts/:id`.
- **Expected**:
  - Steps mới được thay thế hoàn toàn theo body.
- **Actual**: …
- **Status**: …

## D. Object Repository

### TC-OBJ-01 – Tạo UI Object hợp lệ
- **Module**: Object Repo
- **Priority**: High
- **Preconditions**: Có projectId hợp lệ.
- **Test Data**: locator `#login-button`, name `Login Button`
- **Steps**:
  1. `POST /objects`.
- **Expected**: `201`, trả về object có `locator`.
- **Actual**: …
- **Status**: …

## E. DataSet (Data-driven)

### TC-DATA-01 – Tạo dataset với nhiều rows
- **Module**: DataSet
- **Priority**: High
- **Preconditions**: Có projectId hợp lệ.
- **Test Data**: rows `[{"email":"a@b.com"},{"email":"c@d.com"}]`
- **Steps**:
  1. `POST /datasets`.
- **Expected**: `201`, dataset lưu `rows` đúng.
- **Actual**: …
- **Status**: …

## F. Execution & Reporting

### TC-RUN-01 – Chạy kịch bản không dataset (single run)
- **Module**: Execution
- **Priority**: Critical
- **Preconditions**:
  - Có scriptId hợp lệ có steps.
  - Playwright cài và chạy được.
- **Test Data**: `{ "scriptId": "<id>" }`
- **Steps**:
  1. `POST /runs`.
  2. `GET /runs`.
- **Expected**:
  - `POST /runs` trả về `TestRun` có `status` `passed` hoặc `failed`.
  - `GET /runs` có record mới.
- **Actual**: …
- **Status**: …

### TC-RUN-02 – Chạy kịch bản data-driven
- **Module**: Execution
- **Priority**: High
- **Preconditions**: Có datasetId với >= 2 rows.
- **Test Data**: `{ "scriptId": "<id>", "dataSetId": "<id>" }`
- **Steps**:
  1. `POST /runs`.
  2. `GET /runs/:id/results`.
- **Expected**:
  - Có nhiều `TestResult` được tạo (tương ứng steps × rows).
- **Actual**: …
- **Status**: …

### TC-NOTIFY-01 – Gửi thông báo Telegram khi bước fail
- **Module**: Notification
- **Priority**: High
- **Preconditions**:
  - Đã cấu hình `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` hợp lệ trong `.env`.
  - Bot đã được thêm vào group/chat tương ứng.
  - Có kịch bản cố tình gây lỗi (ví dụ assertText sai).
- **Test Data**:
  - `scriptId` của kịch bản sai expected.
- **Steps**:
  1. Gửi `POST /runs` với `scriptId` đó.
  2. Quan sát group/chat Telegram sau khi run kết thúc.
- **Expected**:
  - Trong quá trình chạy, bước có lỗi tạo `TestResult` status `failed`.
  - Nhận được 1 tin nhắn Telegram gồm: tên script, Run ID, step order, nội dung lỗi.
- **Actual**: …
- **Status**: …

### TC-REPORT-01 – Trang Reports hiển thị đúng Pass/Fail
- **Module**: Reporting (UI)
- **Priority**: High
- **Preconditions**: Đã có dữ liệu runs (pass/fail).
- **Test Data**: none
- **Steps**:
  1. Đăng nhập.
  2. Mở `/reports`.
- **Expected**:
  - Tổng runs, pass, fail hiển thị đúng theo dữ liệu `/runs`.
  - Bảng có danh sách các lần chạy.
- **Actual**: …
- **Status**: …

### TC-EXPORT-01 – Export PDF báo cáo theo Run ID
- **Module**: Reporting (PDF Export)
- **Priority**: High
- **Preconditions**:
  - Đã đăng nhập và có token hợp lệ.
  - Có ít nhất 1 `runId` thuộc user hiện tại.
- **Test Data**: `runId`
- **Steps**:
  1. Gửi `GET /runs/:id/report.pdf` với header `Authorization: Bearer <token>`.
  2. Lưu file trả về.
- **Expected**:
  - Status `200`
  - `Content-Type: application/pdf`
  - Tải được file PDF chứa: thông tin script, run id, status, thời gian, bảng step results.
- **Actual**: …
- **Status**: …

