# TỔNG HỢP CHI TIẾT NGHIỆP VỤ HỆ THỐNG

> Dùng làm nội dung nền để biên soạn báo cáo DOCX đồ án tốt nghiệp  
> Đề tài: **Hệ thống kiểm thử tự động no-code cho ứng dụng web nội bộ Vietants**  
> **Đồng bộ mã nguồn:** bản cập nhật phản ánh codebase monorepo (`apps/web` Next.js, `apps/api` Express + Prisma + Playwright) tại thời điểm biên soạn.

---

## Chương 1. Mở đầu

### 1.1. Lý do chọn đề tài

Trong quy trình phát triển phần mềm nội bộ, các thay đổi chức năng diễn ra liên tục. Việc kiểm thử thủ công theo cách truyền thống tốn nhiều thời gian, phụ thuộc kỹ năng cá nhân và khó bảo đảm độ lặp lại. Trong khi đó, phần lớn nhân sự QA/BA/PM không có nền tảng lập trình chuyên sâu, dẫn đến rào cản khi tiếp cận các framework automation như Selenium/Playwright thuần code.

Đề tài xây dựng một nền tảng **no-code testing** cho phép người dùng không biết code vẫn có thể:

- Thiết kế kịch bản kiểm thử bằng keyword/action trên **Test Script** (mô hình cổ điển: bước gắn `UiObject` + tham số).
- Tạo **Test Case** có phiên bản (`TestCaseVersion`): ghi thao tác qua recorder/editor, trạng thái Draft/Published.
- Gom nhiều phiên bản test case đã chọn vào **Test Suite** và chạy regression một lần (UI hoặc CI).
- Quản lý object locator tập trung theo project.
- Chạy script theo dữ liệu (**data-driven**) với `DataSet`.
- Theo dõi kết quả, dashboard analytics (`GET /runs/analytics`), xuất PDF cho **run của script**; khi script fail có thể tạo issue **Linear** (tuỳ biến môi trường `LINEAR_*`).

### 1.2. Bài toán thực tế

Bài toán đặt ra là xây dựng hệ thống kiểm thử tự động có giao diện trực quan, phù hợp môi trường dự án nội bộ doanh nghiệp với các yêu cầu:

- Dễ sử dụng cho người không chuyên kỹ thuật.
- Hỗ trợ phân quyền và bảo mật cơ bản.
- Có khả năng mở rộng nghiệp vụ kiểm thử.
- Tạo báo cáo rõ ràng phục vụ đánh giá chất lượng.

### 1.3. Mục tiêu đề tài

- Phân tích và mô hình hóa nghiệp vụ kiểm thử no-code.
- Thiết kế và hiện thực hệ thống web gồm frontend, backend, cơ sở dữ liệu.
- Cung cấp đầy đủ chức năng từ tạo kịch bản đến thực thi và báo cáo.
- Đánh giá khả năng ứng dụng trong quy trình QA thực tế.

### 1.4. Phạm vi đề tài

**Trong phạm vi:**

- Kiểm thử giao diện web nội bộ theo kịch bản no-code (script và/hoặc test case trong suite).
- Quản lý **Project** (owner + thành viên), **TestScript** + **TestStep**, **UiObject**, **DataSet**, **TestRun** + **TestResult**.
- Quản lý **TestCase** / **TestCaseVersion**, **TestSuite** / **TestSuiteItem**, **SuiteRun** và kết quả JSON + screenshot khi fail.
- Thực thi bằng Playwright (script run: chromium/firefox/webkit; suite run: chromium).
- Dashboard analytics (theo run script của user, hoặc theo **suite** với query `suiteId`).
- Xuất PDF báo cáo cho một **TestRun** (script).
- API CI: `POST /ci/trigger-suite` xác thực bằng Bearer `CI_API_TOKEN`.

**Ngoài phạm vi:**

- Tự động kiểm thử mobile native.
- CI/CD đa môi trường/đa pipeline đầy đủ (hiện chỉ có điểm trigger suite có kiểm soát token).
- AI tự sinh test case.
- Mô hình **Workspace** trong CSDL (chuẩn bị mở rộng) chưa được expose đầy đủ qua API nghiệp vụ trong MVP.

