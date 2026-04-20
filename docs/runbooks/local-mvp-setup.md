# Chạy MVP nội bộ (API + Web)

1. Cài dependency: từ thư mục gốc repo, chạy `pnpm install` hoặc `npm install` theo lockfile dự án.
2. Tạo file `apps/api/.env` với `DATABASE_URL` (PostgreSQL) và `JWT_SECRET`.
3. API: `cd apps/api` → `npx prisma migrate deploy` (hoặc `prisma migrate dev` khi phát triển) → `npx prisma generate` → `npm run dev` (mặc định cổng 4000).
4. Web: `cd apps/web` → `npm run dev` (mặc định cổng 3000), đặt `NEXT_PUBLIC_API_URL=http://localhost:4000` nếu cần.
5. Đăng nhập qua trang `/login` rồi dùng các trang Recorder / Biên tập / Suite để gọi API thử.

## Biến tùy chọn

- `CI_API_TOKEN`: token cho pipeline gọi `POST /ci/trigger-suite`.
