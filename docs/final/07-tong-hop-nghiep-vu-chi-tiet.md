# TỔNG HỢP CHI TIẾT NGHIỆP VỤ HỆ THỐNG

> Dùng làm nội dung nền để biên soạn báo cáo DOCX đồ án tốt nghiệp  
> Đề tài: **Hệ thống kiểm thử tự động no-code cho ứng dụng web nội bộ Vietants**  
> **Cập nhật:** đồng bộ với codebase hiện tại (`apps/api`, `apps/web`, `packages/domain`)

---

## Chương 1. Mở đầu

### 1.1. Lý do chọn đề tài

Trong quy trình phát triển phần mềm nội bộ, các thay đổi chức năng diễn ra liên tục. Việc kiểm thử thủ công theo cách truyền thống tốn nhiều thời gian, phụ thuộc kỹ năng cá nhân và khó bảo đảm độ lặp lại. Trong khi đó, phần lớn nhân sự QA/BA/PM không có nền tảng lập trình chuyên sâu, dẫn đến rào cản khi tiếp cận các framework automation như Selenium/Playwright thuần code.

Đề tài xây dựng một nền tảng **no-code testing** cho phép người dùng không biết code vẫn có thể:

- Thiết kế kịch bản kiểm thử bằng keyword/action hoặc ghi hành động (record).
- Quản lý object locator (`UiObject`) tập trung.
- Chạy test theo dữ liệu (data-driven) và theo bộ regression (suite).
- Theo dõi kết quả, xuất báo cáo PDF, nhận cảnh báo khi lỗi (Linear).
- Kích hoạt chạy suite từ pipeline CI (token bảo mật).

### 1.2. Bài toán thực tế

Bài toán đặt ra là xây dựng hệ thống kiểm thử tự động có giao diện trực quan, phù hợp môi trường dự án nội bộ doanh nghiệp với các yêu cầu:

- Dễ sử dụng cho người không chuyên kỹ thuật.
- Hỗ trợ phân quyền RBAC và chia sẻ project theo thành viên.
- Có khả năng mở rộng nghiệp vụ kiểm thử (test case versioning, suite, CI trigger).
- Tạo báo cáo và dashboard thống kê rõ ràng phục vụ đánh giá chất lượng.

### 1.3. Mục tiêu đề tài

- Phân tích và mô hình hóa nghiệp vụ kiểm thử no-code.
- Thiết kế và hiện thực hệ thống web gồm frontend, backend, cơ sở dữ liệu.
- Cung cấp đầy đủ chức năng từ tạo kịch bản đến thực thi, suite regression và báo cáo.
- Đánh giá khả năng ứng dụng trong quy trình QA thực tế.

### 1.4. Phạm vi đề tài

**Trong phạm vi:**

- Kiểm thử giao diện web nội bộ theo kịch bản no-code.
- Quản lý Project (owner + `ProjectMember`), Script/Step, `UiObject`, DataSet.
- Luồng TestCase ghi âm → Draft → Publish (`TestCaseVersion`).
- Test Suite regression và `SuiteRun` (UI + CI trigger).
- Thực thi test bằng Playwright và lưu kết quả chi tiết.
- Dashboard analytics (`GET /runs/analytics`), xuất PDF theo run.
- Tích hợp Linear khi step fail (nếu cấu hình biến môi trường).

**Ngoài phạm vi / giai đoạn sau:**

- Tự động kiểm thử mobile native.
- CI/CD đa môi trường, đa tenant toàn diện.
- AI tự sinh test case, self-healing selector nâng cao.
- Phân tích trend BI theo thời gian dài.

---

## Chương 2. Nghiệp vụ hệ thống

### 2.1. Các bên liên quan (Stakeholders)

- **ADMIN**: quản trị user/role, tạo project và gán thành viên, vận hành toàn bộ chức năng kiểm thử.
- **TESTER**: tạo/chỉnh sửa script, object, dataset, test case, suite; chạy test.
- **VIEWER**: xem kết quả, báo cáo, analytics; không thao tác tạo/sửa/xóa nhạy cảm.
- **Pipeline CI**: hệ thống bên ngoài gọi API trigger suite (không đăng nhập JWT, dùng bearer token).
- **Nhóm phát triển**: nhận issue Linear khi test fail để xử lý.