---

## Chương 2. Nghiệp vụ hệ thống

### 2.1. Các bên liên quan (Stakeholders)

- **Admin**: quản trị người dùng (danh sách, đổi role/mật khẩu), **tạo/sửa/xóa project** và gán thành viên; có đầy đủ quyền thao tác như Tester trên tài sản kiểm thử.
- **Tester/QA**: thao tác script/object/dataset/test case/suite trong các **project được phép** (owner hoặc `ProjectMember`); chạy script run và suite run.
- **Viewer/PM/BA**: xem dữ liệu trong project được phép; không tạo/sửa/xóa script/object/dataset/test case/suite; không chạy test (API giới hạn `requireRole`).
- **Nhóm phát triển**: nhận thông tin lỗi (PDF run, analytics, issue Linear nếu bật).

### 2.2. Mô tả nghiệp vụ tổng quát

Luồng tổng quát (có thể dùng song song hai đường: **Script cổ điển** và **Test case + Suite**):

**A. Đường Script + Object + Dataset (kiểm thử theo keyword + repository)**

1. Đăng ký / đăng nhập (JWT).
2. Admin tạo **Project**, gán **thành viên** (tuỳ chọn).
3. Tester tạo **Test Script**, khai báo **Test Step** (`navigate`, `click`, `fill`, `assertText`) và liên kết **UiObject** khi cần.
4. Tạo **DataSet** (JSON `rows`) nếu chạy data-driven.
5. `POST /runs` — thực thi Playwright theo browser đã chọn; lưu `TestRun` + `TestResult`, screenshot khi fail.
6. Xem kết quả, analytics; xuất **PDF** cho run đó.

**B. Đường Test case + Suite (ghi thao tác / draft → publish → regression)**

1. Trong project được phép, tạo **Test Case** (`POST /projects/:projectId/tests`) với các bước đã validate (recorder/editor → payload JSON).
2. Gọi **smart-record** (`POST .../tests/smart-record`) để gợi ý bước từ danh sách hành động thô (tuỳ UI).
3. **Publish** (`POST .../tests/:testCaseId/publish`) sau khi validate — chuyển `lifecycle` sang Published.
4. Tạo **Test Suite** gồm nhiều `testCaseVersionId` trong cùng project.
5. Chạy suite: `POST /suites/:suiteId/runs` (trigger `ui`) hoặc `POST /ci/trigger-suite` (trigger `ci`, Bearer token).
6. `SuiteRun` lưu JSON `results` theo từng test case (pass/fail, step log, screenshot khi fail).

**Tích hợp lỗi (script run):** khi một bước của **script run** thất bại, backend có thể gọi API **Linear** tạo issue nếu đã cấu hình biến môi trường.

### 2.3. Tác nhân và quyền nghiệp vụ

#### 2.3.1. Admin

- CRUD **User** qua API admin (`/auth/admin/*`): tạo user, liệt kê, cập nhật (email, họ tên, role, mật khẩu), xóa.
- **Chỉ ADMIN** được `POST/PUT/DELETE /projects` (tạo/sửa/xóa project và danh sách `memberIds`).
- Được phép mọi thao tác của Tester trên script/object/dataset/run/test/suite khi truy cập được project.

#### 2.3.2. Tester/QA

- **Không** tạo/xóa project (do API hạn chế); làm việc trong project do Admin thêm làm owner hoặc thành viên.
- CRUD script/step/object/dataset; tạo test case, publish; tạo suite; chạy script run và suite run.

#### 2.3.3. Viewer

- Đọc dữ liệu trong project được phép (danh sách script, objects, runs của chính user nếu có, v.v. tuỳ endpoint).
- Không POST/PUT/DELETE trên script/object/dataset; không chạy run/suite.
- **PDF:** endpoint cho phép role VIEWER nhưng báo cáo PDF hiện chỉ sinh được cho **TestRun thuộc đúng user** (`userId` khớp) — thực tế Viewer chỉ xem PDF các run do chính họ thực hiện (nếu được giao quyền chạy trong phiên bản tương lai cần mở rộng kiểm tra theo project).

