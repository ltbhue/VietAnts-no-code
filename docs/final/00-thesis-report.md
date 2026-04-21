# BAO CAO DO AN TOT NGHIEP

## De tai
Xay dung he thong kiem thu tu dong no-code cho ung dung web

## Loi mo dau
Trong boi canh chu ky phat hanh phan mem ngay cang ngan, nhu cau tu dong hoa kiem thu de dam bao chat luong san pham tro thanh yeu cau bat buoc. Tuy nhien, phan lon cong cu automation truyen thong doi hoi nguoi dung co ky nang lap trinh, gay kho khan cho nhom QA manual, BA va cac vai tro nghiep vu.

De tai nay huong toi xay dung mot he thong no-code testing cho phep nguoi dung khong can lap trinh van co the tao, chinh sua, thuc thi kich ban kiem thu, quan ly du lieu test va theo doi bao cao ket qua. He thong dong thoi cung cap co che tich hop CI de su dung nhu mot quality gate trong quy trinh release.

---

## CHUONG 1. TONG QUAN DE TAI

### 1.1. Ly do chon de tai
- Nhu cau tang toc quy trinh kiem thu trong doanh nghiep.
- Giam phu thuoc vao nhan su automation co ky nang lap trinh cao.
- Chuan hoa quy trinh test va bao cao ket qua de de theo doi va ra quyet dinh.

### 1.2. Muc tieu
- Xay dung he thong no-code testing co the van hanh trong moi truong noi bo.
- Hoan thien 4 nhom chuc nang:
  1. Identity Management.
  2. Test Script Management.
  3. Execution & Data Integration.
  4. Reporting & Analytics.

### 1.3. Pham vi
- Doi tuong su dung: ADMIN, TESTER, VIEWER.
- Nen tang: ung dung web.
- Cong nghe: Next.js, Express, Prisma, PostgreSQL, Playwright.

### 1.4. Doi tuong va phuong phap nghien cuu
- Doi tuong: quy trinh tao/chay/bao cao test trong nhom du an noi bo.
- Phuong phap:
  - Phan tich nghiep vu.
  - Thiet ke kien truc va CSDL.
  - Phat trien API + giao dien.
  - Kiem thu tich hop va danh gia ket qua.

---

## CHUONG 2. PHAN TICH VA THIET KE HE THONG

### 2.1. Yeu cau chuc nang

#### 2.1.1. Chuc nang 1: Quan ly he thong va phan quyen
- Dang ky tai khoan voi password policy.
- Dang nhap va cap JWT token.
- Lay profile user hien tai.
- Quan ly user boi ADMIN.
- RBAC theo role ADMIN/TESTER/VIEWER.

#### 2.1.2. Chuc nang 2: Quan ly kich ban kiem thu
- Tao/chinh sua script theo keyword (`navigate`, `click`, `fill`, `assertText`).
- Quan ly object repository (`/objects`).
- Tao testcase no-code tu recorded steps.
- Publish testcase sau khi validate nghiep vu.

#### 2.1.3. Chuc nang 3: Thuc thi va tich hop du lieu
- Chay script tren nhieu trinh duyet (`chromium`, `firefox`, `webkit`).
- Data-driven testing thong qua dataset (`rows`).
- Tao suite va chay suite.
- Trigger suite tu CI voi token.

#### 2.1.4. Chuc nang 4: Bao cao va phan tich ket qua
- Bao cao ket qua run theo tung step.
- Ho tro report PDF.
- Thong ke pass/fail, pass rate, loi pho bien tren dashboard.
- Luu thong tin fail gom message/screenshot.

### 2.2. Yeu cau phi chuc nang
- Bao mat: JWT, bcrypt, route guard theo role.
- Kha nang bao tri: tach module route/service ro rang.
- Kha nang mo rong: mo hinh DB ho tro test case version va suite regression.

### 2.3. Kien truc he thong
- Frontend (`apps/web`): giao dien nguoi dung va dashboard.
- Backend (`apps/api`): REST API, auth, thuc thi test, report.
- Database: PostgreSQL qua Prisma schema.
- Cong cu test: Playwright.

