# Tai Lieu Tong Quan He Thong No-Code Testing

## 1. Thong tin de tai
- Ten de tai: He thong kiem thu tu dong no-code cho ung dung web.
- Don vi ung dung: Team QA/BA/PO noi bo Vietants.
- Muc tieu: Giam thoi gian tao test, mo rong nguoi dung khong can code, va gate chat luong release bang suite + CI.

## 2. Pham vi he thong da hoan thien
### 2.1 Identity Management
- Dang ky tai khoan voi chinh sach mat khau toi thieu (do dai, chu hoa, chu thuong, so).
- Dang nhap va cap JWT token.
- Endpoint profile hien tai (`GET /auth/me`).
- Phan quyen theo vai tro: `ADMIN`, `TESTER`, `VIEWER`.

### 2.2 Test Script Management
- CRUD script kiem thu va quan ly buoc test theo keyword (`navigate`, `click`, `fill`, `assertText`).
- Chuc nang no-code tao test case tu recorded step (`POST /projects/:projectId/tests`).
- Publish test case sau khi validate nghiep vu editor (`/publish`).
- Object Repository (`/objects`) de tai su dung locator UI.

### 2.3 Execution va Data Integration
- Thuc thi script voi Playwright.
- Ho tro browser `chromium`, `firefox`, `webkit`.
- Data-driven testing qua `DataSet.rows`.
- Quan ly suite va suite run (`TestSuite`, `SuiteRun`).
- Trigger tu CI voi token (`POST /ci/trigger-suite`).

### 2.4 Reporting va Analytics
- Luu ket qua theo tung step (`TestResult`), co message/screenshot khi fail.
- Endpoint report PDF run (`GET /runs/:id/report.pdf`).
- Dashboard thong ke run tong quan, pass/fail, pass rate, loi pho bien (`GET /runs/analytics`).

## 3. Kien truc trien khai
- Frontend: Next.js (`apps/web`).
- Backend: Express + Prisma + Playwright (`apps/api`).
- DB: PostgreSQL qua Prisma.
- Tai lieu bo sung: `docs/final/`.

## 4. Ket qua xac minh
- Da thuc thi bo test route chinh:
  - `tests-routes.test.ts`
  - `editor-publish.test.ts`
  - `health-and-schema.test.ts`
  - `suite-run.test.ts`
  - `ci-trigger.test.ts`
  - `e2e-mvp-flow.test.ts`
- Ket qua moi nhom test: pass.

## 5. Gioi han va huong phat trien tiep
- Suite runner hien theo huong MVP (stub ket qua trong phan suite moi), co the nang cap day du Playwright flow cho suite.
- Recorder hien o muc API + UI thao tac no-code co ban, co the nang cap browser capture tu dong full luong.
- Co the them retry policy, alerting, va dashboard time-series nang cao.

## 6. Danh sach tai lieu chinh
- `docs/final/01-srs.md`
- `docs/final/02-architecture-and-design.md`
- `docs/final/03-test-plan.md`
- `docs/final/04-user-manual.md`
- `docs/final/05-final-report-summary.md`
