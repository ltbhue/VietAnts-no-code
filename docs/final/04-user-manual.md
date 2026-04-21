# User Manual - Huong Dan Su Dung He Thong

## 1. Dang nhap he thong
1. Mo trang `/login`.
2. Nhap email/mat khau.
3. Nhan "Dang nhap".
4. He thong chuyen den `/dashboard`.

## 2. Quan ly Project
- Vao Dashboard.
- Tao project moi (ten + mo ta).
- Chon project de vao quan ly script/object/dataset.

## 3. Quan ly Script va Step
1. Vao menu `Kich ban`.
2. Tao script moi theo project.
3. Them step theo keyword:
   - `navigate`
   - `click`
   - `fill`
   - `assertText`
4. Luu step. He thong validate payload.

## 4. Object Repository
1. Vao menu `Doi tuong UI`.
2. Tao object voi `name`, `locator`, `projectId`.
3. Tai su dung `targetId` trong step script.

## 5. Data-Driven Testing
1. Vao menu `Bo du lieu`.
2. Tao dataset voi `rows` (mang JSON).
3. Chay run script va truyen `dataSetId`.

## 6. Luong no-code testcase/suite
1. Vao `Recorder` de tao testcase draft tu recorded step.
2. Vao `Bien tap` de publish testcase.
3. Vao `Suite` de chay suite.
4. Mo `report/[runId]` de xem ket qua run.

## 7. Bao cao va dashboard
- Dashboard hien thong ke:
  - Tong run
  - Pass/Fail
  - Pass rate
  - Loi pho bien
- Bao cao PDF:
  - Endpoint `/runs/:id/report.pdf`

## 8. Vai tro nguoi dung
- ADMIN: toan quyen, tao user qua endpoint admin.
- TESTER: tao/chay/chinh sua test.
- VIEWER: xem ket qua/bao cao.

## 9. Xu ly loi thuong gap
- 401 Unauthorized: token sai/het han.
- 403 Forbidden: khong du quyen.
- 400 Invalid payload: du lieu gui len khong dung schema.
- Khong ket noi duoc API: kiem tra `NEXT_PUBLIC_API_URL` va server API.

## 10. Ghi chu van hanh
- Khi logout, token va authUser duoc xoa khoi localStorage.
- Nen doi `JWT_SECRET` va `CI_API_TOKEN` o moi truong that.