### 2.2. Mô tả nghiệp vụ tổng quát

Quy trình nghiệp vụ kiểm thử trong hệ thống được tổ chức theo chuỗi:

1. Người dùng đăng ký/đăng nhập (JWT).
2. **ADMIN** tạo Project và gán `memberIds` (TESTER/VIEWER) vào project.
3. Trong project, người dùng có quyền truy cập:
   - Tạo **TestScript** + **TestStep** (keyword: `navigate`, `click`, `fill`, `assertText`) **hoặc**
   - Ghi **TestCase** từ recorder → trạng thái **Draft** → **Publish** sau validate.
4. Khai báo **UiObject** (locator UI tái sử dụng cho script steps).
5. Tạo **DataSet** (JSON rows) nếu chạy data-driven.
6. Thực thi:
   - **Script run**: `POST /runs` (chọn browser, dataset tùy chọn).
   - **Suite run**: gom các `TestCaseVersion` đã publish → `POST /suites/:suiteId/runs`.
   - **CI trigger**: `POST /ci/trigger-suite` với `CI_API_TOKEN`.
7. Hệ thống ghi `TestRun`/`TestResult` hoặc `SuiteRun.results` (JSON).
8. Dashboard/analytics và xuất PDF báo cáo.
9. Khi step script fail: lưu screenshot; tạo issue **Linear** nếu đã cấu hình API key.

### 2.3. Tác nhân và quyền nghiệp vụ

Hệ thống dùng enum `Role`: `ADMIN` | `TESTER` | `VIEWER`.

#### 2.3.1. ADMIN

- Tạo/sửa/xóa project; gán danh sách thành viên (`ProjectMember`).
- Quản lý user: `POST /auth/admin/create-user`, `GET/PUT/DELETE /auth/admin/users/:id`.
- Toàn quyền như TESTER trên script, object, dataset, test case, suite, run.

#### 2.3.2. TESTER

- Truy cập project nếu là **owner** hoặc **member**.
- Tạo/sửa script, step, object, dataset, test case, suite.
- Chạy script run và suite run.
- Xem kết quả, analytics, xuất PDF.

#### 2.3.3. VIEWER

- Truy cập project nếu được gán member (hoặc là owner).
- Xem run, kết quả, analytics, tải PDF (`GET /runs/:id/report.pdf`).
- Không gọi endpoint yêu cầu `requireRole(["ADMIN","TESTER"])`.

#### 2.3.4. Quyền truy cập project

Người dùng được phép thao tác trên project khi thỏa **một trong hai** điều kiện:

- `project.ownerId === userId`
- Tồn tại bản ghi `ProjectMember` với `userId` tương ứng

*(Triển khai: `projectAccessibleWhere` trong `apps/api/src/lib/projectAccess.ts`)*

### 2.4. Danh sách use case chính

| Mã | Use case | Vai trò chính |
|----|----------|---------------|
| UC01 | Đăng ký tài khoản (`POST /auth/register`) | Mọi user |
| UC02 | Đăng nhập (`POST /auth/login`) | Mọi user |
| UC03 | Quản lý user/role (admin) | ADMIN |
| UC04 | Quản lý project và gán thành viên | ADMIN |
| UC05 | Quản lý test script và steps (keyword) | ADMIN, TESTER |
| UC06 | Quản lý UiObject (object repository) | ADMIN, TESTER |
| UC07 | Quản lý dataset | ADMIN, TESTER |
| UC08 | Ghi và tạo test case (`POST /projects/:id/tests`) | ADMIN, TESTER |
| UC09 | Smart record gợi ý bước (`POST .../smart-record`) | ADMIN, TESTER |
| UC10 | Publish test case (`POST .../publish`) | ADMIN, TESTER |
| UC11 | Tạo test suite từ phiên bản test case | ADMIN, TESTER |
| UC12 | Chạy script run (single / data-driven) | ADMIN, TESTER |
| UC13 | Chạy suite run từ UI | ADMIN, TESTER |
| UC14 | Trigger suite từ CI | Hệ thống CI |
| UC15 | Xem báo cáo, analytics, xuất PDF | ADMIN, TESTER, VIEWER |
| UC16 | Tự động tạo issue Linear khi step fail | Hệ thống (cấu hình) |
| UC17 | Đổi mật khẩu / quên mật khẩu | User |

