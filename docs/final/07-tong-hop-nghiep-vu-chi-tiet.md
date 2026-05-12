# TỔNG HỢP CHI TIẾT NGHIỆP VỤ HỆ THỐNG

> Dùng làm nội dung nền để biên soạn báo cáo DOCX đồ án tốt nghiệp  
> Đề tài: **Hệ thống kiểm thử tự động no-code cho ứng dụng web nội bộ Vietants**

---

## Chương 1. Mở đầu

### 1.1. Lý do chọn đề tài

Trong quy trình phát triển phần mềm nội bộ, các thay đổi chức năng diễn ra liên tục. Việc kiểm thử thủ công theo cách truyền thống tốn nhiều thời gian, phụ thuộc kỹ năng cá nhân và khó bảo đảm độ lặp lại. Trong khi đó, phần lớn nhân sự QA/BA/PM không có nền tảng lập trình chuyên sâu, dẫn đến rào cản khi tiếp cận các framework automation như Selenium/Playwright thuần code.

Đề tài xây dựng một nền tảng **no-code testing** cho phép người dùng không biết code vẫn có thể:

- Thiết kế kịch bản kiểm thử bằng keyword/action.
- Quản lý object locator tập trung.
- Chạy test theo dữ liệu (data-driven).
- Theo dõi kết quả, xuất báo cáo PDF, nhận cảnh báo khi lỗi.

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

- Kiểm thử giao diện web nội bộ theo kịch bản no-code.
- Quản lý Project, Script, Step, Object, Dataset.
- Thực thi test bằng Playwright và lưu kết quả.
- Dashboard theo dõi run, thống kê pass/fail, xuất PDF.

**Ngoài phạm vi:**

- Tự động kiểm thử mobile native.
- Tích hợp CI/CD quy mô lớn nhiều môi trường.
- AI tự sinh test case.

---

## Chương 2. Nghiệp vụ hệ thống

### 2.1. Các bên liên quan (Stakeholders)

- **Admin**: quản trị người dùng, giám sát toàn bộ dữ liệu.
- **Tester/QA**: tạo và vận hành kịch bản kiểm thử.
- **Viewer/PM/BA**: theo dõi kết quả, đánh giá chất lượng.
- **Nhóm phát triển**: nhận thông tin lỗi để sửa và cải tiến.

### 2.2. Mô tả nghiệp vụ tổng quát

Quy trình nghiệp vụ kiểm thử trong hệ thống được tổ chức theo chuỗi:

1. Người dùng đăng nhập hệ thống.
2. Tạo Project để quản lý phạm vi kiểm thử.
3. Tạo Script kiểm thử theo mục tiêu chức năng.
4. Khai báo các Step (keyword) cho từng script.
5. Khai báo Object Repository (locator phần tử UI).
6. Tạo Dataset để chạy dữ liệu mẫu (nếu cần).
7. Thực thi test run.
8. Hệ thống ghi nhận kết quả, thống kê pass/fail.
9. Người dùng xem báo cáo, xuất PDF.
10. Khi có lỗi, hệ thống gửi cảnh báo Telegram và có thể tạo issue Linear.

### 2.3. Tác nhân và quyền nghiệp vụ

#### 2.3.1. Admin

- Tạo/sửa/xóa dữ liệu trong phạm vi được thiết kế.
- Giám sát toàn bộ run và báo cáo.
- Quản lý cấu hình vận hành ở mức hệ thống.

#### 2.3.2. Tester/QA

- Tạo project, script, step, object, dataset.
- Chạy test thủ công theo nhu cầu.
- Xem run result, theo dõi lỗi, xuất báo cáo.

#### 2.3.3. Viewer

- Xem danh sách project, script, report theo quyền.
- Không thực hiện thao tác tạo/sửa/xóa nhạy cảm.

### 2.4. Danh sách use case chính

- UC01: Đăng ký tài khoản.
- UC02: Đăng nhập hệ thống.
- UC03: Quản lý project kiểm thử.
- UC04: Quản lý test script.
- UC05: Quản lý các bước kiểm thử (steps).
- UC06: Quản lý object repository.
- UC07: Quản lý dataset kiểm thử.
- UC08: Chạy test (single run/data-driven run).
- UC09: Xem báo cáo và thống kê.
- UC10: Xuất báo cáo PDF.
- UC11: Nhận thông báo lỗi qua Telegram.
- UC12: Tự động tạo issue trên Linear khi fail (tùy chọn cấu hình).

### 2.5. Business Rules (quy tắc nghiệp vụ cốt lõi)

