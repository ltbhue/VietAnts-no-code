# BÁO CÁO ĐỒ ÁN TỐT NGHIỆP HOÀN CHỈNH

## THÔNG TIN CHUNG
- Trường: Trường Đại học Giao thông Vận tải  
- Khoa: Công nghệ Thông tin  
- Tên đề tài: Xây dựng hệ thống kiểm thử tự động no-code cho ứng dụng web nội bộ Vietants  
- Sinh viên thực hiện: [Điền tên sinh viên]  
- Mã sinh viên: [Điền mã sinh viên]  
- Lớp: [Điền lớp]  
- Khóa: [Điền khóa]  
- Giảng viên hướng dẫn: [Điền tên giảng viên]  
- Đơn vị ứng dụng: Vietants  
- Thời gian thực hiện: [Điền thời gian]  

---

## LỜI CẢM ƠN
Em xin chân thành cảm ơn quý thầy cô Khoa Công nghệ Thông tin, Trường Đại học Giao thông Vận tải đã tận tình giảng dạy, tạo nền tảng kiến thức và phương pháp tư duy trong suốt quá trình học tập. Em xin gửi lời biết ơn sâu sắc đến giảng viên hướng dẫn đã trực tiếp định hướng, góp ý chuyên môn và hỗ trợ em từ giai đoạn xây dựng ý tưởng đến khi hoàn thiện đồ án.

Em cũng xin cảm ơn đơn vị Vietants đã hỗ trợ dữ liệu nghiệp vụ, phản hồi thực tiễn và tạo điều kiện để hệ thống được kiểm chứng trong bối cảnh gần với vận hành thực tế. Những góp ý từ phía doanh nghiệp đã giúp đề tài có tính ứng dụng rõ ràng, không chỉ dừng ở mức lý thuyết.

Dù đã cố gắng hoàn thiện trong phạm vi thời gian cho phép, báo cáo khó tránh khỏi thiếu sót. Em rất mong nhận được ý kiến đóng góp từ quý thầy cô để tiếp tục hoàn thiện hơn trong các phiên bản sau.

---

## LỜI MỞ ĐẦU
Trong bối cảnh chu kỳ phát hành phần mềm ngày càng ngắn và mức độ cạnh tranh ngày càng cao, chất lượng phần mềm trở thành yếu tố quyết định năng lực vận hành của doanh nghiệp. Tuy nhiên, kiểm thử thủ công dần bộc lộ nhiều hạn chế như tốn thời gian, khó đảm bảo tính lặp lại ổn định và phụ thuộc lớn vào kinh nghiệm cá nhân. Trong khi đó, các công cụ tự động hóa kiểm thử truyền thống lại yêu cầu năng lực lập trình tương đối cao, tạo rào cản đáng kể cho nhóm QA manual, BA và PM.

Xuất phát từ bài toán thực tế tại Vietants, đề tài tập trung xây dựng một hệ thống kiểm thử tự động theo hướng no-code, cho phép người dùng không chuyên lập trình có thể tạo, chỉnh sửa, thực thi và theo dõi kết quả kiểm thử thông qua giao diện trực quan. Hệ thống triển khai theo mô hình kiểm thử hướng từ khóa (keyword-driven), kiểm thử dựa trên dữ liệu (data-driven), đồng thời tích hợp báo cáo và khả năng kết nối CI nhằm phục vụ kiểm thử hồi quy trước phát hành.

Báo cáo trình bày đầy đủ quá trình phân tích yêu cầu, thiết kế kiến trúc, xây dựng hệ thống, kiểm thử đánh giá và định hướng phát triển, dựa trên phạm vi đề tài cùng bộ tài liệu kỹ thuật hiện có của dự án. Nội dung được tổ chức theo hướng học thuật, nhấn mạnh khả năng ứng dụng thực tiễn trong môi trường doanh nghiệp.

---

## MỤC LỤC GỢI Ý (ĐỂ CHÈN MỤC LỤC TỰ ĐỘNG TRONG WORD)
1. Thông tin chung  
2. Lời cảm ơn  
3. Lời mở đầu  
4. Chương 1: Tổng quan đề tài  
5. Chương 2: Cơ sở lý thuyết và công nghệ  
6. Chương 3: Phân tích yêu cầu hệ thống  
7. Chương 4: Kiến trúc và thiết kế hệ thống  
8. Chương 5: Xây dựng và triển khai hệ thống  
9. Chương 6: Kiểm thử hệ thống và kết quả  
10. Chương 7: Kết luận và hướng phát triển  
11. Tài liệu tham khảo  
12. Phụ lục  