### 2.4. Danh sách use case chính

- UC01: Đăng ký tài khoản (role mặc định TESTER; có thể chọn VIEWER; không tự đăng ký ADMIN).
- UC02: Đăng nhập hệ thống (có cơ chế giới hạn số lần thử theo IP/email).
- UC03: Đổi mật khẩu khi đã đăng nhập.
- UC04: Quên mật khẩu / đặt lại mật khẩu bằng token (MVP: token lưu bộ nhớ process — phù hợp demo, cần Redis/email cho production).
- UC05: Admin quản lý danh sách người dùng.
- UC06: Admin quản lý project và thành viên (`ProjectMember`).
- UC07: Quản lý test script và các bước keyword (`PUT /scripts/:id/steps`).
- UC08: Quản lý object repository (`UiObject`).
- UC09: Quản lý dataset kiểm thử (data-driven cho script).
- UC10: Chạy script (`POST /runs`) — single hoặc data-driven; chọn `chromium` | `firefox` | `webkit`.
- UC11: Xem analytics dashboard (`GET /runs/analytics`, có `projectId`, `days`, và nhánh `suiteId`).
- UC12: Xuất báo cáo PDF cho TestRun script (`GET /runs/:id/report.pdf`).
- UC13: Quản lý test case / phiên bản; smart-record; publish.
- UC14: Quản lý test suite và chạy suite (UI).
- UC15: Trigger chạy suite từ CI (`POST /ci/trigger-suite` + `CI_API_TOKEN`).
- UC16: Khi script run fail — tạo issue Linear (tuỳ cấu hình `LINEAR_API_KEY`, `LINEAR_TEAM_ID`).

### 2.5. Business Rules (quy tắc nghiệp vụ cốt lõi)

- BR01: Người dùng phải đăng nhập để truy cập chức năng nghiệp vụ (JWT).
- BR02: Quyền truy cập API phụ thuộc role **ADMIN / TESTER / VIEWER** (RBAC).
- BR03: Truy cập dữ liệu theo **project**: user phải là **owner** hoặc **ProjectMember** (`projectAccessibleWhere`).
- BR04: **Chỉ ADMIN** tạo/sửa/xóa project và gán thành viên.
- BR05: Step trong script phải có thứ tự `order` rõ ràng; keyword thuộc tập cố định (`navigate`, `click`, `fill`, `assertText`).
- BR06: `TestRun` lưu trạng thái tổng và `TestResult` chi tiết từng step; fail → screenshot và message.
- BR07: DataSet dùng cho run phải cùng **project** với script.
- BR08: PDF run chỉ cho **TestRun** mà `userId` trùng người gọi API (kể cả khi role VIEWER được phép route).
- BR09: Item trong suite phải trỏ tới `testCaseVersionId` thuộc đúng project của suite.
- BR10: Publish test case chỉ khi `validateForPublish` pass (đủ bước, lifecycle/platform hợp lệ).
- BR11: Trigger CI không dùng JWT user mà dùng **Bearer `CI_API_TOKEN`** khớp biến môi trường.

### 2.6. Luồng nghiệp vụ tổng quát (As-is/To-be)

**As-is (trước khi có hệ thống):**

- Tạo test case thủ công trên file tài liệu.
- Thực thi bằng tay, ghi nhận kết quả rời rạc.
- Tổng hợp báo cáo tốn thời gian, dễ sai lệch.

**To-be (sau khi triển khai):**

- Người dùng thao tác trên một nền tảng web: script keyword, object repository, data-driven, test case + suite regression và điểm trigger CI.
- Kết quả tập trung (run script, suite run), có analytics và xuất PDF cho run script.

---

## Chương 3. Phân tích hệ thống

### 3.1. Yêu cầu chức năng

