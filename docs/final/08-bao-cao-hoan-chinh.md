# BAO CAO DO AN TOT NGHIEP HOAN CHINH

## THONG TIN CHUNG
- Truong: Truong Dai hoc Giao thong Van tai
- Khoa: Cong nghe thong tin
- Ten de tai: Xay dung he thong kiem thu tu dong no-code cho ung dung web noi bo Vietants
- Sinh vien thuc hien: [Dien ten sinh vien]
- Ma sinh vien: [Dien ma sinh vien]
- Lop: [Dien lop]
- Khoa hoc: [Dien khoa]
- Giang vien huong dan: [Dien ten giang vien]
- Don vi ung dung: Vietants
- Thoi gian thuc hien: [Dien thoi gian]

---

## LOI CAM ON
Em xin gui loi cam on chan thanh den Quy thay co Khoa Cong nghe thong tin, Truong Dai hoc Giao thong Van tai da tao dieu kien va truyen dat kien thuc nen tang trong suot qua trinh hoc tap. Em xin biet on giang vien huong dan da dong hanh, dinh huong va gop y chi tiet de em hoan thanh de tai.

Em xin cam on don vi Vietants da ho tro cung cap bai toan thuc te, moi truong nghiep vu va phan hoi trong qua trinh trien khai. Nhung gop y nay giup de tai khong chi dung o muc nghien cuu hoc thuat ma con co gia tri van hanh trong thuc tien.

Do han che ve thoi gian va kinh nghiem, bao cao co the con thieu sot. Em rat mong nhan duoc y kien dong gop tu Quy thay co de tiep tuc hoan thien de tai.

---

## LOI MO DAU
Trong boi canh doanh nghiep gia tang tan suat phat hanh phan mem, quy trinh bao dam chat luong can duoc toi uu theo huong nhanh hon, chinh xac hon va it phu thuoc hon vao thao tac thu cong. Tai nhieu doanh nghiep, trong do co Vietants, doi ngu QA manual, BA va PM la nhung nguoi am hieu nghiep vu nhat, nhung lai gap rao can khi tiep can cac cong cu automation truyen thong vi can ky nang lap trinh.

Xuat phat tu bai toan tren, de tai huong den xay dung mot he thong no-code testing cho phep nguoi dung khong can code van co the tao, quan ly, thuc thi va theo doi ket qua kiem thu. He thong duoc phat trien theo huong keyword-driven, data-driven, tich hop co che bao cao va khai thac ket qua de ho tro quyet dinh release.

Bao cao trinh bay day du qua trinh phan tich, thiet ke, xay dung, kiem thu va danh gia he thong. Noi dung duoc bien soan dua tren tai lieu de cuong, cac file mo ta pham vi de tai va bo tai lieu ky thuat hien co cua du an.

---

## CHUONG 1. TONG QUAN DE TAI

### 1.1. Ly do chon de tai
Kiem thu thu cong co uu diem de tiep can ban dau nhung ton tai nhieu han che trong boi canh he thong thay doi lien tuc: ton thoi gian, de bo sot testcase hoi quy, kho duy tri tinh lap lai va de phu thuoc vao kinh nghiem tung ca nhan. Trong khi do, automation truyen thong tuy manh nhung yeu cau doi nguoi dung co nen tang code va hieu biet framework.

Tai Vietants, nhu cau tu dong hoa kiem thu cho cac ung dung web noi bo la ro rang, nhung doi ngu QA/BA/PM can mot cong cu than thien hon. Vi vay, de tai no-code testing duoc dat ra nham "binh dan hoa" kha nang automation: bien cac thao tac nghiep vu thanh buoc test theo keyword, bo sung object repository de tai su dung locator, va bo tri dashboard de theo doi chat luong lien tuc.

### 1.2. Muc tieu de tai
De tai huong den cac muc tieu cu the:
- Xay dung nen tang no-code testing cho phep tao/chinh sua/chay test ma khong can viet ma lenh.
- Hoan thien he thong phan quyen theo vai tro ADMIN, TESTER, VIEWER.
- Trien khai luong thuc thi test theo nhieu trinh duyet, ho tro data-driven testing.
- Xay dung bo chuc nang bao cao va thong ke (pass/fail, pass rate, common errors).
- Mo rong kha nang tich hop CI de su dung he thong nhu quality gate trong release.