- BR01: Người dùng phải đăng nhập để truy cập chức năng nghiệp vụ.
- BR02: Quyền truy cập API phụ thuộc role (RBAC).
- BR03: Mỗi project thuộc quyền quản lý của owner, dữ liệu phải được cô lập theo người dùng.
- BR04: Step trong script phải có thứ tự `order` rõ ràng.
- BR05: Một lần chạy test (run) phải lưu trạng thái tổng và chi tiết từng step.
- BR06: Nếu step thất bại, trạng thái run phải phản ánh đúng lỗi.
- BR07: Dữ liệu chạy data-driven phải khớp cấu trúc tham số step.
- BR08: Chỉ xuất được PDF khi user có quyền với run tương ứng.

### 2.6. Luồng nghiệp vụ tổng quát (As-is/To-be)

**As-is (trước khi có hệ thống):**

- Tạo test case thủ công trên file tài liệu.
- Thực thi bằng tay, ghi nhận kết quả rời rạc.
- Tổng hợp báo cáo tốn thời gian, dễ sai lệch.

**To-be (sau khi triển khai):**

- Người dùng thao tác toàn bộ trên 1 nền tảng web.
- Kịch bản được chuẩn hóa dạng no-code.
- Kết quả tập trung, có thể thống kê và xuất báo cáo tức thì.

---

## Chương 3. Phân tích hệ thống

### 3.1. Yêu cầu chức năng

- Đăng ký/đăng nhập và xác thực token.
- Quản lý project kiểm thử.
- Quản lý script và step theo keyword.
- Quản lý object locator dùng lại nhiều script.
- Quản lý dataset phục vụ data-driven testing.
- Chạy test theo script và lưu run result.
- Dashboard thống kê pass/fail.
- Xuất PDF báo cáo theo từng run.
- Tích hợp thông báo ngoài hệ thống (Telegram/Linear).

### 3.2. Yêu cầu phi chức năng

- **Hiệu năng**: phản hồi API nhanh trong quy mô dữ liệu đồ án.
- **Bảo mật**: JWT auth, kiểm tra role và owner.
- **Tính dùng được**: giao diện đơn giản cho người không code.
- **Khả năng mở rộng**: kiến trúc module hóa, dễ thêm keyword mới.
- **Độ tin cậy**: lưu log kết quả đầy đủ để truy vết.

### 3.3. Đặc tả dữ liệu mức nghiệp vụ

Các thực thể chính:

- `User`: thông tin đăng nhập, vai trò.
- `Project`: không gian nghiệp vụ chứa script/object/dataset.
- `TestScript`: kịch bản kiểm thử.
- `TestStep`: từng hành động no-code.
- `ObjectRepository`: locator UI tái sử dụng.
- `DataSet`: dữ liệu đầu vào cho data-driven.
- `TestRun`: phiên thực thi kịch bản.
- `TestResult`: kết quả chi tiết từng step.

### 3.4. Luồng xử lý nghiệp vụ cốt lõi

#### 3.4.1. Luồng chạy test single run

1. Người dùng chọn script.
2. Hệ thống nạp step theo thứ tự.
3. Trình thực thi Playwright chạy từng step.
4. Kết quả mỗi step được ghi `passed/failed`.
5. Tổng hợp trạng thái run và hiển thị report.

#### 3.4.2. Luồng chạy test data-driven

1. Người dùng chọn script + dataset.
2. Hệ thống lặp qua từng dòng dữ liệu.
3. Mỗi vòng lặp thực thi toàn bộ step với tham số tương ứng.
4. Ghi nhận nhiều bản ghi kết quả trong cùng run.
5. Tính toán tỷ lệ pass/fail toàn bộ lần chạy.

#### 3.4.3. Luồng xử lý lỗi

1. Step fail tạo `TestResult` trạng thái lỗi.
2. Cập nhật `TestRun` sang `failed` (hoặc trạng thái tương ứng theo quy tắc xử lý).
3. Gửi cảnh báo Telegram nếu cấu hình hợp lệ.
4. Tạo issue trên Linear nếu bật tích hợp.

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

- API đăng ký, đăng nhập.
- JWT token cho phiên người dùng.
- Middleware kiểm tra quyền theo role.

#### 4.2.2. Phân hệ quản lý tài sản kiểm thử

- Quản lý Project, Script, Step.
- Quản lý Object Repository và Dataset.
- Đảm bảo ràng buộc owner và tính nhất quán dữ liệu.

#### 4.2.3. Phân hệ thực thi và báo cáo

- Tiếp nhận yêu cầu chạy test.
- Điều phối execution engine.
- Lưu kết quả và sinh báo cáo PDF.
- Trả dữ liệu dashboard cho giao diện.

### 4.3. Thiết kế API nghiệp vụ (tóm tắt)