### 2.5. Business Rules (quy tắc nghiệp vụ cốt lõi)

- **BR01**: Endpoint nghiệp vụ (trừ `/auth/register`, `/auth/login`, `/ci/trigger-suite`) yêu cầu JWT hợp lệ.
- **BR02**: Quyền API phụ thuộc role (`requireRole`: ADMIN / TESTER / VIEWER).
- **BR03**: Truy cập dữ liệu project theo **owner hoặc ProjectMember**, không chỉ theo owner.
- **BR04**: Chỉ **ADMIN** được tạo/sửa/xóa project và quản lý danh sách member.
- **BR05**: Đăng ký user mặc định role `TESTER`; không tự gán `ADMIN`.
- **BR06**: Mật khẩu đăng ký: ≥ 8 ký tự, có chữ hoa, chữ thường và số.
- **BR07**: Step trong script có `order` không âm; keyword thuộc tập `navigate | click | fill | assertText`.
- **BR08**: `timeoutMs` tùy chọn trên step: 1.000–180.000 ms.
- **BR09**: Test case mới tạo ở trạng thái lifecycle **Draft** (trong `TestCaseVersion.content`).
- **BR10**: Chỉ **Publish** khi `validateForPublish` thành công (bước hợp lệ; bước điều khiển `control.loop` cần `datasetRef`, `control.if` cần `condition`, v.v.).
- **BR11**: Suite chỉ tham chiếu `testCaseVersionId` thuộc cùng project.
- **BR12**: Mỗi script run lưu `TestRun.status` và chi tiết `TestResult` từng step (kèm screenshot khi fail).
- **BR13**: Suite run lưu tổng hợp trong `SuiteRun.results` (JSON); `trigger` = `ui` hoặc `ci`.
- **BR14**: CI trigger phải gửi `Authorization: Bearer <CI_API_TOKEN>` khớp biến môi trường.
- **BR15**: Linear issue chỉ tạo khi có `LINEAR_API_KEY` và `LINEAR_TEAM_ID`; lỗi Linear không làm hỏng luồng run chính.

### 2.6. Luồng nghiệp vụ tổng quát (As-is / To-be)

**As-is (trước khi có hệ thống):**

- Tạo test case thủ công trên file tài liệu.
- Thực thi bằng tay, ghi nhận kết quả rời rạc.
- Regression chạy lặp thủ công, khó tích hợp CI.

**To-be (sau khi triển khai):**

- Người dùng thao tác trên một nền tảng web (recorder, editor, scripts, suites).
- Kịch bản chuẩn hóa no-code + versioning test case.
- Chạy đơn lẻ, data-driven hoặc theo suite; CI có thể trigger regression.
- Kết quả tập trung, analytics và PDF tức thì.

---

## Chương 3. Phân tích hệ thống

### 3.1. Yêu cầu chức năng

**F1 – Identity & RBAC**

- Đăng ký, đăng nhập, `GET /auth/me`, đổi mật khẩu, quên/reset mật khẩu.
- Admin quản lý user và role.

**F2 – Quản lý project & tài sản kiểm thử**

- CRUD project (admin), danh sách project theo quyền truy cập.
- CRUD script/step, object, dataset (theo project).

**F3 – Test case no-code**

- Tạo test case từ bước ghi âm (`recorded.click`, v.v.).
- Smart record: gợi ý selector và bước assert.
- Publish sau validate (`lifecycle: Published`).

**F4 – Thực thi & suite**

- Chạy script: browser `chromium | firefox | webkit`, dataset tùy chọn.
- Tạo suite, chạy suite, xem `SuiteRun`.
- CI: `POST /ci/trigger-suite` với `suiteId`, `buildId`, `commitSha`, `environment`.

**F5 – Báo cáo & analytics**

- `GET /runs/:id/results`, `GET /runs/:id/report.pdf`.
- `GET /runs/analytics`: total, passed, failed, passRate, commonErrors (7/30 ngày; hỗ trợ filter project/suite).

### 3.2. Yêu cầu phi chức năng

