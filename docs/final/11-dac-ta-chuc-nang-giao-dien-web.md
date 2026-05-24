# Đặc tả chức năng giao diện web — VietAnts No-code Testing

Tài liệu mô tả **42 use case** trên giao diện web, không gộp luồng. Mỗi bảng gồm 8 cột theo khung đồ án.

---

## A.1. Trang công khai & xác thực

### Bảng 3.3 — ĐC-01: Truy cập trang giới thiệu hệ thống

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Truy cập trang giới thiệu hệ thống |
| **Tác nhân** | Khách (chưa đăng nhập), Admin, Tester, Viewer |
| **Mục đích** | Giới thiệu hệ thống và điều hướng người dùng tới trang đăng nhập |
| **Điều kiện tiên quyết** | Frontend đang chạy; người dùng truy cập được URL gốc `/` |
| **Mô tả chung** | Trang chủ hiển thị tên sản phẩm, mô tả ngắn về kiểm thử no-code và nút **Đăng nhập**. Không gọi API backend |
| **Luồng sự kiện** | 1. Người dùng mở URL `/`. 2. Hệ thống hiển thị trang giới thiệu. 3. Người dùng nhấn **Đăng nhập**. 4. Hệ thống chuyển hướng sang `/login` |
| **Ngoại lệ** | Không có ngoại lệ nghiệp vụ; lỗi mạng khi tải trang do lỗi hạ tầng frontend |
| **Các yêu cầu đặc biệt** | Giao diện responsive; không yêu cầu xác thực; layout không dùng AppShell sidebar |

---

### Bảng 3.4 — ĐC-02: Đăng nhập hệ thống

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Đăng nhập hệ thống |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Xác thực danh tính và cấp quyền truy cập theo vai trò |
| **Điều kiện tiên quyết** | Tài khoản đã tồn tại; API có cấu hình `JWT_SECRET`; email/mật khẩu hợp lệ |
| **Mô tả chung** | Người dùng nhập email và mật khẩu. Backend kiểm tra hash bcrypt, sinh JWT (8 giờ), trả token và profile. Frontend lưu `authToken`, `authUser` vào localStorage |
| **Luồng sự kiện** | 1. Mở `/login`. 2. Nhập email, mật khẩu. 3. Nhấn **Đăng nhập** → `POST /auth/login`. 4. API validate (Zod), tìm user, so sánh mật khẩu. 5. Sinh JWT gồm `sub`, `email`, `role`. 6. Frontend lưu token và thông tin user. 7. Chuyển hướng `/dashboard` |
| **Ngoại lệ** | E1: Sai email/mật khẩu → 401, tăng bộ đếm thất bại. E2: Sau 5 lần sai trong 10 phút → 429, tạm khóa đăng nhập. E3: Thiếu `JWT_SECRET` → 500. E4: Không kết nối API → thông báo lỗi trên UI |
| **Các yêu cầu đặc biệt** | Khóa theo cặp email + IP; không tiết lộ user tồn tại hay không khi sai MK; mật khẩu không lưu plain text phía client |

---

### Bảng 3.5 — ĐC-03: Đăng ký tài khoản mới

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Đăng ký tài khoản mới |
| **Tác nhân** | Người dùng mới (đăng ký tự phục vụ) |
| **Mục đích** | Tạo tài khoản TESTER hoặc VIEWER để sử dụng hệ thống |
| **Điều kiện tiên quyết** | Email chưa được đăng ký; mật khẩu đáp ứng quy tắc độ mạnh |
| **Mô tả chung** | Form đăng ký gồm họ tên, email, mật khẩu, vai trò (TESTER/VIEWER). API hash mật khẩu bcrypt và tạo bản ghi User |
| **Luồng sự kiện** | 1. Mở `/register`. 2. Nhập họ tên, email, mật khẩu, chọn role. 3. Submit → `POST /auth/register`. 4. API validate: email hợp lệ, MK ≥8 ký tự, có hoa/thường/số. 5. Kiểm tra email trùng. 6. Tạo user, trả 201. 7. UI thông báo thành công, chuyển `/login` sau ~800ms |
| **Ngoại lệ** | E1: Email đã tồn tại → 409. E2: Dữ liệu không hợp lệ → 400 kèm chi tiết Zod. E3: Không kết nối API → hướng dẫn bật server |
| **Các yêu cầu đặc biệt** | Không cho đăng ký role ADMIN qua form công khai; mật khẩu lưu dạng hash trên server |

---

### Bảng 3.6 — ĐC-04: Yêu cầu quên mật khẩu

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Yêu cầu quên mật khẩu |
| **Tác nhân** | Admin, Tester, Viewer (quên mật khẩu) |
| **Mục đích** | Khởi tạo quy trình đặt lại mật khẩu an toàn |
| **Điều kiện tiên quyết** | Người dùng biết email đã đăng ký; API đang hoạt động |
| **Mô tả chung** | Người dùng nhập email. Hệ thống tạo reset token (TTL 15 phút) lưu in-memory. Phản hồi không tiết lộ email có tồn tại (ngoại trừ MVP trả token trong response để demo) |
| **Luồng sự kiện** | 1. Mở `/forgot-password`. 2. Nhập email. 3. Submit → `POST /auth/forgot-password`. 4. API validate email. 5. Nếu user tồn tại: sinh token ngẫu nhiên, lưu map token→userId. 6. Trả message thành công (+ `resetToken` trong MVP). 7. Người dùng chuyển sang `/reset-password` với token |
| **Ngoại lệ** | E1: Email không hợp lệ → 400. E2: Email không tồn tại → vẫn 200 với message chung (bảo mật) |
| **Các yêu cầu đặc biệt** | Token một lần, hết hạn 15 phút; production nên gửi token qua email thay vì trả trong JSON |