- Đăng ký/đăng nhập, JWT; đổi mật khẩu; quên/đặt lại mật khẩu (MVP).
- Admin CRUD user; chỉ Admin CRUD project + gán thành viên.
- Quản lý script/step/object/dataset trong project được phép.
- Quản lý test case (tạo bản ghi, smart-record, publish).
- Quản lý suite và suite run; trigger CI có kiểm soát token.
- Chạy script run (Playwright, chọn browser); lưu `TestRun`/`TestResult`.
- Dashboard analytics (script runs của user; hoặc suite runs khi có `suiteId`).
- Xuất PDF cho script run.
- Tích hợp Linear khi script run fail (tuỳ env).

### 3.2. Yêu cầu phi chức năng

- **Hiệu năng**: phản hồi API trong phạm vi đồ án; analytics gom theo cửa sổ 7/30 ngày.
- **Bảo mật**: JWT, bcrypt; RBAC; kiểm tra quyền project; giới hạn đăng nhập sai; CI token tách khỏi JWT người dùng.
- **Tính dùng được**: Next.js App Router — các trang dashboard, scripts, editor/recorder, reports, suite-runs, admin users, account settings.
- **Khả năng mở rộng**: engine keyword + domain package (`@vietants/domain`); schema có Workspace/Suite/version.
- **Độ tin cậy**: log/step message, screenshot khi fail (script run và suite run).

### 3.3. Đặc tả dữ liệu mức nghiệp vụ

Các thực thể chính:

- `User`: đăng nhập, vai trò **ADMIN | TESTER | VIEWER**.
- `Project`: owner + tùy chọn `ProjectMember`; chứa script, object, dataset, test case, suite.
- `Workspace`: nhóm project (schema — MVP chưa dùng đầy đủ API).
- `TestScript` / `TestStep`: kịch bản keyword + `UiObject`.
- `UiObject`: locator theo project.
- `DataSet`: `rows` JSON cho data-driven.
- `TestRun` / `TestResult`: run và kết quả từng bước (script).
- `TestCase` / `TestCaseVersion`: nội dung JSON các bước recorded/keyword, lifecycle.
- `TestSuite` / `TestSuiteItem`: gom phiên bản test case.
- `SuiteRun`: một lần chạy suite — `status`, `results` JSON, metadata CI (`trigger`, `buildId`, `commitSha`, …).

### 3.4. Luồng xử lý nghiệp vụ cốt lõi

#### 3.4.1. Luồng chạy test single run (script)

1. Tester chọn script và browser (mặc định chromium).
2. Hệ thống nạp step theo `order`.
3. Playwright thực thi từng keyword (hỗ trợ timeout từng bước qua `parameters.timeoutMs` trong giới hạn an toàn).
4. Mỗi step ghi `TestResult` passed/failed.
5. Cập nhật `TestRun`; fail có screenshot và có thể tạo Linear issue.

#### 3.4.2. Luồng chạy test data-driven (script + dataset)

1. Tester chọn script + dataset cùng project.
2. Với mỗi dòng trong `rows`, thực thi toàn bộ step (substitution theo executor).
3. Ghi nhận message theo dòng dữ liệu khi cần.
4. Run fail nếu có step fail trên một dòng.

#### 3.4.3. Luồng chạy test suite

1. Chuẩn bị các test case đã publish và thêm vào suite.
2. Gọi start suite run (UI hoặc CI).
3. Với mỗi item trong suite (theo `sortOrder`), Playwright chạy tuần tự các step trong JSON phiên bản (semantic locator cho nhãn tiếng Việt/text).
4. Gộp kết quả vào `SuiteRun.results`; fail sớm trong một case có thể dừng case đó và chuyển sang case kế.

#### 3.4.4. Luồng xử lý lỗi (script run)

1. Step fail → `TestResult` failed + screenshot path.
2. `TestRun` → failed.
3. Gọi Linear (nếu cấu hình).

#### 3.4.5. Luồng xử lý lỗi (suite run)

1. Step fail trong một test case → case đó failed, screenshot file dưới thư mục `screenshots/`.
2. Toàn suite có thể passed hoặc failed tùy tổng hợp trong service `suite-runner`.

---

## Chương 4. Thiết kế hệ thống

### 4.1. Kiến trúc tổng quan

Hệ thống tổ chức theo kiến trúc 3 lớp:

- **Frontend**: Next.js (TypeScript), giao diện người dùng.
- **Backend**: Express/Node.js, cung cấp API nghiệp vụ.
- **Database**: PostgreSQL qua Prisma ORM.

Bên cạnh đó có lớp thực thi kiểm thử:

- **Execution Engine**: Playwright xử lý browser automation.

### 4.2. Thiết kế các phân hệ

#### 4.2.1. Phân hệ xác thực và phân quyền

- API đăng ký, đăng nhập, `/auth/me`, đổi mật khẩu, quên/đặt lại mật khẩu.
- JWT cho phiên người dùng; middleware kiểm tra role.
- API admin quản lý user.

#### 4.2.2. Phân hệ project và không gian làm việc

- Quản lý **Project**, **owner**, danh sách **ProjectMember** — chỉ **ADMIN** được tạo/sửa/xóa project và gán thành viên.

#### 4.2.3. Phân hệ tài sản kiểm thử (script, test case, suite)

- Script/step/object/dataset trong project được phép (owner hoặc member).
- Test case / publish / smart-record.
- Suite và suite items.

#### 4.2.4. Phân hệ thực thi và báo cáo

- Executor script (`executor.ts`) — Playwright multi-browser, data-driven, Linear on failure.
- Suite runner (`suite-runner.ts`) — Chromium, kết quả JSON per case.
- PDF báo cáo (`reportPdf.ts`) cho script run.
- Analytics (`GET /runs/analytics`).
- CI router (`/ci/trigger-suite`) gọi `executeSuiteRun`.

### 4.3. Thiết kế API nghiệp vụ (tóm tắt)

**Auth**

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `POST /auth/change-password`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- `POST /auth/admin/create-user`, `GET /auth/admin/users`, `PUT /auth/admin/users/:id`, `DELETE /auth/admin/users/:id`

**Project**

- `GET /projects`, `POST /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id`  
  *(POST/PUT/DELETE: role ADMIN)*

**Script / object / dataset / run**

- `GET|POST /scripts`, `GET|PUT|DELETE /scripts/:id`, `PUT /scripts/:id/steps`
- `GET|POST /objects`, `PUT|DELETE /objects/:id`
- `GET|POST /datasets`, `PUT|DELETE /datasets/:id`
- `GET /runs`, `GET /runs/analytics`, `POST /runs`, `GET /runs/:id/results`, `GET /runs/:id/report.pdf`

**Test case & suite**

- `GET|POST /projects/:projectId/tests`, `POST /projects/:projectId/tests/smart-record`
- `POST /projects/:projectId/tests/:testCaseId/publish`
- `GET|POST /projects/:projectId/suites`
- `POST /suites/:suiteId/runs`, `GET /suites/:suiteId/runs/:runId`

**CI**

- `POST /ci/trigger-suite` — header `Authorization: Bearer <CI_API_TOKEN>`

### 4.4. Thiết kế giao diện mức chức năng

- Trang đăng nhập / đăng ký / quên mật khẩu / đặt lại mật khẩu.
- Dashboard tổng quan.
- Projects; Scripts (danh sách + chi tiết script); Objects; Datasets.
- Editor & Recorder (thiết kế test case).
- Reports & chi tiết report theo run.
- Suite runs.
- Admin — quản lý users.
- Settings — tài khoản (đổi mật khẩu).

### 4.5. Thiết kế bảo mật và kiểm soát truy cập

- Bảo vệ endpoint bằng JWT (trừ register/login/forgot/reset và CI token route).
- RBAC theo role; project scope theo owner/member.
- CI dùng token tĩnh môi trường, tách khỏi phiên người dùng.

---

## Chương 5. Kiểm thử và đánh giá

### 5.1. Chiến lược kiểm thử

- Kiểm thử API theo module (Auth, RBAC, Project access, Script, Run, Test case, Suite, CI token).
- Kiểm thử tích hợp luồng end-to-end (script run và suite run).
- Kiểm thử giao diện báo cáo và xuất PDF.
- Kiểm thử tích hợp Linear (mock hoặc env staging).

### 5.2. Bộ test case tiêu biểu