- **Hiệu năng**: API phản hồi phù hợp quy mô đồ án; suite runner có timeout bước (~3s) ở mức MVP.
- **Bảo mật**: JWT, bcrypt password, RBAC, token CI riêng.
- **Tính dùng được**: UI Next.js App Router (dashboard, recorder, editor, scripts, projects, reports).
- **Khả năng mở rộng**: module route tách (`auth`, `projects`, `scripts`, `tests`, `suites`, `runs`, `ci`); package `@vietants/domain` cho validate step/publish.
- **Độ tin cậy**: log kết quả, screenshot khi fail; tích hợp ngoài (Linear) fail-safe.

### 3.3. Đặc tả dữ liệu mức nghiệp vụ

Các thực thể chính (Prisma):

| Thực thể | Mô tả nghiệp vụ |
|----------|-----------------|
| `User` | Tài khoản, `Role`, quan hệ owner/member |
| `Workspace` | Nhóm workspace (tuỳ chọn gắn `Project`) |
| `Project` | Không gian kiểm thử; `ownerId`, `members` |
| `ProjectMember` | User được chia sẻ project |
| `TestScript` | Kịch bản keyword-driven |
| `TestStep` | Bước: `order`, `keyword`, `targetId` → `UiObject`, `parameters` JSON |
| `UiObject` | Locator UI (object repository) |
| `DataSet` | Dữ liệu data-driven (`rows` JSON) |
| `TestRun` | Phiên chạy script: `status`, `browser`, `dataSetId` |
| `TestResult` | Kết quả từng step: `stepOrder`, `status`, `screenshot`, `message` |
| `TestCase` | Test case no-code (title, thuộc project) |
| `TestCaseVersion` | Phiên bản nội dung JSON (`lifecycle`, `steps`, `platform`) |
| `TestSuite` | Bộ regression |
| `TestSuiteItem` | Tham chiếu `testCaseVersionId`, `sortOrder` |
| `SuiteRun` | Lần chạy suite: `status`, `results` JSON, `trigger`, metadata CI |

### 3.4. Luồng xử lý nghiệp vụ cốt lõi

#### 3.4.1. Luồng chạy test script (single run)

1. User gọi `POST /runs` với `scriptId`, `browser` (tuỳ chọn), `dataSetId` (tuỳ chọn).
2. API kiểm tra quyền role TESTER/ADMIN.
3. `executor.ts` mở Playwright, lặp step theo `order`.
4. Mỗi step ghi `TestResult` (`passed` / `failed` + screenshot nếu lỗi).
5. Fail → gọi `createLinearIssueOnFailure` (nếu cấu hình).
6. Cập nhật `TestRun.status` = `passed` hoặc `failed`.

#### 3.4.2. Luồng chạy test data-driven

1. User chọn script + dataset (`rows` JSON).
2. Executor lặp từng dòng dữ liệu, thay thế tham số step tương ứng.
3. Ghi nhiều `TestResult` trong cùng hoặc theo quy tắc executor hiện tại.
4. Tổng hợp trạng thái run cuối cùng.

#### 3.4.3. Luồng test case: Draft → Published

1. Recorder/UI gửi `POST /projects/:projectId/tests` với `name`, `steps[]`.
2. Domain `parseStep` validate từng bước; tạo `TestCase` + `TestCaseVersion` v1, `lifecycle: Draft`.
3. User chỉnh sửa trên editor (nếu cần).
4. `POST .../tests/:testCaseId/publish` → `validateForPublish` → cập nhật `lifecycle: Published`.
5. Phiên bản Published có thể đưa vào `TestSuiteItem`.

#### 3.4.4. Luồng suite regression

1. `POST /projects/:projectId/suites` với `name`, `items[{ testCaseVersionId, sortOrder }]`.
2. `POST /suites/:suiteId/runs` → tạo `SuiteRun` (`trigger: ui`).
3. `suite-runner.ts` chạy lần lượt item bằng Playwright (MVP: xử lý step dạng recorded/keyword trong content).
4. Kết quả ghi vào `SuiteRun.results`; `status` = `completed` / `failed`.

#### 3.4.5. Luồng CI trigger

1. Pipeline gọi `POST /ci/trigger-suite` + Bearer `CI_API_TOKEN`.
2. Body: `suiteId`, `buildId`, `commitSha`, `environment` (tuỳ chọn).
3. Tạo `SuiteRun` (`trigger: ci`, `status: running`) → `executeSuiteRun`.
4. Trả `202` + `runId`, `status`, `results`.

#### 3.4.6. Luồng xử lý lỗi (script run)