---

### Bảng 3.7 — ĐC-05: Đặt lại mật khẩu bằng token

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Đặt lại mật khẩu bằng token |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Gán mật khẩu mới sau khi quên mật khẩu |
| **Điều kiện tiên quyết** | Có reset token còn hiệu lực; mật khẩu mới đáp ứng quy tắc độ mạnh |
| **Mô tả chung** | Form nhận token và mật khẩu mới. API xác minh token, hash và cập nhật user, xóa token |
| **Luồng sự kiện** | 1. Mở `/reset-password`. 2. Nhập token, mật khẩu mới (và xác nhận trên UI). 3. Submit → `POST /auth/reset-password`. 4. API kiểm tra token tồn tại và chưa hết hạn. 5. Hash MK mới, cập nhật DB. 6. Xóa token. 7. Thông báo thành công, chuyển login |
| **Ngoại lệ** | E1: Token không hợp lệ/hết hạn → 400. E2: MK không đủ mạnh → 400. E3: Token đã dùng → 400 |
| **Các yêu cầu đặc biệt** | Token dùng một lần; invalidate sau khi đặt lại thành công |

---

### Bảng 3.8 — ĐC-06: Đổi mật khẩu (tài khoản đang đăng nhập)

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Đổi mật khẩu |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Người dùng tự cập nhật mật khẩu khi đã đăng nhập |
| **Điều kiện tiên quyết** | Đã đăng nhập (JWT hợp lệ); biết mật khẩu hiện tại |
| **Mô tả chung** | Màn `/settings/account` cho phép đổi MK với xác nhận MK mới trùng khớp trên client |
| **Luồng sự kiện** | 1. Đăng nhập, mở `/settings/account`. 2. Nhập MK hiện tại, MK mới, xác nhận. 3. UI kiểm tra xác nhận khớp. 4. Submit → `POST /auth/change-password` kèm Bearer token. 5. API so sánh MK cũ, validate MK mới, cập nhật hash. 6. Thông báo thành công, xóa form |
| **Ngoại lệ** | E1: MK hiện tại sai → 401. E2: MK mới trùng MK cũ → 400. E3: MK mới không đủ mạnh → 400. E4: Xác nhận không khớp → lỗi UI, không gọi API |
| **Các yêu cầu đặc biệt** | MK tối thiểu 8 ký tự, có hoa/thường/số; giới hạn độ dài input 255 ký tự trên UI |

---

### Bảng 3.9 — ĐC-07: Đăng xuất

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Đăng xuất |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Kết thúc phiên làm việc và xóa thông tin xác thực cục bộ |
| **Điều kiện tiên quyết** | Đang đăng nhập (có token trong localStorage) |
| **Mô tả chung** | Thao tác từ menu user trên AppShell; không gọi API revoke server-side (stateless JWT) |
| **Luồng sự kiện** | 1. Người dùng mở menu avatar. 2. Chọn **Đăng xuất**. 3. Frontend xóa `authToken`, `authUser`. 4. Chuyển hướng `/login` |
| **Ngoại lệ** | Không có ngoại lệ nghiệp vụ |
| **Các yêu cầu đặc biệt** | JWT vẫn còn hiệu lực trên server đến khi hết hạn; có thể bổ sung blacklist token ở phiên bản sau |

---

## A.2. Dashboard

### Bảng 3.10 — ĐC-08: Xem dashboard & thống kê analytics

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem dashboard & thống kê analytics |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Tổng quan dự án, lần chạy và chỉ số Pass/Fail theo thời gian |
| **Điều kiện tiên quyết** | Đã đăng nhập; user có quyền truy cập ít nhất một project (hoặc danh sách rỗng) |
| **Mô tả chung** | Dashboard tải projects, runs, suites và gọi `GET /runs/analytics` với khoảng 7 hoặc 30 ngày, có thể lọc theo project/suite |
| **Luồng sự kiện** | 1. Sau login vào `/dashboard`. 2. Gọi `GET /projects`, `GET /runs`. 3. Chọn project mặc định hoặc project khác. 4. Gọi `GET /projects/:id/suites`. 5. Chọn khoảng 7/30 ngày và/hoặc suite. 6. Gọi `GET /runs/analytics?days=&projectId=&suiteId=`. 7. Hiển thị tổng run, pass, fail, pass rate, lỗi phổ biến, time series |
| **Ngoại lệ** | E1: Token hết hạn → redirect login. E2: Lỗi API → hiển thị thông báo lỗi. E3: Không có dữ liệu → hiển thị 0 và biểu đồ rỗng |
| **Các yêu cầu đặc biệt** | Viewer chỉ xem, không thao tác mutate; nút làm mới dữ liệu; Admin thấy link tới quản lý dự án |

