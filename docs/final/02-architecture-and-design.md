# Kien Truc va Thiet Ke He Thong

## 1. Tong quan kien truc
He thong su dung kien truc 3 lop:
1. Presentation: Next.js (`apps/web`).
2. Application/API: Express (`apps/api/src/routes/*`).
3. Data: PostgreSQL qua Prisma (`apps/api/prisma/schema.prisma`).

## 2. Thanh phan backend
- `server.ts`: mount route module.
- `routes/auth.ts`: auth + RBAC endpoint can ban.
- `routes/projects.ts`, `scripts.ts`, `objects.ts`, `datasets.ts`.
- `routes/tests.ts`: luong no-code testcase.
- `routes/suites.ts`, `suiteRuns.ts`: regression suite.
- `routes/runs.ts`: script run + analytics + report.
- `routes/ci.ts`: CI trigger.
- `services/executor.ts`: Playwright executor (browser + data driven).
- `services/suite-runner.ts`: suite run orchestrator (MVP).

## 3. Mo hinh du lieu chinh
- Identity: `User(Role)`.
- Nghiep vu script cu: `Project`, `TestScript`, `TestStep`, `UiObject`, `DataSet`, `TestRun`, `TestResult`.
- Nghiep vu suite moi: `TestCase`, `TestCaseVersion`, `TestSuite`, `TestSuiteItem`, `SuiteRun`.

## 4. Luong xu ly chinh
### 4.1 Script run
1. User goi `POST /runs`.
2. API validate payload + quyen.
3. `executor.ts` chay step tren browser duoc chon.
4. Ket qua tung step luu vao `TestResult`.
5. Tong ket run luu vao `TestRun`.

### 4.2 Suite run
1. User tao suite tu danh sach `testCaseVersion`.
2. User goi `POST /suites/:suiteId/runs`.
3. `suite-runner.ts` xu ly item theo thu tu.
4. Ket qua tong hop luu JSON trong `SuiteRun.results`.

### 4.3 CI trigger
1. Pipeline goi `POST /ci/trigger-suite` voi bearer token.
2. API xac thuc token qua `CI_API_TOKEN`.
3. Tao `SuiteRun` trigger=`ci` + build/commit metadata.
4. Tra `runId` de theo doi.

## 5. Bao mat va phan quyen
- Middleware `authMiddleware` doc JWT.
- `requireRole` chan route theo vai tro.
- Dang ky user thong thuong khong tu cap role ADMIN.
- Endpoint cap quyen cao chi ADMIN duoc goi.

## 6. Thiet ke frontend
- `AppShell`: menu chuc nang + logout.
- Page login: luu `authToken` va `authUser` vao localStorage.
- Dashboard: thong ke pass/fail + common errors.
- Recorder/Editor/Suite pages: thao tac no-code va trigger API.

## 7. Trade-off hien tai
- Suite runner moi dang o muc MVP, can nang cap de chay Playwright chi tiet nhu script runner.
- Analytics hien tai o muc aggregate co ban, chua co trend theo khung thoi gian.