- `POST /auth/register`, `POST /auth/login`
- `GET/POST/PUT/DELETE /projects`
- `GET/POST/PUT/DELETE /scripts`, `PUT /scripts/:id/steps`
- `GET/POST/PUT/DELETE /objects`
- `GET/POST/PUT/DELETE /datasets`
- `GET/POST /runs`, `GET /runs/:id/results`
- `GET /runs/:id/report.pdf`

### 4.4. Thiết kế giao diện mức chức năng

- Màn hình đăng nhập.
- Dashboard tổng quan.
- Màn hình quản lý scripts.
- Màn hình quản lý datasets/objects.
- Màn hình reports và lịch sử runs.

### 4.5. Thiết kế bảo mật và kiểm soát truy cập

- Bảo vệ endpoint bằng JWT.
- Chặn truy cập trái phép khi thiếu token.
- Kiểm tra role ở các endpoint thao tác dữ liệu.
- Giới hạn truy cập dữ liệu theo owner.

---

## Chương 5. Kiểm thử và đánh giá

### 5.1. Chiến lược kiểm thử

- Kiểm thử API theo module (Auth, RBAC, Project, Script, Run).
- Kiểm thử tích hợp luồng end-to-end.
- Kiểm thử giao diện báo cáo và xuất PDF.
- Kiểm thử thông báo khi có lỗi run.

### 5.2. Bộ test case tiêu biểu

Tham chiếu bộ test case trong tài liệu:

- Auth & RBAC
- Project Management
- Script & Steps
- Object Repository
- Dataset
- Execution & Reporting

### 5.3. Tiêu chí đánh giá kết quả

- Đúng chức năng theo use case.
- Kết quả pass/fail phản ánh chính xác trạng thái thực thi.
- Báo cáo run đầy đủ thông tin.
- Hệ thống thông báo lỗi kịp thời.

### 5.4. Kết quả đạt được

- Hoàn thiện nền tảng no-code testing ở mức đồ án ứng dụng.
- Cho phép người dùng không code tạo và chạy test cơ bản.
- Có cơ chế báo cáo và tích hợp thông báo tự động.

### 5.5. Hạn chế hiện tại

- Chưa tối ưu cho khối lượng lớn script/runs.
- Chưa tích hợp sâu pipeline CI/CD.
- Chưa có cơ chế phân tích nguyên nhân lỗi nâng cao.

---

## Chương 6. Kết luận và hướng phát triển

### 6.1. Kết luận

Đề tài đã giải quyết được bài toán trọng tâm: rút ngắn thời gian kiểm thử thủ công và hạ thấp rào cản kỹ thuật khi tiếp cận automation testing. Nền tảng no-code giúp chuẩn hóa quy trình kiểm thử, nâng cao khả năng theo dõi chất lượng và hỗ trợ ra quyết định cho nhóm dự án.

### 6.2. Hướng phát triển

- Bổ sung nhiều keyword/action hơn cho step.
- Thêm lịch chạy tự động theo thời gian (scheduler).
- Tích hợp CI/CD và multi-environment.
- Thêm dashboard phân tích xu hướng lỗi theo thời gian.
- Cải tiến phân quyền chi tiết hơn theo module.

---

## Phụ lục A. Mẫu đoạn văn có thể dùng trực tiếp trong DOCX

### A.1. Mục tiêu hệ thống

"Hệ thống kiểm thử tự động no-code được xây dựng nhằm hỗ trợ các nhóm QA/BA/PM tại doanh nghiệp có thể thiết kế và thực thi kịch bản kiểm thử web một cách trực quan, không đòi hỏi kỹ năng lập trình chuyên sâu. Giải pháp giúp tăng tốc quy trình kiểm thử, giảm sai sót do thao tác thủ công và tạo nền tảng báo cáo tập trung cho hoạt động đảm bảo chất lượng phần mềm."

### A.2. Giá trị thực tiễn

"Khi áp dụng vào môi trường dự án nội bộ, hệ thống cho phép chuẩn hóa tài sản kiểm thử (script, object, dataset), tự động hóa việc chạy test và thu thập kết quả. Điều này giúp đội dự án theo dõi chất lượng phát hành nhanh hơn, đồng thời nâng cao khả năng truy vết lỗi và phản hồi cho nhóm phát triển."

### A.3. Định hướng mở rộng

"Trong giai đoạn tiếp theo, hệ thống có thể mở rộng theo hướng tích hợp CI/CD, tăng độ phủ keyword no-code, bổ sung phân tích dữ liệu kiểm thử và triển khai mô hình vận hành đa môi trường để phù hợp nhu cầu doanh nghiệp ở quy mô lớn hơn."