---

## A.3. Quản lý dự án

### Bảng 3.11 — ĐC-09: Xem danh sách dự án

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem danh sách dự án |
| **Tác nhân** | Admin |
| **Mục đích** | Xem các dự án user được phép truy cập (owner hoặc member) |
| **Điều kiện tiên quyết** | Đăng nhập role ADMIN; có JWT hợp lệ |
| **Mô tả chung** | Trang `/projects` gọi API lấy project kèm danh sách members và thông tin user |
| **Luồng sự kiện** | 1. Admin mở `/projects`. 2. `GET /projects` với Bearer token. 3. Backend lọc theo `projectAccessibleWhere`. 4. Trả danh sách project + members. 5. UI hiển thị bảng, hỗ trợ tìm kiếm theo tên |
| **Ngoại lệ** | E1: Không phải ADMIN → AppShell chuyển `/dashboard`. E2: 401 → login |
| **Các yêu cầu đặc biệt** | Chỉ ADMIN thấy menu Dự án; hiển thị owner và danh sách thành viên |

---

### Bảng 3.12 — ĐC-10: Tạo dự án mới

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Tạo dự án mới |
| **Tác nhân** | Admin |
| **Mục đích** | Tạo không gian làm việc chứa kịch bản, object, dataset |
| **Điều kiện tiên quyết** | Role ADMIN; tên dự án không rỗng |
| **Mô tả chung** | Form tạo project: tên, mô tả, chọn memberIds. Owner là admin đang đăng nhập |
| **Luồng sự kiện** | 1. Admin mở form tạo trên `/projects`. 2. Nhập tên, mô tả, chọn thành viên. 3. Submit → `POST /projects`. 4. API tạo Project, `ownerId = req.user.id`. 5. Tạo ProjectMember cho memberIds (trừ owner trùng). 6. Trả project kèm members. 7. UI cập nhật danh sách |
| **Ngoại lệ** | E1: Tên rỗng → 400. E2: Không đủ quyền → 403 |
| **Các yêu cầu đặc biệt** | Giới hạn tên 255 ký tự, mô tả 2000 ký tự trên UI |

---

### Bảng 3.13 — ĐC-11: Cập nhật dự án và gán thành viên

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Cập nhật dự án và gán thành viên |
| **Tác nhân** | Admin |
| **Mục đích** | Sửa thông tin dự án và đồng bộ danh sách thành viên |
| **Điều kiện tiên quyết** | Project tồn tại; admin có quyền truy cập project |
| **Mô tả chung** | `PUT /projects/:id` cập nhật name/description; nếu có memberIds thì xóa hết member cũ và tạo lại (transaction) |
| **Luồng sự kiện** | 1. Admin chọn **Sửa** trên một project. 2. Sửa tên, mô tả, tick thành viên. 3. Submit → `PUT /projects/:id`. 4. API kiểm tra quyền, cập nhật project. 5. Nếu có memberIds: deleteMany ProjectMember, createMany mới. 6. Trả project đầy đủ. 7. UI đóng form, refresh |
| **Ngoại lệ** | E1: Project không tồn tại → 404. E2: memberId không hợp lệ → lỗi transaction/400 |
| **Các yêu cầu đặc biệt** | Owner không bị loại khỏi project khi sync member |

---

### Bảng 3.14 — ĐC-12: Xóa dự án

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xóa dự án |
| **Tác nhân** | Admin |
| **Mục đích** | Xóa dự án không còn sử dụng |
| **Điều kiện tiên quyết** | Admin xác nhận xóa trên UI |
| **Mô tả chung** | `DELETE /projects/:id` với kiểm tra quyền truy cập |
| **Luồng sự kiện** | 1. Admin chọn **Xóa**, xác nhận dialog. 2. `DELETE /projects/:id`. 3. API deleteMany theo accessible where. 4. Trả 204. 5. UI loại project khỏi danh sách |
| **Ngoại lệ** | E1: Không tìm thấy/không quyền → không xóa. E2: Ràng buộc FK DB (script/object còn) → lỗi server tùy cấu hình cascade |
| **Các yêu cầu đặc biệt** | Nên cảnh báo dữ liệu con (script, run) trước khi xóa |

---

## A.4. Quản lý kịch bản kiểm thử

### Bảng 3.15 — ĐC-13: Xem danh sách kịch bản theo dự án

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem danh sách kịch bản theo dự án |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Tra cứu kịch bản thuộc project user được phép |
| **Điều kiện tiên quyết** | Đã đăng nhập; có ít nhất một project accessible |
| **Mô tả chung** | `/scripts` lọc theo projectId query, hiển thị tên, mô tả, project |
| **Luồng sự kiện** | 1. Mở `/scripts`. 2. Chọn project (dropdown). 3. `GET /scripts?projectId=`. 4. Backend lọc script thuộc project accessible. 5. Hiển thị danh sách, link tới chi tiết |
| **Ngoại lệ** | E1: Project không accessible → danh sách rỗng hoặc 403 |
| **Các yêu cầu đặc biệt** | Viewer chỉ xem, không nút tạo/xóa |