---

## DANH MỤC HÌNH ẢNH (KHUNG)
- Hình 1.1. Bối cảnh bài toán kiểm thử tại doanh nghiệp  
- Hình 2.1. Kiến trúc công nghệ tổng quát  
- Hình 4.1. Kiến trúc 3 lớp của hệ thống  
- Hình 4.2. Luồng thực thi test script  
- Hình 4.3. Luồng chạy suite từ CI  
- Hình 5.1. Giao diện đăng nhập  
- Hình 5.2. Giao diện dashboard  
- Hình 5.3. Giao diện editor/recorder  
- Hình 6.1. Biểu đồ tổng hợp pass/fail  

## DANH MỤC BẢNG (KHUNG)
- Bảng 3.1. Đối tượng người dùng và quyền hạn  
- Bảng 3.2. Nhóm yêu cầu chức năng  
- Bảng 3.3. Nhóm yêu cầu phi chức năng  
- Bảng 4.1. Các module backend chính  
- Bảng 4.2. Các thực thể dữ liệu cốt lõi  
- Bảng 6.1. Danh sách test đã thực hiện  
- Bảng 6.2. Tổng hợp kết quả kiểm thử  

---

## CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI

### 1.1. Lý do chọn đề tài
Tại nhiều nhóm phát triển phần mềm, quá trình kiểm thử vẫn phụ thuộc lớn vào kiểm thử thủ công. Cách làm này phù hợp ở quy mô nhỏ nhưng trở nên kém hiệu quả khi số lượng chức năng tăng, tần suất phát hành dày và yêu cầu hồi quy lặp lại liên tục. Các rủi ro thường gặp gồm bỏ sót testcase, sai lệch khi thực thi và khó thống nhất chuẩn báo cáo giữa các thành viên.

Trong khi đó, các framework automation phổ biến như Selenium, Cypress, Playwright thuần code dù mạnh nhưng đặt ra rào cản kỹ thuật cho nhóm người dùng thiên về nghiệp vụ. Từ đó, doanh nghiệp cần một giải pháp trung gian để vẫn tận dụng được sức mạnh automation nhưng giảm phụ thuộc vào kỹ năng lập trình.

### 1.2. Mục tiêu đề tài
- Xây dựng nền tảng no-code giúp tạo/chỉnh sửa/chạy test không cần viết code.
- Hoàn thiện quản lý tài khoản và phân quyền theo vai trò ADMIN, TESTER, VIEWER.
- Triển khai thực thi trên nhiều trình duyệt và hỗ trợ kiểm thử dựa trên dữ liệu.
- Cung cấp báo cáo chi tiết, dashboard trực quan và cơ chế theo dõi lỗi.
- Kết nối luồng CI để dùng như quality gate trước phát hành.

### 1.3. Phương pháp nghiên cứu và triển khai
- **Khảo sát nghiệp vụ**: thu thập bài toán thực tế từ nhóm QA/BA/PM và phân tích điểm nghẽn trong quy trình kiểm thử hiện tại.
- **Phân tích - thiết kế hệ thống**: xác định tác nhân, yêu cầu chức năng/phi chức năng, mô hình dữ liệu và luồng xử lý.
- **Triển khai theo vòng lặp tăng dần**: hoàn thiện các module lõi trước (auth, script, run), sau đó mở rộng suite, CI và báo cáo.
- **Kiểm thử xác minh**: xây dựng bộ test theo nhóm chức năng để đánh giá mức độ đáp ứng yêu cầu.

### 1.4. Phạm vi nghiên cứu
- Đối tượng kiểm thử: ứng dụng web nội bộ.
- Loại kiểm thử ưu tiên: Functional Testing, Regression Testing.
- Đối tượng sử dụng: QA manual, BA, PM, tester nội bộ không chuyên code.

Ngoài phạm vi hiện tại:
- Kiểm thử hiệu năng chuyên sâu.
- Kiểm thử bảo mật chuyên sâu.
- Hỗ trợ desktop/mobile native.
- Các tính năng nâng cao như self-healing selector, BI analytics toàn diện.

### 1.5. Kết quả kỳ vọng
- Một hệ thống no-code testing có thể vận hành ở mức MVP thực tế.
- Bộ API, giao diện và mô hình dữ liệu đáp ứng các luồng nghiệp vụ cốt lõi.
- Bộ tài liệu đầy đủ gồm SRS, kiến trúc, test plan, user manual và báo cáo tổng hợp.

---

## CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ

### 2.1. Cơ sở lý thuyết áp dụng
- **Keyword-driven testing**: biểu diễn hành động kiểm thử qua tập từ khóa chuẩn (`navigate`, `click`, `fill`, `assertText`).
- **Data-driven testing**: tái sử dụng cùng kịch bản với nhiều tập dữ liệu đầu vào.
- **RBAC (Role-Based Access Control)**: kiểm soát quyền thao tác theo vai trò.
- **Thiết kế module hóa**: tách route/service theo miền nghiệp vụ để dễ bảo trì.

### 2.2. Công nghệ sử dụng
#### 2.2.1. Backend
- Node.js + Express cho API.
- Prisma ORM cho truy cập và quản trị schema CSDL.
- PostgreSQL cho lưu trữ dữ liệu nghiệp vụ.
- Playwright cho engine thực thi test tự động.
- JWT + bcrypt cho xác thực và bảo mật mật khẩu.

#### 2.2.2. Frontend
- Next.js 16 làm nền tảng giao diện.
- TypeScript cho an toàn kiểu dữ liệu.
- Các thành phần UI phục vụ dashboard, editor, recorder, report.

#### 2.2.3. Công cụ phát triển
- Git/GitHub cho quản lý phiên bản.
- Postman cho kiểm thử API.
- Bộ test tự động để xác minh luồng chức năng chính.

### 2.3. Lý do chọn công nghệ
Cấu hình công nghệ hiện tại đảm bảo:
- Đồng nhất stack JavaScript/TypeScript.
- Tốc độ triển khai nhanh.
- Dễ mở rộng về module và chức năng.
- Phù hợp với yêu cầu bài toán no-code testing.

### 2.4. Nguyên tắc thiết kế được áp dụng
- **Đơn giản hóa thao tác người dùng**: ưu tiên thao tác trực quan thay vì cấu hình kỹ thuật phức tạp.
- **Tái sử dụng tài sản kiểm thử**: tách object repository và dataset để giảm chi phí bảo trì script.
- **Tách biệt trách nhiệm**: frontend tập trung trải nghiệm, backend tập trung nghiệp vụ và thực thi.
- **Khả năng mở rộng theo giai đoạn**: giữ kiến trúc đủ linh hoạt để nâng cấp từ MVP lên mức production.

---

## CHƯƠNG 3. PHÂN TÍCH YÊU CẦU HỆ THỐNG

### 3.1. Bài toán nghiệp vụ
Doanh nghiệp cần một hệ thống giúp chuyển đổi quy trình kiểm thử từ thủ công sang bán tự động/tự động, trong đó người dùng nghiệp vụ vẫn có thể chủ động tạo và vận hành test mà không cần viết code.

### 3.2. Tác nhân hệ thống
- **ADMIN**: quản trị người dùng, phân quyền, cấu hình cấp hệ thống.
- **TESTER**: xây dựng kịch bản, quản lý đối tượng, chạy test, theo dõi run.
- **VIEWER**: xem báo cáo, dashboard, tình trạng chất lượng.

### 3.3. Yêu cầu chức năng
#### F1. Identity Management
- Đăng ký/đăng nhập.
- Quản lý phiên làm việc.
- Lấy thông tin người dùng hiện tại.
- Quản trị tạo tài khoản và gán quyền.

#### F2. Test Script Management
- Quản lý script theo bước từ khóa.
- Quản lý object repository.
- Tạo testcase từ recorded steps.
- Publish testcase sau khi kiểm tra hợp lệ.

#### F3. Execution & Data Integration
- Chạy trên `chromium`, `firefox`, `webkit`.
- Chạy dữ liệu nhiều dòng (data-driven).
- Tạo test suite và chạy suite.
- Trigger suite từ pipeline CI.

#### F4. Reporting & Analytics
- Lưu kết quả theo từng step.
- Hỗ trợ export PDF báo cáo.
- Dashboard tổng hợp pass/fail, pass rate, lỗi phổ biến.

### 3.4. Yêu cầu phi chức năng
- Bảo mật truy cập API.
- Khả năng mở rộng module.
- Tính bảo trì cao.
- Truy vết lỗi rõ ràng.

### 3.5. Tiêu chí nghiệm thu
- Luồng xác thực và phân quyền hoạt động đúng.
- Chạy script/suite thành công theo kịch bản mẫu.
- Có báo cáo và số liệu thống kê khả dụng.

### 3.6. Giả định và ràng buộc
- Hệ thống tập trung cho ứng dụng web nội bộ, chưa tối ưu cho các nền tảng ngoài phạm vi.
- Người dùng cuối đã có kiến thức nghiệp vụ kiểm thử cơ bản.
- Môi trường vận hành có sẵn cơ sở dữ liệu và hạ tầng CI ở mức tối thiểu.

