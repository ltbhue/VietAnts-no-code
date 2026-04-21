# Test Plan - He Thong No-Code Testing

## 1. Muc tieu
Xac minh he thong dap ung 4 nhom chuc nang: Identity, Script Management, Execution/Data Integration, Reporting/Analytics.

## 2. Pham vi test
- API test qua Playwright request context.
- Integration test cho route moi va luong chinh.
- Smoke test cho health endpoint.

## 3. Moi truong
- Node.js 20+
- PostgreSQL
- API chay o `http://localhost:4000`
- Web chay o `http://localhost:3000`

## 4. Danh sach test case tieu bieu
### 4.1 Identity
- Register success.
- Register duplicate email -> 409.
- Register weak password -> 400.
- Login success -> co token.
- Login wrong password -> 401.
- `/auth/me` voi token hop le -> 200.

### 4.2 Script Management
- Tao script thanh cong.
- Update steps voi keyword hop le.
- Validate step schema sai -> 400.
- Tao testcase tu recorded step -> version 1 draft.
- Publish testcase pass validation -> lifecycle Published.

### 4.3 Execution/Data Integration
- Run script browser chromium/firefox/webkit.
- Run script voi dataset co rows -> sinh result theo row.
- Tao suite + run suite -> tao SuiteRun.
- CI trigger token sai -> 403.
- CI trigger token dung -> 202 va co runId.

### 4.4 Reporting/Analytics
- `GET /runs/:id/results` tra du lieu.
- `GET /runs/:id/report.pdf` tra PDF.
- `GET /runs/analytics` tra total/passed/failed/passRate/commonErrors.

## 5. Bo test da co trong repo
- `apps/api/tests/auth-login.spec.ts`
- `apps/api/tests/tests-routes.test.ts`
- `apps/api/tests/editor-publish.test.ts`
- `apps/api/tests/health-and-schema.test.ts`
- `apps/api/tests/suite-run.test.ts`
- `apps/api/tests/ci-trigger.test.ts`
- `apps/api/tests/e2e-mvp-flow.test.ts`

## 6. Lenh chay test khuyen nghi
```bash
cd apps/api
npx playwright test tests/tests-routes.test.ts tests/editor-publish.test.ts tests/health-and-schema.test.ts
npx playwright test tests/suite-run.test.ts tests/ci-trigger.test.ts tests/e2e-mvp-flow.test.ts
```

## 7. Tieu chi dat
- Tat ca test trong pham vi pass.
- Khong co loi bao mat hien nhien o luong auth.
- Cac endpoint bao cao/analytics phan hoi dung schema.