---

### Bảng 3.16 — ĐC-14: Tạo kịch bản mới

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Tạo kịch bản mới |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Khởi tạo TestScript rỗng để thiết kế bước |
| **Điều kiện tiên quyết** | Role ADMIN hoặc TESTER; projectId hợp lệ và accessible |
| **Mô tả chung** | Tạo script với name, description, projectId, createdById |
| **Luồng sự kiện** | 1. Trên `/scripts`, chọn project, nhập tên/mô tả. 2. Submit → `POST /scripts`. 3. API kiểm tra quyền project. 4. Tạo TestScript. 5. Trả 201. 6. UI refresh hoặc chuyển `/scripts/:id` |
| **Ngoại lệ** | E1: Thiếu tên → 400. E2: Không quyền project → 403 |
| **Các yêu cầu đặc biệt** | Viewer không được tạo |

---

### Bảng 3.17 — ĐC-15: Xóa kịch bản

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xóa kịch bản |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Loại bỏ kịch bản không dùng |
| **Điều kiện tiên quyết** | Script thuộc project accessible; user có quyền mutate |
| **Mô tả chung** | `DELETE /scripts/:id` |
| **Luồng sự kiện** | 1. Chọn xóa trên danh sách. 2. Xác nhận. 3. `DELETE /scripts/:id`. 4. 204. 5. Cập nhật UI |
| **Ngoại lệ** | E1: Script không tồn tại → 404. E2: Còn TestRun liên quan → có thể lỗi FK tùy DB |
| **Các yêu cầu đặc biệt** | Cảnh báo nếu script đã có lịch sử chạy |

---

### Bảng 3.18 — ĐC-16: Xem chi tiết kịch bản

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem chi tiết kịch bản |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Xem metadata và danh sách bước kiểm thử |
| **Điều kiện tiên quyết** | Script id hợp lệ; quyền truy cập project |
| **Mô tả chung** | `/scripts/[id]` tải script + steps, datasets và ui objects của project |
| **Luồng sự kiện** | 1. Mở `/scripts/:id`. 2. `GET /scripts/:id`. 3. `GET /datasets?projectId=`, `GET /objects?projectId=`. 4. Hiển thị timeline steps, form chạy test |
| **Ngoại lệ** | E1: 404 script. E2: 401/403 |
| **Các yêu cầu đặc biệt** | Viewer ẩn nút sửa/lưu/chạy |

---

### Bảng 3.19 — ĐC-17: Thêm / sửa / xóa / sắp xếp bước kiểm thử

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Biên tập bước kiểm thử trên giao diện |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Thiết kế luồng test bằng keyword no-code |
| **Điều kiện tiên quyết** | Đang xem chi tiết script; role mutate |
| **Mô tả chung** | Hỗ trợ keyword: navigate, click, fill, assertText. State `dirty` trên FE cho đến khi lưu |
| **Luồng sự kiện** | 1. Chọn keyword trên card. 2. Nhập tham số (url, selector, value, expected, dataKey, timeout). 3. Có thể chọn UiObject để điền selector. 4. Thêm bước / sửa bước / xóa / move up-down. 5. Đánh dấu dirty=true |
| **Ngoại lệ** | E1: Keyword navigate thiếu url → chặn khi lưu. E2: fill thiếu value và dataKey → chặt khi lưu |
| **Các yêu cầu đặc biệt** | timeoutMs 1000–180000 ms; semantic label cho selector dạng text thuần |

---

### Bảng 3.20 — ĐC-18: Lưu danh sách bước lên server

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Lưu danh sách bước kiểm thử |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Persist toàn bộ steps sau khi biên tập |
| **Điều kiện tiên quyết** | Có thay đổi dirty; steps hợp lệ theo rule API |
| **Mô tả chung** | `PUT /scripts/:id/steps` thay thế toàn bộ steps (delete + createMany trong transaction) |
| **Luồng sự kiện** | 1. Nhấn **Lưu bước**. 2. Gửi mảng steps (order, keyword, targetId, parameters). 3. API validate từng keyword. 4. Transaction xóa steps cũ, tạo mới. 5. Trả script kèm steps. 6. dirty=false |
| **Ngoại lệ** | E1: Validation lỗi → 400 + danh sách lỗi từng bước. E2: Script không tồn tại → 404 |
| **Các yêu cầu đặc biệt** | Lưu atomically; order 0-based trên DB, hiển thị Bước 1,2,... trên UI |

---