### 2.4. Thiet ke co so du lieu (tom tat)
- Identity: `User`, `Role`.
- Quan ly script cu: `Project`, `TestScript`, `TestStep`, `UiObject`, `DataSet`, `TestRun`, `TestResult`.
- Regression moi: `TestCase`, `TestCaseVersion`, `TestSuite`, `TestSuiteItem`, `SuiteRun`.

### 2.5. Luong xu ly chinh
- Luong script run:
  1. Tao run.
  2. Executor chay theo step + browser + dataset.
  3. Luu ket qua.
- Luong suite run:
  1. Tao suite tu testcase version.
  2. Chay suite.
  3. Tong hop ket qua run.
- Luong CI:
  1. Pipeline goi endpoint trigger.
  2. Xac thuc token.
  3. Tao va tra ve runId.

---

## CHUONG 3. TRIEN KHAI HE THONG

### 3.1. Moi truong va cong nghe
- Node.js 20+
- Next.js (frontend)
- Express + Prisma (backend)
- PostgreSQL
- Playwright

### 3.2. Trien khai backend
- Route auth: dang ky/dang nhap/me/admin create-user.
- Route script/object/dataset/run.
- Route testcase/suite/suite-run/ci.
- Service executor (browser + data-driven).
- Service suite runner (MVP orchestration).

### 3.3. Trien khai frontend
- Login.
- Dashboard thong ke.
- Recorder page.
- Editor page.
- Suite run page.
- Report detail page.
- Quan ly role page.

### 3.4. Huong dan van hanh
- Tai lieu runbook:
  - `docs/runbooks/local-mvp-setup.md`
  - `docs/runbooks/ci-integration.md`

---

## CHUONG 4. KIEM THU VA DANH GIA

### 4.1. Ke hoach kiem thu
- Kiem thu auth.
- Kiem thu route testcase/suite/ci.
- Kiem thu health/schema.
- Kiem thu e2e smoke.

### 4.2. Bo test da thuc hien
- `auth-login.spec.ts`
- `tests-routes.test.ts`
- `editor-publish.test.ts`
- `health-and-schema.test.ts`
- `suite-run.test.ts`
- `ci-trigger.test.ts`
- `e2e-mvp-flow.test.ts`

### 4.3. Ket qua
- Cac nhom test route moi duoc thuc thi va pass.
- He thong dap ung duoc cac luong nghiep vu cot loi cua 4 nhom chuc nang.

### 4.4. Danh gia
- Uu diem:
  - Day du luong no-code cot loi.
  - Co kha nang tich hop CI.
  - Co dashboard analytics co ban.
- Han che:
  - Suite runner dang o muc MVP.
  - Chua co analytics trend nang cao.
  - Recorder full browser capture can nang cap them.

---

## Ket luan
De tai da xay dung duoc he thong no-code testing voi kien truc ro rang, bo API va giao dien dap ung duoc cac yeu cau cot loi trong moi truong noi bo. He thong cho phep mo rong tu MVP len muc production bang cac buoc tiep theo nhu nang cap suite runner day du, bo sung dashboard trend va toi uu quan tri da tenant.

---

## Huong phat trien
1. Nang cap suite runner tu stub sang Playwright flow day du.
2. Them retry strategy, flaky detection, canh bao real-time.
3. Mo rong dashboard theo time-series va module analytics nang cao.
4. Hoan thien luong recorder browser tu dong.
5. Bo sung co che phan quyen chi tiet theo project/workspace.

---

## Tai lieu tham khao
1. Express.js Documentation.
2. Prisma Documentation.
3. Playwright Documentation.
4. Next.js Documentation.
5. JWT (RFC 7519).

---

## Phu luc
- SRS chi tiet: `docs/final/01-srs.md`
- Kien truc thiet ke: `docs/final/02-architecture-and-design.md`
- Test plan: `docs/final/03-test-plan.md`
- User manual: `docs/final/04-user-manual.md`
- Tong hop ket qua: `docs/final/05-final-report-summary.md`