### 1.3. Noi dung va pham vi nghien cuu
Pham vi de tai tap trung vao kiem thu ung dung web noi bo, uu tien:
- Kiem thu chuc nang (Functional Testing).
- Kiem thu hoi quy (Regression Testing) o muc do MVP qua suite.
- Doi tuong su dung: QA Tester, BA, PM va nhung thanh vien nghiep vu khong chuyen code.

Ngoai pham vi hien tai:
- Kiem thu hieu nang chuyen sau.
- Kiem thu bao mat chuyen sau.
- Ho tro desktop app/mobile native.
- Cac co che thong minh nang cao nhu self-healing selector hoac BI analytics day du.

### 1.4. Dong gop cua de tai
De tai dong gop mot mo hinh ket noi nghiep vu va ky thuat thong qua 4 nhom nang luc:
1. Identity Management.
2. Test Script Management.
3. Execution and Data Integration.
4. Reporting and Analytics.

Day la co so de doanh nghiep tung buoc mo rong tu kiem thu thu cong sang kiem thu ban tu dong va tu dong hoa co cau truc.

---

## CHUONG 2. CO SO LY THUYET VA CONG NGHE

### 2.1. Co so ly thuyet
He thong duoc xay dung theo huong ket hop cac nguyen ly:
- **Keyword-driven testing**: Mo ta hanh dong test bang tap keyword chuan (`navigate`, `click`, `fill`, `assertText`), giup nguoi dung nghiep vu de tiep can.
- **Data-driven testing**: Chay cung mot kich ban voi nhieu bo du lieu, tang do phu ma khong nhan ban script.
- **Role-based access control (RBAC)**: Dam bao nguoi dung chi thao tac duoc trong pham vi quyen han.
- **Tinh mo rong theo module**: Tach route/service theo nghiep vu de de bao tri va nang cap.

### 2.2. Cong nghe va cong cu su dung
#### 2.2.1. Backend
- Nen tang: Node.js + Express.
- ORM: Prisma.
- Co so du lieu: PostgreSQL (van hanh qua Prisma/Supabase theo cau hinh).
- Cong cu thuc thi test: Playwright.
- Bao mat: JWT + bcrypt.

#### 2.2.2. Frontend
- Framework: Next.js 16.
- Ngon ngu: TypeScript.
- Thu vien UI: Radix UI va cac thanh phan UI tu du an.
- Chuc nang chinh: dang nhap, dashboard, editor, recorder, suite run, report.

#### 2.2.3. Cong cu phat trien va van hanh
- IDE: Visual Studio Code/Cursor.
- Quan ly ma nguon: Git/GitHub.
- Kiem thu API: Postman.
- Tu dong hoa test: Playwright test suite.

### 2.3. Ly do lua chon stack
- JavaScript/TypeScript dong nhat toan bo he thong, giam do phan manh ky nang.
- Next.js va Express de trien khai nhanh, linh hoat, de mo rong.
- Prisma giup quan ly schema va migration ro rang.
- Playwright phu hop cho web automation, ho tro da trinh duyet va ecosystem test tot.

---

## CHUONG 3. PHAN TICH YEU CAU HE THONG

### 3.1. Bai toan nghiep vu
Doanh nghiep can mot he thong giup:
- QA/BA/PM tao testcase nhanh ma khong can code.
- Chay test lap lai khi release de giam rui ro hoi quy.
- Co bao cao de theo doi chat luong theo run.
- Tich hop pipeline CI de gate chat luong.

### 3.2. Doi tuong tac nhan
- **ADMIN**: Quan tri user, cap quyen, quan ly toan he thong.
- **TESTER**: Tao/sua script, object, dataset, testcase, suite va thuc thi.
- **VIEWER**: Theo doi ket qua, bao cao, dashboard.

### 3.3. Yeu cau chuc nang chi tiet

#### F1. Identity Management
- Dang ky tai khoan voi chinh sach mat khau.
- Dang nhap va cap JWT token.
- Lay thong tin user hien tai.
- Admin tao user va gan role.
- Chan route theo role.

#### F2. Test Script Management
- Quan ly script va step theo keyword.
- Quan ly object repository de tai su dung locator.
- Tao testcase tu recorded step.
- Publish testcase sau khi qua validate nghiep vu.

#### F3. Execution and Data Integration
- Chay run theo browser (`chromium`, `firefox`, `webkit`).
- Chay data-driven thong qua dataset rows.
- Tao suite tu testcase version.
- Trigger suite run tu UI hoac CI.