### Bảng 3.21 — ĐC-19: Chạy kịch bản kiểm thử

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Chạy kịch bản kiểm thử |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Thực thi tự động script trên Playwright và ghi kết quả |
| **Điều kiện tiên quyết** | Script có ít nhất một bước hợp lệ; đã lưu thay đổi (khuyến nghị) |
| **Mô tả chung** | Chọn browser (chromium/firefox/webkit) và dataset tuỳ chọn. `POST /runs` → executor |
| **Luồng sự kiện** | 1. Chọn dataset (optional), browser. 2. Nhấn **Chạy**. 3. `POST /runs` {scriptId, dataSetId?, browser}. 4. API kiểm tra script & dataset cùng project. 5. Executor tạo TestRun, mở browser, lặp rows dataset, chạy từng step. 6. Ghi TestResult pass/fail; fail → screenshot + Linear issue (nếu cấu hình). 7. Cập nhật TestRun status. 8. UI hiển thị timeline kết quả từng bước |
| **Ngoại lệ** | E1: Dataset không cùng project → 400. E2: Step fail → run failed, dừng bước hiện tại. E3: Selector không tìm thấy → message lỗi Playwright |
| **Các yêu cầu đặc biệt** | Data-driven: lặp từng row; chặn image/font/media để tăng tốc; tạo Linear issue không làm fail luồng chính |

---

## A.5. Đối tượng UI

### Bảng 3.22 — ĐC-20: Xem danh sách đối tượng UI

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem danh sách đối tượng UI |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Tra cứu object repository theo project |
| **Điều kiện tiên quyết** | Đăng nhập; chọn project accessible |
| **Mô tả chung** | `/objects` — `GET /objects?projectId=` |
| **Luồng sự kiện** | 1. Mở `/objects`. 2. Chọn project. 3. Gọi API. 4. Hiển thị name, locator, mô tả |
| **Ngoại lệ** | E1: Project không accessible → 403 |
| **Các yêu cầu đặc biệt** | Sắp xếp createdAt desc |

---

### Bảng 3.23 — ĐC-21: Thêm đối tượng UI

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Thêm đối tượng UI |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Lưu locator tái sử dụng cho nhiều kịch bản |
| **Điều kiện tiên quyết** | name và locator không rỗng |
| **Mô tả chung** | `POST /objects` {projectId, name, description?, locator} |
| **Luồng sự kiện** | 1. Nhập form trên `/objects`. 2. Submit → POST. 3. Kiểm tra quyền project. 4. Tạo UiObject. 5. Refresh danh sách |
| **Ngoại lệ** | E1: Locator rỗng → 400 |
| **Các yêu cầu đặc biệt** | Locator thường là CSS selector hoặc text label |

---

### Bảng 3.24 — ĐC-22: Sửa đối tượng UI

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Sửa đối tượng UI |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Cập nhật locator/name khi UI app thay đổi |
| **Điều kiện tiên quyết** | Object tồn tại; user access project |
| **Mô tả chung** | `PUT /objects/:id` |
| **Luồng sự kiện** | 1. Chọn sửa. 2. Sửa field. 3. PUT. 4. Cập nhật UI |
| **Ngoại lệ** | E1: Không tìm thấy → 404. E2: Đổi projectId sang project không quyền → 403 |
| **Các yêu cầu đặc biệt** | Steps đang reference targetId vẫn trỏ tới object id |

---

### Bảng 3.25 — ĐC-23: Xóa đối tượng UI

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xóa đối tượng UI |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Dọn object không còn dùng |
| **Điều kiện tiên quyết** | Xác nhận trên UI |
| **Mô tả chung** | `DELETE /objects/:id`; FK step targetId SetNull |
| **Luồng sự kiện** | 1. Xác nhận xóa. 2. DELETE. 3. 204. 4. Refresh |
| **Ngoại lệ** | E1: Không quyền → 404 |
| **Các yêu cầu đặc biệt** | Cảnh báo step đang liên kết object |

---

## A.6. Bộ dữ liệu

### Bảng 3.26 — ĐC-24: Xem danh sách bộ dữ liệu

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem danh sách bộ dữ liệu |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Xem các dataset phục vụ data-driven testing |
| **Điều kiện tiên quyết** | Project accessible |
| **Mô tả chung** | `/datasets` — GET với projectId |
| **Luồng sự kiện** | 1. Mở trang. 2. Chọn project. 3. GET /datasets. 4. Hiển thị name, rows preview |
| **Ngoại lệ** | E1: 403 project |
| **Các yêu cầu đặc biệt** | rows lưu dạng JSON array |

---

### Bảng 3.27 — ĐC-25: Tạo bộ dữ liệu

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Tạo bộ dữ liệu |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Định nghĩa nhiều bộ input cho cùng script |
| **Điều kiện tiên quyết** | rows là mảng object; name không rỗng |
| **Mô tả chung** | POST /datasets |
| **Luồng sự kiện** | 1. Nhập tên, mô tả, rows (JSON/editor). 2. POST. 3. Validate Zod. 4. Tạo DataSet. 5. Hiển thị |
| **Ngoại lệ** | E1: rows không phải array → 400 |
| **Các yêu cầu đặc biệt** | Key trong row khớp dataKey trên step fill/assertText |

---

### Bảng 3.28 — ĐC-26: Cập nhật bộ dữ liệu

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Cập nhật bộ dữ liệu |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Sửa dữ liệu test mà không đổi script |
| **Điều kiện tiên quyết** | Dataset tồn tại |
| **Mô tả chung** | PUT /datasets/:id |
| **Luồng sự kiện** | 1. Sửa form. 2. PUT. 3. Cập nhật DB. 4. Refresh |
| **Ngoại lệ** | E1: 404/403 |
| **Các yêu cầu đặc biệt** | Run cũ vẫn giữ dataSetId snapshot |

