# Vietants No-code Testing – Đồ án tốt nghiệp

Ứng dụng kiểm thử tự động **no-code** cho các ứng dụng web nội bộ của Vietants, cho phép QA/BA/PM (không rành code) có thể thiết kế, thực thi và xem báo cáo kiểm thử một cách trực quan.

## 1. Cấu trúc dự án

- `apps/api`: Backend NodeJS (Express + Prisma + Playwright).
- `apps/web`: Frontend Next.js 16 (TypeScript).
- `docs/`: Tài liệu đồ án (SRS, thiết kế, ERD, use case, manual,...).

## 2. Chuẩn bị môi trường

- NodeJS 20+ và npm.
- PostgreSQL (hoặc dùng Prisma Postgres local theo `.env` mặc định trong `apps/api`).  

## 3. Backend – API

Vào thư mục API:

```bash
cd apps/api
```

### 3.1. Cấu hình DB

- File `.env` hiện đã có `DATABASE_URL` dạng `prisma+postgres://...` (Prisma Postgres local).  
- Có thể thay bằng URL PostgreSQL/Supabase của bạn theo tài liệu Prisma nếu muốn deploy thật.

**Tuỳ chọn – Cấu hình thông báo Telegram khi test fail**

Thêm vào `apps/api/.env`:

```bash
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

- Khi một bước kiểm thử trong `TestRun` bị **failed**, hệ thống sẽ gửi thông báo về Telegram với:
  - Tên script
  - Run ID
  - Thứ tự bước (step order)
  - Nội dung lỗi

**Tuỳ chọn – Auto create bug trên Linear khi test fail**

Thêm vào `apps/api/.env`:

```bash
LINEAR_API_KEY=xxx            # Linear API key (Personal API key)
LINEAR_TEAM_ID=yyy            # ID của team cần tạo issue
```

- Khi một bước kiểm thử bị **failed**, ngoài Telegram hệ thống sẽ tự động tạo **issue mới trên Linear** với:
  - Tiêu đề dạng `[Test Fail] <tên script> – step <n>`
  - Nội dung: Run ID, step order, thông tin lỗi, mô tả ngắn.

### 3.2. Migrate + Generate + Seed

```bash
npm run prisma:migrate   # tạo bảng theo schema.prisma
npm run prisma:generate  # sinh Prisma Client
npm run prisma:seed      # tạo admin, tester, project, script, steps, dataset mẫu
```

Thông tin tài khoản seed:

- Admin: `admin@vietants.com` / `Password123!`
- Tester: `tester@vietants.com` / `Password123!`

### 3.3. Chạy server API

```bash
npm run dev
```

API chạy ở `http://localhost:4000` (mặc định).

Các endpoint chính:

- `POST /auth/register`, `POST /auth/login`
- `GET/POST/PUT/DELETE /projects`
- `GET/POST/PUT/DELETE /scripts` và `PUT /scripts/:id/steps`
- `GET/POST/PUT/DELETE /objects`
- `GET/POST/PUT/DELETE /datasets`
- `GET/POST /runs`, `GET /runs/:id/results`
- `GET /runs/:id/report.pdf` (export PDF báo cáo theo run)

## 4. Frontend – Next.js

Vào thư mục web:

```bash
cd apps/web
```

Tạo file `.env.local` (nếu cần) với:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Chạy dev:

```bash
npm run dev
```

Frontend mặc định ở `http://localhost:3000`.

Các màn hình chính:

- `/`: Trang giới thiệu, nút đi tới đăng nhập.
- `/login`: Đăng nhập, gọi API `/auth/login`.
- `/dashboard`: Dashboard project + điều hướng.
- `/scripts`: Danh sách kịch bản, hiển thị steps (keywords).
- `/reports`: Thống kê Pass/Fail, bảng runs.

## 5. Bộ tài liệu đồ án

Trong thư mục `docs/`:

- `srs/SRS-no-code-testing.md`: Đặc tả yêu cầu phần mềm (SRS).
- `design/ERD-no-code-testing.md`: Mô hình ERD.
- `design/architecture-overview.md`: Kiến trúc tổng quan.
- `design/use-cases.md`: Use case chính.
- `design/sequence-diagrams.md`: Mô tả sequence diagram.
- `design/class-diagram-notes.md`: Ghi chú sơ đồ lớp.
- `manual/user-manual.md`: Hướng dẫn sử dụng cho người dùng.

Bạn có thể dùng các file này để copy/chuyển sang Word, vẽ sơ đồ UML, bổ sung hình ảnh để hoàn thiện báo cáo tốt nghiệp.