1. Step fail → `TestResult` failed + screenshot.
2. `TestRun` → `failed`.
3. Linear: tạo issue (không chặn luồng nếu API Linear lỗi).

---

## Chương 4. Thiết kế hệ thống

### 4.1. Kiến trúc tổng quan

- **Frontend**: Next.js App Router (`apps/web`).
- **Backend**: Express (`apps/api`), mount route theo module.
- **Database**: PostgreSQL + Prisma (`apps/api/prisma/schema.prisma`).
- **Domain**: `@vietants/domain` — validate step, publish, lifecycle.
- **Execution**: Playwright (`executor.ts` cho script; `suite-runner.ts` cho suite).

### 4.2. Thiết kế các phân hệ

#### 4.2.1. Phân hệ xác thực và phân quyền

- `routes/auth.ts`: register, login, me, change-password, forgot/reset, admin users.
- Middleware `authMiddleware` + `requireRole`.

#### 4.2.2. Phân hệ quản lý tài sản kiểm thử

- `projects`, `scripts`, `objects`, `datasets`, `tests` (test case), `suites`.
- Kiểm tra `projectAccessibleWhere` trên mọi thao tác theo project.

#### 4.2.3. Phân hệ thực thi và báo cáo

- `runs`: script execution, analytics, PDF.
- `suiteRuns` + `ci`: suite execution và trigger CI.
- `services/reportPdf.ts`, `services/linear.ts`.

### 4.3. Thiết kế API nghiệp vụ (tóm tắt theo code)

**Auth**

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `POST /auth/change-password`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- `POST /auth/admin/create-user`, `GET /auth/admin/users`, `PUT/DELETE /auth/admin/users/:id`

**Projects**

- `GET/POST /projects`, `GET/PUT/DELETE /projects/:id` (POST/PUT/DELETE: ADMIN)

**Scripts & assets**

- `GET/POST /scripts`, `GET/PUT/DELETE /scripts/:id`, `PUT /scripts/:id/steps`
- `GET/POST/PUT/DELETE /objects?projectId=`
- `GET/POST/PUT/DELETE /datasets?projectId=`

**Test cases**

- `GET/POST /projects/:projectId/tests`
- `POST /projects/:projectId/tests/smart-record`
- `POST /projects/:projectId/tests/:testCaseId/publish`

**Suites & runs**

- `GET/POST /projects/:projectId/suites`
- `POST /suites/:suiteId/runs`, `GET /suites/:suiteId/runs/:runId`
- `GET/POST /runs`, `GET /runs/analytics`, `GET /runs/:id/results`, `GET /runs/:id/report.pdf`

**CI**

- `POST /ci/trigger-suite` (Bearer token, không JWT user)

### 4.4. Thiết kế giao diện mức chức năng

| Trang (App Router) | Chức năng |
|------------------|-----------|
| `/login`, `/register` | Xác thực |
| `/forgot-password`, `/reset-password` | Khôi phục mật khẩu |
| `/dashboard` | Thống kê pass/fail, lỗi phổ biến |
| `/projects` | Quản lý project (admin) |
| `/scripts`, `/scripts/[id]` | Script & steps |
| `/objects`, `/datasets` | Object repository, dataset |
| `/recorder` | Ghi test case |
| `/editor` | Publish test case |
| `/reports`, `/report/[runId]` | Lịch sử & chi tiết run |
| `/suite-runs` | Theo dõi suite run |
| `/admin/users` | Quản lý user (admin) |
| `/settings/account` | Tài khoản |

### 4.5. Thiết kế bảo mật và kiểm soát truy cập

- JWT trên header cho API người dùng.
- RBAC theo `Role` trên từng route.
- Cô lập project: owner **hoặc** member (`ProjectMember`).
- CI endpoint: xác thực token riêng, không dùng JWT user.

---

## Chương 5. Kiểm thử và đánh giá

### 5.1. Chiến lược kiểm thử

- Kiểm thử API theo module (Auth, RBAC, Project access, Script, Test case publish, Suite, CI, Run).
- Kiểm thử tích hợp luồng end-to-end (recorder → publish → suite → run).
- Kiểm thử giao diện dashboard, reports, PDF.
- Kiểm thử CI trigger với token hợp/lệ không hợp lệ.

### 5.2. Bộ test case tiêu biểu