---

### Bảng 3.29 — ĐC-27: Xóa bộ dữ liệu

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xóa bộ dữ liệu |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Loại dataset obsolete |
| **Điều kiện tiên quyết** | Xác nhận UI |
| **Mô tả chung** | DELETE /datasets/:id |
| **Luồng sự kiện** | 1. Xóa → DELETE. 2. 204. 3. Refresh |
| **Ngoại lệ** | E1: Run đang reference → SetNull trên run |
| **Các yêu cầu đặc biệt** | Không xóa nếu policy business yêu cầu giữ lịch sử |

---

## A.7. Báo cáo

### Bảng 3.30 — ĐC-28: Xem danh sách lần chạy & thống kê Pass/Fail

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem danh sách lần chạy & thống kê |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Theo dõi lịch sử thực thi kịch bản |
| **Điều kiện tiên quyết** | Đăng nhập |
| **Mô tả chung** | `/reports` — GET /runs (theo userId trên API hiện tại) |
| **Luồng sự kiện** | 1. Mở `/reports`. 2. GET /runs. 3. Tính total/passed/failed cards. 4. Hiển thị bảng runs |
| **Ngoại lệ** | E1: Không có run → 0 |
| **Các yêu cầu đặc biệt** | Hiển thị tên script, thời gian, trạng thái tiếng Việt |

---

### Bảng 3.31 — ĐC-29: Lọc báo cáo theo trạng thái / kịch bản

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Lọc báo cáo |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Thu hẹp danh sách run cần xem |
| **Điều kiện tiên quyết** | Đã tải danh sách runs |
| **Mô tả chung** | Query params status, scriptId gửi lên GET /runs |
| **Luồng sự kiện** | 1. Chọn trạng thái (passed/failed/queued). 2. Chọn script. 3. Gọi lại API với params. 4. Cập nhật bảng và thống kê |
| **Ngoại lệ** | E1: ScriptId không thuộc user runs → rỗng |
| **Các yêu cầu đặc biệt** | Filter client-side bổ sung nếu API chưa hỗ trợ đủ |

---

### Bảng 3.32 — ĐC-30: Xem chi tiết kết quả từng bước

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem chi tiết kết quả run |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Phân tích pass/fail theo từng step |
| **Điều kiện tiên quyết** | Run id hợp lệ thuộc user |
| **Mô tả chung** | GET /runs/:id/results — kèm stepMeta, objectMap, screenshots |
| **Luồng sự kiện** | 1. Chọn **Chi tiết** trên một run. 2. GET results. 3. Hiển thị bảng stepOrder, keyword, status, message. 4. Hiển thị ảnh screenshot nếu fail |
| **Ngoại lệ** | E1: 404 run |
| **Các yêu cầu đặc biệt** | Screenshot qua URL `/screenshots/...` trên API host |

---

### Bảng 3.33 — ĐC-31: Tải báo cáo PDF một lần chạy

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Tải báo cáo PDF |
| **Tác nhân** | Admin, Tester, Viewer |
| **Mục đích** | Xuất báo cáo formal cho run |
| **Điều kiện tiên quyết** | Run tồn tại; user có quyền xem |
| **Mô tả chung** | GET /runs/:id/report.pdf — generate PDF bằng Playwright HTML render |
| **Luồng sự kiện** | 1. Nhấn **Tải PDF**. 2. fetch với Bearer header. 3. API generateRunPdf. 4. Trả application/pdf. 5. Browser download file |
| **Ngoại lệ** | E1: 404. E2: Lỗi generate → thông báo |
| **Các yêu cầu đặc biệt** | Phải gửi Authorization vì link trần không mang JWT |

---

### Bảng 3.34 — ĐC-32: Xem chi tiết suite run theo Run ID

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem chi tiết suite run |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Tra cứu kết quả chạy bộ kiểm thử (MVP) |
| **Điều kiện tiên quyết** | Biết runId và suiteId |
| **Mô tả chung** | `/report/[runId]` — GET /suites/:suiteId/runs/:runId |
| **Luồng sự kiện** | 1. Mở URL với runId. 2. Nhập suiteId. 3. Nhấn tải. 4. Hiển thị JSON response thô |
| **Ngoại lệ** | E1: Thiếu suiteId → message UI. E2: 404 |
| **Các yêu cầu đặc biệt** | MVP — chưa có UI báo cáo suite đẹp như script run |

---

## A.8. Kiểm thử nhanh — Recorder & Editor

### Bảng 3.35 — ĐC-33: Ghi thao tác thủ công

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Ghi thao tác thủ công |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Xây dựng danh sách thao tác test không cần code |
| **Điều kiện tiên quyết** | Chọn project; có URL mục tiêu |
| **Mô tả chung** | `/recorder` — thêm click/fill/assertText/navigate vào mảng actions local |
| **Luồng sự kiện** | 1. Chọn project, URL. 2. Chọn loại thao tác, selector, value/expected. 3. **Thêm thao tác**. 4. Lặp. 5. Có thể xóa từng dòng hoặc xóa hết |
| **Ngoại lệ** | E1: Selector rỗng → không thêm |
| **Các yêu cầu đặc biệt** | Tối đa 255 ký tự một số field text |