---

## CHƯƠNG 4. KIẾN TRÚC VÀ THIẾT KẾ HỆ THỐNG

### 4.1. Kiến trúc tổng thể
Hệ thống tổ chức theo 3 lớp:
1. Presentation: Web Next.js.
2. Application: API Express + services.
3. Data: PostgreSQL qua Prisma.

### 4.2. Thiết kế backend
Các module chính:
- `auth`: xác thực và phân quyền.
- `projects/scripts/objects/datasets`: quản lý tài sản kiểm thử.
- `tests`: quản lý testcase no-code.
- `runs`: thực thi run, analytics, report.
- `suites/suiteRuns`: quản lý và chạy regression suite.
- `ci`: nhận trigger từ CI/CD.

### 4.3. Thiết kế frontend
Các trang trọng tâm:
- Đăng nhập.
- Dashboard.
- Recorder.
- Editor.
- Quản lý project/script/object/dataset.
- Theo dõi suite run và report.

### 4.4. Thiết kế dữ liệu
Thực thể cốt lõi:
- `User`, `ProjectMember`.
- `Project`, `TestScript`, `TestStep`, `UiObject`, `DataSet`.
- `TestRun`, `TestResult`.
- `TestCase`, `TestCaseVersion`, `TestSuite`, `TestSuiteItem`, `SuiteRun`.

### 4.5. Luồng xử lý chính
- **Luồng chạy script**: nhận lệnh -> validate -> thực thi -> lưu kết quả step -> tổng hợp run.
- **Luồng chạy suite**: tạo suite -> trigger run -> chạy theo item -> lưu kết quả tổng hợp.
- **Luồng CI**: pipeline gọi API có token -> hệ thống xác thực -> tạo run -> trả `runId`.

### 4.6. Bảo mật và kiểm soát truy cập
- Xác thực bằng JWT trên các route bảo vệ.
- Phân quyền theo vai trò nhằm giới hạn phạm vi thao tác.
- Mật khẩu được băm bằng bcrypt trước khi lưu trữ.
- Tách endpoint quản trị để giảm rủi ro nâng quyền trái phép.

### 4.7. Khả năng mở rộng kiến trúc
- Bổ sung worker queue để xử lý run song song ở quy mô lớn.
- Tách dịch vụ báo cáo/analytics thành module độc lập khi số lượng run tăng.
- Mở rộng mô hình phân quyền theo project/workspace đa tenant.

---

## CHƯƠNG 5. XÂY DỰNG VÀ TRIỂN KHAI HỆ THỐNG

### 5.1. Cấu trúc dự án
- `apps/api`: backend.
- `apps/web`: frontend.
- `packages/domain`: schema/validation dùng chung.
- `docs`: tài liệu phân tích, thiết kế, kiểm thử, hướng dẫn sử dụng.

### 5.2. Quy trình triển khai
1. Cài dependency bằng pnpm workspace.
2. Cấu hình biến môi trường.
3. Migration/generate/seed cơ sở dữ liệu.
4. Chạy API tại `http://localhost:4000`.
5. Chạy Web tại `http://localhost:3000`.

### 5.3. Tính năng đã hoàn thiện
- Đăng ký, đăng nhập, phân quyền.
- CRUD script/step/object/dataset.
- Chạy test đa trình duyệt và data-driven.
- Quản lý testcase, publish testcase.
- Quản lý suite, suite run, CI trigger.
- Dashboard và báo cáo PDF.

### 5.4. Đóng góp chính của sản phẩm
- Đưa quy trình kiểm thử tự động đến gần nhóm người dùng nghiệp vụ.
- Chuẩn hóa dữ liệu kiểm thử (script, object, dataset, testcase, suite) trên cùng hệ thống.
- Tạo nền tảng kết nối giữa kiểm thử thủ công truyền thống và quy trình CI hiện đại.

### 5.5. Hướng dẫn bổ sung hình ảnh minh họa (để tăng điểm trình bày)
- Chèn ảnh giao diện đăng nhập, dashboard, editor, suite run, report.
- Mỗi ảnh cần có chú thích thống nhất: "Hình X.Y. Tên ảnh".
- Ưu tiên ảnh có dữ liệu minh họa thật để tăng tính thuyết phục.

---

## CHƯƠNG 6. KIỂM THỬ HỆ THỐNG VÀ KẾT QUẢ

### 6.1. Phương pháp kiểm thử
- Kiểm thử API theo từng nhóm route.
- Kiểm thử tích hợp các luồng nghiệp vụ chính.
- Kiểm thử smoke/e2e cho luồng MVP.