Tham chiếu `docs/testcases/Test-Cases.md` và `docs/testcases/Test-Plan.md`:

- Auth & RBAC
- Project & ProjectMember
- Script & Steps (keyword, timeout)
- Object Repository & Dataset
- Test case Draft/Publish
- Suite & SuiteRun
- CI trigger
- Execution, analytics & PDF

### 5.3. Tiêu chí đánh giá kết quả

- Đúng chức năng theo use case và business rules.
- Phân quyền project và role chính xác.
- Kết quả pass/fail phản ánh trạng thái thực thi Playwright.
- Suite run và CI trigger tạo được `SuiteRun` và kết quả JSON.
- Linear issue được tạo khi cấu hình đúng (không làm crash API).

### 5.4. Kết quả đạt được

- Nền tảng no-code testing với **hai** mô hình kịch bản: script keyword-driven và test case có versioning.
- Regression suite + trigger CI cơ bản.
- Dashboard analytics và báo cáo PDF.
- Mô hình chia sẻ project theo thành viên.

### 5.5. Hạn chế hiện tại

- Suite runner ở mức **MVP** (khác độ chi tiết so với script executor đầy đủ).
- Analytics aggregate 7/30 ngày, chưa có BI trend dài hạn.
- Thông báo Telegram được mô tả trong tài liệu triển khai nhưng **chưa** có service trong `apps/api/src` phiên bản hiện tại.
- `Workspace` trong schema chưa có luồng UI/API đầy đủ.
- Chưa tối ưu cho khối lượng rất lớn script/runs đồng thời.

---

## Chương 6. Kết luận và hướng phát triển

### 6.1. Kết luận

Đề tài đã giải quyết bài toán trọng tâm: rút ngắn thời gian kiểm thử thủ công và hạ thấp rào cản kỹ thuật. Nền tảng no-code chuẩn hóa tài sản kiểm thử, hỗ trợ regression theo suite, tích hợp CI trigger và báo cáo tập trung — phù hợp vận hành QA tại doanh nghiệp.

### 6.2. Hướng phát triển

- Nâng cấp suite runner đồng bộ với script executor (keyword đầy đủ, screenshot từng case).
- Bổ sung thông báo Telegram/Email/Webhook.
- Hoàn thiện quản lý `Workspace` và phân quyền chi tiết theo module.
- CI/CD đa môi trường, scheduler, dashboard trend.
- Mở rộng keyword và control flow (`control.loop`, `control.if`, `component.call`) trên UI editor.

---

## Phụ lục A. Mẫu đoạn văn có thể dùng trực tiếp trong DOCX

### A.1. Mục tiêu hệ thống

"Hệ thống kiểm thử tự động no-code được xây dựng nhằm hỗ trợ các nhóm QA/BA/PM tại doanh nghiệp thiết kế và thực thi kịch bản kiểm thử web một cách trực quan, không đòi hỏi kỹ năng lập trình chuyên sâu. Giải pháp chuẩn hóa test case có phiên bản, cho phép chạy regression theo suite và kích hoạt từ CI, đồng thời cung cấp báo cáo và thống kê tập trung."

### A.2. Giá trị thực tiễn

"Khi áp dụng vào môi trường dự án nội bộ, hệ thống cho phép chia sẻ project theo thành viên, tái sử dụng locator và dataset, tự động hóa chạy test đơn lẻ hoặc theo bộ suite. Kết quả được lưu trữ có cấu trúc, hỗ trợ xuất PDF và tích hợp Linear khi phát hiện lỗi, giúp rút ngắn vòng phản hồi giữa QA và nhóm phát triển."

### A.3. Định hướng mở rộng

"Giai đoạn tiếp theo tập trung hoàn thiện engine suite, mở rộng kênh cảnh báo, phân tích xu hướng lỗi theo thời gian và triển khai mô hình vận hành đa môi trường phù hợp quy mô doanh nghiệp lớn hơn."

---

## Phụ lục B. Tham chiếu tài liệu kỹ thuật đồng bộ

- `docs/final/01-srs.md` — đặc tả yêu cầu
- `docs/final/02-architecture-and-design.md` — kiến trúc và luồng
- `docs/final/06-system-architecture-diagrams.md` — bộ sơ đồ (ERD, use case, sequence)
- `apps/api/prisma/schema.prisma` — mô hình dữ liệu chuẩn