---

### Bảng 3.36 — ĐC-34: Import kịch bản từ script Playwright

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Import script Playwright |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Chuyển codegen Playwright sang actions no-code |
| **Điều kiện tiên quyết** | Dán script hợp lệ (goto, click, fill, expect) |
| **Mô tả chung** | Parser client-side `parsePlaywrightScriptToActions` |
| **Luồng sự kiện** | 1. Dán script vào textarea. 2. **Import**. 3. Parse từng dòng. 4. Gán actions[], cập nhật URL từ goto đầu tiên. 5. Thông báo số thao tác |
| **Ngoại lệ** | E1: Không parse được → lỗi UI. E2: Script quá dài → giới hạn 20000 ký tự |
| **Các yêu cầu đặc biệt** | Hỗ trợ page.goto, locator.click, getByRole fill, expect toContainText |

---

### Bảng 3.37 — ĐC-35: Phân tích ghi thao tác thông minh (Smart Record)

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Smart Record |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Đánh giá độ ổn định selector và gợi ý cải thiện |
| **Điều kiện tiên quyết** | Có URL và ít nhất 1 action |
| **Mô tả chung** | POST /projects/:id/tests/smart-record |
| **Luồng sự kiện** | 1. Nhấn phân tích smart. 2. Gửi url + actions. 3. API tính selectorScore, smartSteps, suggestions. 4. Hiển thị JSON preview |
| **Ngoại lệ** | E1: 400 dữ liệu. E2: API lỗi |
| **Các yêu cầu đặc biệt** | Gợi ý thêm assertText sau thao tác quan trọng |

---

### Bảng 3.38 — ĐC-36: Tạo test case ở trạng thái Draft

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Tạo test case Draft |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Lưu test case version 1 lifecycle Draft từ recorder |
| **Điều kiện tiên quyết** | ≥1 thao tác hợp lệ ngoài navigate |
| **Mô tả chung** | POST /projects/:id/tests — tạo TestCase + TestCaseVersion |
| **Luồng sự kiện** | 1. Nhấn tạo test draft. 2. Build steps (navigate + recorded steps). 3. POST {name, platform, steps}. 4. parseStep validate. 5. Tạo case + version content Draft. 6. Hiển thị id, version |
| **Ngoại lệ** | E1: Step invalid → 400. E2: Project không tồn tại → 404 |
| **Các yêu cầu đặc biệt** | platform mặc định desktop-web |

---

### Bảng 3.39 — ĐC-37: Publish test case

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Publish test case |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Chuyển test case sang Published sau validate |
| **Điều kiện tiên quyết** | Có testCaseId, projectId; version mới nhất tồn tại |
| **Mô tả chung** | `/editor` — POST .../tests/:testCaseId/publish |
| **Luồng sự kiện** | 1. Nhập project ID, test case ID. 2. Publish. 3. validateForPublish(steps, lifecycle, platform). 4. Cập nhật content lifecycle Published. 5. Trả ok + version |
| **Ngoại lệ** | E1: Validation fail → 400 errors[]. E2: Không tìm thấy case → 404 |
| **Các yêu cầu đặc biệt** | Validate control.loop, control.if, component.call nếu có |

---

## A.9. Bộ kiểm thử

### Bảng 3.40 — ĐC-38: Chạy test suite từ giao diện

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Chạy test suite (UI) |
| **Tác nhân** | Admin, Tester |
| **Mục đích** | Thực thi regression suite gồm nhiều test case version |
| **Điều kiện tiên quyết** | Suite tồn tại; user access project của suite |
| **Mô tả chung** | `/suite-runs` — POST /suites/:suiteId/runs {environment} |
| **Luồng sự kiện** | 1. Nhập suite ID. 2. Chạy suite. 3. Tạo SuiteRun status running, trigger=ui. 4. executeSuiteRun: lặp items, Playwright từng case. 5. Ghi results JSON. 6. Cập nhật passed/failed. 7. Hiển thị response |
| **Ngoại lệ** | E1: Suite không tồn tại → 404. E2: Lỗi executor → 500 + runId failed |
| **Các yêu cầu đặc biệt** | Dùng chromium; timeout step 3000ms trong suite runner |

---

## A.10. Quản trị người dùng

### Bảng 3.41 — ĐC-39: Xem danh sách người dùng

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xem danh sách người dùng |
| **Tác nhân** | Admin |
| **Mục đích** | Quản trị tài khoản hệ thống |
| **Điều kiện tiên quyết** | Role ADMIN |
| **Mô tả chung** | GET /auth/admin/users |
| **Luồng sự kiện** | 1. Mở `/admin/users`. 2. GET users + GET projects (cho dropdown). 3. Hiển thị bảng, search local |
| **Ngoại lệ** | E1: 403 → redirect dashboard |
| **Các yêu cầu đặc biệt** | Sắp xếp role, fullName |

---