#### F4. Reporting and Analytics
- Lay ket qua chi tiet theo tung step.
- Export PDF report.
- Dashboard tong hop so run, pass/fail, pass rate, loi pho bien.
- Luu thong tin loi, message, screenshot khi step that bai.

### 3.4. Yeu cau phi chuc nang
- **Bao mat**: JWT cho route bao ve, hash mat khau bcrypt.
- **Kha nang bao tri**: Tach module ro rang theo route/service.
- **Kha nang mo rong**: Co san mo hinh suite/testcase version de nang cap regression engine.
- **Do tin cay**: Luu vet ket qua run va thong tin that bai phuc vu truy vet.

### 3.5. Tieu chi nghiem thu
He thong duoc xem la dat khi:
- Dang ky/dang nhap va phan quyen dung theo role.
- Tao script/object/dataset va thuc thi run thanh cong.
- Tao suite va trigger tu CI thanh cong.
- Co dashboard va report phan anh dung trang thai pass/fail.

---

## CHUONG 4. KIEN TRUC VA THIET KE HE THONG

### 4.1. Kien truc tong the
He thong ap dung kien truc 3 lop:
1. **Presentation layer**: ung dung web Next.js.
2. **Application/API layer**: Express route + business services.
3. **Data layer**: PostgreSQL thong qua Prisma.

### 4.2. Thiet ke backend
Thanh phan chinh:
- `auth`: dang ky, dang nhap, profile, tao user boi admin.
- `projects/scripts/objects/datasets`: quan ly tai san test.
- `tests`: no-code testcase flow.
- `runs`: script run + analytics + PDF.
- `suites/suiteRuns`: quan ly regression suite.
- `ci`: trigger suite run tu pipeline.
- `executor`: thuc thi Playwright script theo step/data/browser.
- `suite-runner`: dieu pho i luong suite (MVP).

### 4.3. Thiet ke frontend
Man hinh chinh:
- Trang dang nhap.
- Dashboard tong hop chat luong.
- Recorder page.
- Editor page.
- Projects, scripts, objects, datasets.
- Suite runs va report chi tiet.

### 4.4. Mo hinh du lieu tong quan
Nhom bang chinh:
- **Identity**: `User`.
- **Project access**: `ProjectMember`.
- **Script model**: `Project`, `TestScript`, `TestStep`, `UiObject`, `DataSet`.
- **Run model**: `TestRun`, `TestResult`.
- **Regression model**: `TestCase`, `TestCaseVersion`, `TestSuite`, `TestSuiteItem`, `SuiteRun`.

### 4.5. Luong xu ly nghiep vu
#### 4.5.1. Script run flow
1. Nguoi dung tao lenh chay qua API runs.
2. He thong xac thuc, validate quyen va du lieu.
3. Executor chay tung step tren browser da chon.
4. Ket qua step luu vao `TestResult`.
5. Tong ket run luu vao `TestRun`.

#### 4.5.2. Suite run flow
1. Tao suite tu danh sach testcase version.
2. Trigger suite run.
3. Suite runner xu ly tung item theo thu tu.
4. Tong hop ket qua vao `SuiteRun`.

#### 4.5.3. CI trigger flow
1. CI pipeline gui request trigger-suite kem bearer token.
2. He thong xac minh token.
3. Tao run voi metadata build/commit.
4. Tra `runId` cho pipeline theo doi.

### 4.6. Bao mat va phan quyen
- JWT middleware cho route duoc bao ve.
- `requireRole` phan quyen theo vai tro.
- Admin endpoint tach rieng, user thuong khong tu nang quyen.
- Mat khau duoc hash truoc khi luu.

---

## CHUONG 5. XAY DUNG VA TRIEN KHAI HE THONG

### 5.1. Cau truc du an
- `apps/api`: backend Express + Prisma + Playwright.
- `apps/web`: frontend Next.js.
- `packages/domain`: schema/validation dung chung.
- `docs`: tai lieu SRS, thiet ke, test plan, user manual.

### 5.2. Quy trinh trien khai chinh
1. Cai dat dependency bang pnpm workspace.
2. Cau hinh bien moi truong (DB, JWT, CI token, telegram/linear neu dung).
3. Migration/generate/seed CSDL.
4. Chay API (`localhost:4000`) va Web (`localhost:3000`).

