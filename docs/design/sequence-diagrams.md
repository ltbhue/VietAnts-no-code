# Sơ đồ tuần tự (Sequence) – mô tả dạng văn bản

## 1. Đăng nhập (Login)

**Tác nhân**: User (Admin/Tester/Viewer)  
**Luồng**:
1. User mở trang `/login` trên frontend.
2. Frontend hiển thị form và nhận email/mật khẩu.
3. User nhấn nút **Đăng nhập** → Frontend gửi `POST /auth/login` (body: email, password).
4. Backend:
   - Controller `/auth/login` nhận request, validate bằng Zod.
   - Gọi Prisma `user.findUnique({ where: { email } })` để tìm user.
   - So sánh mật khẩu với `bcrypt.compare`.
   - Nếu đúng: sinh JWT chứa `sub`, `email`, `role`, trả về `{ token, user }`.
5. Frontend nhận JWT, lưu vào `localStorage`, chuyển hướng sang `/dashboard`.

## 2. Tải danh sách kịch bản

**Tác nhân**: Tester  
**Luồng**:
1. Tester đã đăng nhập, truy cập `/scripts`.
2. Frontend đọc JWT từ `localStorage`, gọi `GET /scripts` với header `Authorization: Bearer <token>`.
3. Middleware `authMiddleware` trên backend:
   - Kiểm tra header, verify JWT.
   - Gắn thông tin `req.user` (id, email, role).
4. Router `/scripts` gọi Prisma `testScript.findMany({ where: { createdById: req.user.id } })`.
5. Backend trả danh sách kịch bản, frontend hiển thị ở cột trái trang `/scripts`.

## 3. Thực thi kịch bản (Execution & Data-Driven)

**Tác nhân**: Tester  
**Luồng**:
1. Tester chọn 1 kịch bản, gửi yêu cầu thực thi qua API `POST /runs` (body: `scriptId`, tùy chọn `dataSetId`).  
2. Backend `/runs`:
   - Middleware xác thực JWT, kiểm tra role Tester/Admin.
   - Gọi `executeScriptRun({...})` trong `services/executor.ts`.
3. `executeScriptRun`:
   - Lấy script + steps bằng Prisma `testScript.findUnique(... include: steps ...)`.
   - Nếu có `dataSetId` → đọc `rows` từ `DataSet`.
   - Tạo bản ghi `TestRun` status `queued`.
4. Executor mở trình duyệt Playwright, tạo `Page`:
   - Với từng dòng dữ liệu (row) trong `DataSet.rows`:
     - Lần lượt duyệt từng `TestStep` theo `order`.
     - Gọi `runKeywordStep(page, keyword, parameters, row)` để thực hiện hành động (navigate/click/fill/assertText).
     - Ghi `TestResult` với status `passed` nếu không lỗi.
     - Nếu lỗi:
       - Screenshot trang hiện tại.
       - Tạo `TestResult` status `failed`, lưu message + đường dẫn screenshot.
       - Đánh dấu `TestRun` failed.
5. Sau khi chạy xong tất cả steps/data rows:
   - Cập nhật `TestRun.status` thành `passed`/`failed`, `finishedAt` = thời điểm kết thúc.
   - Trả về `TestRun` + `TestResult` cho caller (API `/runs`).

## 4. Xem báo cáo và Dashboard

**Tác nhân**: Tester/Viewer/Admin  
**Luồng**:
1. Người dùng mở trang `/reports`.
2. Frontend đọc JWT, gọi `GET /runs` để lấy danh sách TestRun.
3. Backend `/runs` trả dữ liệu gồm: script, startedAt, finishedAt, status.
4. Frontend tính toán và hiển thị:
   - Tổng số lần chạy.
   - Số Pass, Fail.
   - Bảng chi tiết các lần chạy gần đây.
5. Khi cần chi tiết cho một lần chạy, frontend/QA gọi `GET /runs/:id/results`:
   - Backend trả về TestRun + danh sách TestResult (từng bước).
   - QA có thể xem message, status từng bước, và mở file screenshot tương ứng nếu cần.