### Bảng 3.42 — ĐC-40: Tạo người dùng (Admin)

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Tạo người dùng (Admin) |
| **Tác nhân** | Admin |
| **Mục đích** | Tạo tài khoản với role bất kỳ kể cả ADMIN |
| **Điều kiện tiên quyết** | Email chưa tồn tại; MK đủ mạnh |
| **Mô tả chung** | POST /auth/admin/create-user; optional projectId → ProjectMember |
| **Luồng sự kiện** | 1. Điền form tạo user. 2. Chọn role, project (optional). 3. POST. 4. Tạo user. 5. Gán member nếu có projectId. 6. Refresh list |
| **Ngoại lệ** | E1: Email trùng → 409. E2: Project không accessible → 400 |
| **Các yêu cầu đặc biệt** | Chỉ Admin gọi được endpoint |

---

### Bảng 3.43 — ĐC-41: Cập nhật thông tin / quyền người dùng

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Cập nhật người dùng |
| **Tác nhân** | Admin |
| **Mục đích** | Sửa họ tên, email, role, mật khẩu |
| **Điều kiện tiên quyết** | User id tồn tại; ít nhất một field thay đổi |
| **Mô tả chung** | PUT /auth/admin/users/:id |
| **Luồng sự kiện** | 1. Mở modal sửa. 2. Sửa field. 3. PUT. 4. Kiểm tra email trùng, ràng buộc admin duy nhất. 5. Cập nhật. 6. Refresh |
| **Ngoại lệ** | E1: Hạ quyền admin cuối → 400. E2: Email taken → 409 |
| **Các yêu cầu đặc biệt** | Không hạ quyền admin của chính mình nếu là admin duy nhất |

---

### Bảng 3.44 — ĐC-42: Xóa người dùng

| Cột | Nội dung |
|-----|----------|
| **Tên Usecase** | Xóa người dùng |
| **Tác nhân** | Admin |
| **Mục đích** | Loại tài khoản không còn dùng |
| **Điều kiện tiên quyết** | Không phải chính mình; thỏa ràng buộc nghiệp vụ |
| **Mô tả chung** | DELETE /auth/admin/users/:id |
| **Luồng sự kiện** | 1. Chọn xóa, xác nhận. 2. DELETE. 3. Kiểm tra: không xóa self; không xóa admin cuối; không xóa nếu owner project / creator script / có runs. 4. Xóa user. 5. 204 |
| **Ngoại lệ** | E1: Còn owned projects → 400 message. E2: Còn scripts created → 400. E3: Còn runs → 400 |
| **Các yêu cầu đặc biệt** | Bảo vệ toàn vẹn dữ liệu lịch sử kiểm thử |

---

## Phụ lục — Ánh xạ mã use case

| Mã | Bảng | Màn hình |
|----|------|----------|
| ĐC-01 | 3.3 | `/` |
| ĐC-02 | 3.4 | `/login` |
| ĐC-03 | 3.5 | `/register` |
| ĐC-04 | 3.6 | `/forgot-password` |
| ĐC-05 | 3.7 | `/reset-password` |
| ĐC-06 | 3.8 | `/settings/account` |
| ĐC-07 | 3.9 | AppShell |
| ĐC-08 | 3.10 | `/dashboard` |
| ĐC-09 | 3.11 | `/projects` |
| ĐC-10 | 3.12 | `/projects` |
| ĐC-11 | 3.13 | `/projects` |
| ĐC-12 | 3.14 | `/projects` |
| ĐC-13 | 3.15 | `/scripts` |
| ĐC-14 | 3.16 | `/scripts` |
| ĐC-15 | 3.17 | `/scripts` |
| ĐC-16 | 3.18 | `/scripts/[id]` |
| ĐC-17 | 3.19 | `/scripts/[id]` |
| ĐC-18 | 3.20 | `/scripts/[id]` |
| ĐC-19 | 3.21 | `/scripts/[id]` |
| ĐC-20 | 3.22 | `/objects` |
| ĐC-21 | 3.23 | `/objects` |
| ĐC-22 | 3.24 | `/objects` |
| ĐC-23 | 3.25 | `/objects` |
| ĐC-24 | 3.26 | `/datasets` |
| ĐC-25 | 3.27 | `/datasets` |
| ĐC-26 | 3.28 | `/datasets` |
| ĐC-27 | 3.29 | `/datasets` |
| ĐC-28 | 3.30 | `/reports` |
| ĐC-29 | 3.31 | `/reports` |
| ĐC-30 | 3.32 | `/reports` |
| ĐC-31 | 3.33 | `/reports` |
| ĐC-32 | 3.34 | `/report/[runId]` |
| ĐC-33 | 3.35 | `/recorder` |
| ĐC-34 | 3.36 | `/recorder` |
| ĐC-35 | 3.37 | `/recorder` |
| ĐC-36 | 3.38 | `/recorder` |
| ĐC-37 | 3.39 | `/editor` |
| ĐC-38 | 3.40 | `/suite-runs` |
| ĐC-39 | 3.41 | `/admin/users` |
| ĐC-40 | 3.42 | `/admin/users` |
| ĐC-41 | 3.43 | `/admin/users` |
| ĐC-42 | 3.44 | `/admin/users` |

*Tổng: **42** đặc tả chức năng (Bảng 3.3 – 3.44).*