### 5.3. Chuc nang nghiep vu da hoan thien
- Dang ky/dang nhap/phan quyen.
- CRUD script va keyword steps.
- Quan ly object va dataset.
- Chay run theo browser va data-driven.
- Tao testcase/publish testcase.
- Tao suite/suite run.
- Trigger suite run tu CI.
- Bao cao PDF va dashboard thong ke.

### 5.4. Giao dien va trai nghiem nguoi dung
He thong tap trung vao trai nghiem don gian:
- Form va bang du lieu truc quan.
- Luong thao tac lien mach tu tao script den xem ket qua.
- Giam thao tac ky thuat o phia nguoi dung nghiep vu.

---

## CHUONG 6. KIEM THU HE THONG VA KET QUA

### 6.1. Phuong phap kiem thu
- Kiem thu API theo route/module.
- Kiem thu tich hop cac luong nghiep vu quan trong.
- Kiem thu smoke/e2e cho luong MVP.

### 6.2. Bo test tieu bieu da thuc hien
- `auth-login.spec.ts`
- `tests-routes.test.ts`
- `editor-publish.test.ts`
- `health-and-schema.test.ts`
- `suite-run.test.ts`
- `ci-trigger.test.ts`
- `e2e-mvp-flow.test.ts`

### 6.3. Tong hop ket qua
Ket qua thuc thi cho thay cac nhom chuc nang cot loi dat yeu cau:
- Luong auth va role-based access hoat dong dung.
- Luong script/object/dataset/run van hanh on dinh.
- Luong suite va CI trigger da thong suot o muc MVP.
- Dashboard va report cap nhat du lieu phan anh trang thai run.

### 6.4. Danh gia chat luong
**Uu diem**
- Chuyen doi bai toan automation sang no-code ro rang.
- Giam phu thuoc vao nguoi viet script thu cong.
- He thong co san huong mo rong va tich hop quy trinh release.

**Han che**
- Suite runner moi o muc MVP, can nang cap do sau thuc thi.
- Analytics chu yeu aggregate, chua co trend theo thoi gian.
- Recorder full automation co the nang cap them.

---

## CHUONG 7. KET LUAN VA HUONG PHAT TRIEN

### 7.1. Ket luan
De tai da dat muc tieu chinh: xay dung duoc he thong kiem thu tu dong no-code cho ung dung web noi bo, dap ung nhu cau tao/chay/bao cao test cho doi ngu nghiep vu khong chuyen lap trinh. Kien truc he thong ro rang, bo API day du cho cac luong cot loi va da co bo kiem thu xac minh theo tung nhom chuc nang.

### 7.2. Huong phat trien
1. Nang cap suite runner len muc day du Playwright flow cho tung test case.
2. Bo sung retry strategy va phat hien flaky test.
3. Them alerting real-time va dashboard time-series nang cao.
4. Nang cap recorder tu dong hoa thao tac trinh duyet sau hon.
5. Mo rong mo hinh da tenant va phan quyen chi tiet theo project/workspace.

---

## TAI LIEU THAM KHAO
1. Tai lieu yeu cau va pham vi de tai (`Tài liệu.docx`).
2. Ban nhap bao cao va tai lieu mau (`NguyenXuanBinh12 (4).docx`).
3. SRS du an: `docs/final/01-srs.md`.
4. Kien truc va thiet ke: `docs/final/02-architecture-and-design.md`.
5. Tong hop ket qua: `docs/final/05-final-report-summary.md`.
6. Bo so do kien truc: `docs/final/06-system-architecture-diagrams.md`.
7. Tai lieu chinh thuc: Express.js, Prisma, Playwright, Next.js.

---

## PHU LUC A - NOI DUNG NOP KEM DE XUAT
- SRS chi tiet.
- Bo so do he thong (use case, sequence, class, ERD, deployment).
- Test plan va bo testcase.
- User manual.
- Bang doi chieu yeu cau va tinh nang da hoan thien.

## PHU LUC B - HUONG DANH CHINH SUA TRUOC KHI IN
Ban can cap nhat cac thong tin ca nhan sau:
- Ten sinh vien, ma sinh vien, lop, khoa.
- Ten giang vien huong dan.
- Thoi gian thuc hien.
- Co the bo sung anh giao dien thuc te vao Chuong 5.
- Neu can mau theo truong, chuyen doi file nay sang Word va bo tri Muc luc tu dong.