### 6.2. Bộ kiểm thử tiêu biểu
- `auth-login.spec.ts`
- `tests-routes.test.ts`
- `editor-publish.test.ts`
- `health-and-schema.test.ts`
- `suite-run.test.ts`
- `ci-trigger.test.ts`
- `e2e-mvp-flow.test.ts`

### 6.3. Kết quả đánh giá
- Các luồng chức năng trọng yếu hoạt động ổn định ở mức triển khai hiện tại.
- Luồng phân quyền, quản lý script và thực thi run đạt mục tiêu đề ra.
- Dashboard phản ánh được chỉ số cơ bản phục vụ theo dõi chất lượng.

### 6.4. Tiêu chí đánh giá định lượng (đề xuất trình bày khi bảo vệ)
- Tỷ lệ testcase chạy thành công trên bộ kiểm thử mẫu.
- Thời gian tạo kịch bản trung bình giữa cách làm no-code và cách viết script thủ công.
- Thời gian phản hồi lỗi từ lúc phát sinh đến lúc quan sát trên dashboard/report.
- Mức độ tái sử dụng object và dataset giữa các kịch bản.

### 6.5. Ưu điểm và hạn chế
**Ưu điểm**
- Giảm rào cản kỹ thuật cho nhóm nghiệp vụ.
- Chuẩn hóa luồng tạo/chạy/báo cáo kiểm thử.
- Có nền tảng mở rộng để tiến tới release gate tự động.

**Hạn chế**
- Suite runner mới ở mức MVP.
- Phân tích xu hướng theo thời gian chưa sâu.
- Recorder có thể mở rộng thêm khả năng capture tự động.

### 6.6. Đánh giá tổng hợp theo góc nhìn hội đồng
- **Tính mới ở mức ứng dụng**: đề tài không phát minh framework mới nhưng có giá trị ứng dụng cao khi chuyển hóa automation thành no-code.
- **Tính thực tiễn**: kiến trúc và chức năng bám sát nhu cầu doanh nghiệp, có khả năng triển khai thực tế.
- **Tính mở rộng**: mô hình dữ liệu và luồng nghiệp vụ đã chuẩn bị cho các giai đoạn phát triển tiếp theo.

---

## CHƯƠNG 7. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 7.1. Kết luận
Đề tài đã xây dựng được hệ thống kiểm thử tự động no-code phù hợp bối cảnh ứng dụng web nội bộ tại Vietants, đáp ứng mục tiêu giảm phụ thuộc vào lập trình, tăng mức độ chủ động cho người dùng nghiệp vụ và nâng cao hiệu quả kiểm thử hồi quy. Kết quả đạt được cho thấy hướng tiếp cận no-code có tính khả thi trong môi trường doanh nghiệp vừa và nhỏ, đồng thời tạo nền tảng để mở rộng thành quy trình kiểm thử tự động hóa toàn diện.

### 7.2. Hướng phát triển
1. Nâng cấp suite runner theo hướng thực thi sâu bằng Playwright.
2. Bổ sung cơ chế retry, phát hiện flaky test.
3. Mở rộng dashboard theo chuỗi thời gian.
4. Tăng cường cảnh báo thời gian thực (Telegram/Email/Webhook).
5. Hoàn thiện phân quyền chi tiết theo workspace/project.

---

## TÀI LIỆU THAM KHẢO
1. Tài liệu phạm vi đề tài (`Tài liệu.docx`).
2. Tài liệu mẫu/bản nháp (`NguyenXuanBinh12 (4).docx`).
3. `docs/final/01-srs.md`.
4. `docs/final/02-architecture-and-design.md`.
5. `docs/final/03-test-plan.md`.
6. `docs/final/04-user-manual.md`.
7. `docs/final/05-final-report-summary.md`.
8. Tài liệu chính thức: Express, Prisma, Playwright, Next.js.

---

## PHỤ LỤC
### Phụ lục A - Danh mục tài liệu nộp kèm
- SRS chi tiết.
- Sơ đồ hệ thống.
- Test plan.
- User manual.
- Báo cáo tổng hợp.

### Phụ lục B - Checklist trước khi nộp
- Điền đủ thông tin cá nhân ở trang đầu.
- Chèn ảnh giao diện thật vào Chương 5.
- Đánh số hình/bảng đúng quy chuẩn.
- Cập nhật mục lục tự động trong Word trước khi in.
- Đồng bộ thuật ngữ (không trộn lẫn quá nhiều Anh - Việt trong cùng một mục).
