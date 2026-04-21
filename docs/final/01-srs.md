# SRS - He Thong Kiem Thu Tu Dong No-Code

## 1. Muc dich tai lieu
Tai lieu dac ta yeu cau phan mem (SRS) cho he thong no-code testing, lam co so cho phat trien, kiem thu va nghiem thu.

## 2. Pham vi
He thong cho phep nguoi dung khong can lap trinh tao/chinh sua/chay kich ban test, quan ly du lieu test, theo doi ket qua va tich hop CI.

## 3. Doi tuong nguoi dung
- ADMIN: Quan tri user, cau hinh, quan tri toan he thong.
- TESTER: Tao/chinh sua/chay test va suite.
- VIEWER: Xem ket qua, bao cao.

## 4. Yeu cau chuc nang
### F1. Identity Management
1. Dang ky (`POST /auth/register`) voi password policy:
   - >= 8 ky tu
   - co chu hoa
   - co chu thuong
   - co so
2. Dang nhap (`POST /auth/login`) tra JWT token.
3. Lay thong tin user hien tai (`GET /auth/me`).
4. Admin tao user moi (`POST /auth/admin/create-user`).
5. Phan quyen route theo role `ADMIN/TESTER/VIEWER`.

### F2. Test Script Management
1. Quan ly script (`/scripts`) va step keyword (`navigate`, `click`, `fill`, `assertText`).
2. Quan ly object repository (`/objects`).
3. Tao test case tu recorded step (`POST /projects/:projectId/tests`).
4. Publish test case (`POST /projects/:projectId/tests/:testCaseId/publish`) sau khi validate.

### F3. Execution & Data Integration
1. Chay test script (`POST /runs`) voi browser option (`chromium`, `firefox`, `webkit`).
2. Data-driven testing voi DataSet (`/datasets`) va `rows`.
3. Quan ly suite (`/projects/:projectId/suites`) va run suite (`/suites/:suiteId/runs`).
4. Trigger suite tu CI (`/ci/trigger-suite`) voi bearer token.

### F4. Reporting & Analytics
1. Lay ket qua run chi tiet (`GET /runs/:id/results`).
2. Export PDF report (`GET /runs/:id/report.pdf`).
3. Dashboard analytics (`GET /runs/analytics`): total, passed, failed, passRate, commonErrors.
4. Khi fail step, luu thong tin loi va screenshot.

## 5. Yeu cau phi chuc nang
- Bao mat:
  - JWT bat buoc cho route duoc bao ve.
  - Hash password bang bcrypt.
- Hieu nang:
  - API response duoc to chuc theo paging/filter o pha nang cap.
- Kha nang bao tri:
  - Tach route theo module (`auth`, `scripts`, `runs`, `suites`, `ci`).
- Kha nang mo rong:
  - Mo hinh DB da co entity suite/testcase version de mo rong regression engine.

## 6. Dieu kien nghiem thu
- Nguoi dung dang ky/dang nhap thanh cong va bi chan khi sai quyen.
- Co the tao script/step/object/dataset va chay run.
- Co the tao suite va trigger run tu UI va CI.
- Dashboard hien thi thong ke pass/fail va loi pho bien.

## 7. Ngoai pham vi hien tai
- Self-healing selector nang cao.
- Phan tich trend nang cao theo thoi gian (BI).
- Quan tri da tenant toan dien.