Tham chiếu bộ test case trong tài liệu:

- Auth & RBAC & Admin users
- Project & ProjectMember
- Script & Steps & timeoutMs
- Object Repository & Dataset
- Execution & Reporting & PDF
- Test case lifecycle & Suite & SuiteRun & CI trigger

### 5.3. Tiêu chí đánh giá kết quả

- Đúng chức năng theo use case.
- Kết quả pass/fail phản ánh chính xác trạng thái thực thi (script và suite).
- Báo cáo run đầy đủ thông tin; suite có JSON chi tiết theo từng case.
- Linear chỉ gọi khi script run fail và env hợp lệ.

### 5.4. Kết quả đạt được

- Hoàn thiện nền tảng no-code testing với **hai lớp tự động hóa**: script keyword + suite regression.
- Hỗ trợ người không code qua recorder/editor và dashboard.
- Có điểm tích hợp CI có kiểm soát và báo cáo PDF/analytics.

### 5.5. Hạn chế hiện tại

- Chưa tối ưu cho khối lượng rất lớn script/runs/suite runs đồng thời.
- Trigger CI mới ở mức **một endpoint** với token — chưa dashboard quản lý pipeline đa môi trường.
- Suite runner chỉ dùng Chromium; Linear chỉ gắn với **script run**, chưa với suite run.
- Reset mật khẩu MVP lưu token trong bộ nhớ tiến trình — không phù hợp triển khai đa instance.
- PDF chỉ cho TestRun script của đúng user thực hiện — chưa có PDF tổng hợp suite.

---

## Chương 6. Kết luận và hướng phát triển

### 6.1. Kết luận

Đề tài đã giải quyết được bài toán trọng tâm: rút ngắn thời gian kiểm thử thủ công và hạ thấp rào cản kỹ thuật khi tiếp cận automation testing. Nền tảng no-code giúp chuẩn hóa quy trình kiểm thử, nâng cao khả năng theo dõi chất lượng và hỗ trợ ra quyết định cho nhóm dự án.

### 6.2. Hướng phát triển

- Bổ sung nhiều keyword/action hơn cho step và recorded kinds.
- Thêm lịch chạy tự động theo thời gian (scheduler).
- Mở rộng CI/CD đa job, webhook đa môi trường, secret rotation.
- Thêm dashboard phân tích xu hướng lỗi cho suite runs và PDF tổng hợp suite.
- Cải tiến phân quyền chi tiết hơn (ví dụ VIEWER xem PDF mọi run trong project).
- Hoàn thiện Workspace trong API và UI.

---

## Phụ lục A. Mẫu đoạn văn có thể dùng trực tiếp trong DOCX

### A.1. Mục tiêu hệ thống

"Hệ thống kiểm thử tự động no-code được xây dựng nhằm hỗ trợ các nhóm QA/BA/PM tại doanh nghiệp có thể thiết kế và thực thi kịch bản kiểm thử web một cách trực quan, không đòi hỏi kỹ năng lập trình chuyên sâu. Giải pháp giúp tăng tốc quy trình kiểm thử, giảm sai sót do thao tác thủ công và tạo nền tảng báo cáo tập trung cho hoạt động đảm bảo chất lượng phần mềm."

### A.2. Giá trị thực tiễn

"Khi áp dụng vào môi trường dự án nội bộ, hệ thống cho phép chuẩn hóa tài sản kiểm thử (script, object, dataset), tự động hóa việc chạy test và thu thập kết quả. Điều này giúp đội dự án theo dõi chất lượng phát hành nhanh hơn, đồng thời nâng cao khả năng truy vết lỗi và phản hồi cho nhóm phát triển."

### A.3. Định hướng mở rộng

"Trong giai đoạn tiếp theo, hệ thống có thể mở rộng theo hướng CI/CD đầy đủ, tăng độ phủ keyword và recorded actions, bổ sung PDF/lịch sử cho suite run, phân tích dữ liệu kiểm thử và triển khai mô hình vận hành đa môi trường để phù hợp nhu cầu doanh nghiệp ở quy mô lớn hơn."
