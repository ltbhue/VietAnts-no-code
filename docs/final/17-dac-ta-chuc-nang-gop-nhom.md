# Đặc tả gộp chức năng (theo mẫu Usecase)

## Usecase 1: Truy cập trang giới thiệu (ĐC-01)

- **Tên Usecase:** Truy cập trang giới thiệu
- **Tác nhân:** admin, tester, viewer
- **Mục đích:** Cho phép người dùng truy cập trang giới thiệu sản phẩm VietAnts Testing và điều hướng vào luồng đăng nhập.
- **Điều kiện tiên quyết:** Hệ thống hoạt động bình thường.
- **Mô tả chung:** Người dùng mở ứng dụng, xem trang giới thiệu và chọn chức năng đăng nhập.
- **Luồng sự kiện:**
  - Tại **Trang giới thiệu VietAnts Testing**, người dùng truy cập ứng dụng.
  - Hệ thống hiển thị thông tin sản phẩm và các nút chức năng chính.
  - Người dùng nhấn nút **Đăng nhập**.
  - Hệ thống chuyển sang **Trang Đăng nhập**.
- **Ngoại lệ:**
  - Không tải được trang do mất kết nối mạng.
  - Hệ thống thông báo trang tạm thời không khả dụng.
- **Các yêu cầu đặc biệt:** Nội dung trang giới thiệu phải tải nhanh và hiển thị đúng trên desktop.

## Usecase 2: Xác thực và quản lý tài khoản (ĐC-02 -> ĐC-07)

- **Tên Usecase:** Đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu, đổi mật khẩu, đăng xuất
- **Tác nhân:** admin, tester, viewer
- **Mục đích:** Cho phép người dùng xác thực tài khoản và quản lý thông tin mật khẩu trong hệ thống.
- **Điều kiện tiên quyết:** Người dùng có email hợp lệ; với đổi mật khẩu thì người dùng đã đăng nhập.
- **Mô tả chung:** Người dùng thao tác tại các màn hình tài khoản để đăng nhập hoặc xử lý mật khẩu khi cần.
- **Luồng sự kiện:**
  - Tại **Trang Đăng nhập**, người dùng nhập email và mật khẩu, sau đó nhấn **Đăng nhập**.
  - Hệ thống kiểm tra thông tin; nếu đúng thì điều hướng sang **Dashboard & Analytics**.
  - Nếu chưa có tài khoản, người dùng nhấn **Đăng ký tài khoản** để mở **Trang Đăng ký tài khoản**.
  - Người dùng nhập thông tin đăng ký (email, password, confirmPassword, ...).
  - Hệ thống kiểm tra dữ liệu; nếu hợp lệ thì tạo tài khoản và chuyển về **Trang Đăng nhập**.
  - Khi quên mật khẩu, người dùng vào **Trang Quên mật khẩu**, nhập email để nhận hướng dẫn.
  - Người dùng mở **Trang Đặt lại mật khẩu**, nhập mật khẩu mới và xác nhận.
  - Khi đã đăng nhập, người dùng vào **Màn hình Đổi mật khẩu** để cập nhật mật khẩu hiện tại.
  - Người dùng nhấn **Đăng xuất**; hệ thống kết thúc phiên và quay lại **Trang Đăng nhập**.
- **Ngoại lệ:**
  - Thông tin không được để trống.
  - Email hoặc mật khẩu không đúng khi đăng nhập.
  - Email đã tồn tại khi đăng ký.
  - Token đặt lại mật khẩu hết hạn hoặc không hợp lệ.
- **Các yêu cầu đặc biệt:** Mỗi email chỉ được sử dụng để đăng ký duy nhất một tài khoản.

## Usecase 3: Dashboard và thống kê (ĐC-08)

- **Tên Usecase:** Dashboard và thống kê
- **Tác nhân:** admin, tester, viewer
- **Mục đích:** Cho phép người dùng xem nhanh chất lượng kiểm thử qua chỉ số và biểu đồ.
- **Điều kiện tiên quyết:** Người dùng đã đăng nhập thành công.
- **Mô tả chung:** Người dùng truy cập màn hình dashboard để theo dõi tổng quan tình trạng chạy test.
- **Luồng sự kiện:**
  - Người dùng mở **Dashboard & Analytics** từ menu chính.
  - Hệ thống hiển thị tổng số lần chạy, Pass/Fail và lỗi phổ biến.
  - Người dùng chọn bộ lọc thời gian hoặc dự án.
  - Hệ thống cập nhật biểu đồ và danh sách theo bộ lọc.
  - Người dùng nhấn vào số liệu để chuyển sang **Trang Báo cáo & Runs**.
- **Ngoại lệ:**
  - Không có dữ liệu trong khoảng thời gian đã chọn.
  - Lỗi tải biểu đồ từ hệ thống.
- **Các yêu cầu đặc biệt:** Chỉ số phải đồng bộ với dữ liệu báo cáo theo cùng bộ lọc.

## Usecase 4: Quản lý dự án CRUD (ĐC-09 -> ĐC-12)

- **Tên Usecase:** Xem danh sách dự án, tạo dự án, cập nhật dự án, xóa dự án
- **Tác nhân:** admin, tester
- **Mục đích:** Cho phép người dùng quản lý danh mục dự án kiểm thử.
- **Điều kiện tiên quyết:** Người dùng đã đăng nhập và có quyền thao tác dự án.
- **Mô tả chung:** Người dùng làm việc tại màn hình dự án để thực hiện các thao tác thêm, sửa, xóa.
- **Luồng sự kiện:**
  - Người dùng mở **Trang Dự án** để xem danh sách.
  - Người dùng nhấn **Tạo dự án** và nhập thông tin trong **Hộp thoại Tạo dự án**.
  - Hệ thống kiểm tra dữ liệu và lưu dự án mới.
  - Người dùng chọn dự án, mở **Hộp thoại Cập nhật dự án**, chỉnh sửa và lưu.
  - Hệ thống cập nhật dữ liệu dự án.
  - Người dùng chọn **Xóa** và xác nhận trong **Hộp thoại Xóa dự án**.
  - Hệ thống xóa dự án và làm mới danh sách.
- **Ngoại lệ:**
  - Tên dự án trống hoặc trùng trong cùng phạm vi quản lý.
  - Dự án đang có dữ liệu ràng buộc nên chưa thể xóa.
- **Các yêu cầu đặc biệt:** Các thao tác cập nhật/xóa phải có xác nhận để tránh thao tác nhầm.

## Usecase 5: Quản lý kịch bản kiểm thử (ĐC-13 -> ĐC-18)

- **Tên Usecase:** Xem danh sách kịch bản, tạo kịch bản, xóa kịch bản, xem chi tiết, biên tập bước, lưu danh sách bước
- **Tác nhân:** admin, tester
- **Mục đích:** Cho phép người dùng tạo và quản lý kịch bản kiểm thử dạng keyword.
- **Điều kiện tiên quyết:** Đã chọn dự án và có quyền thao tác kịch bản.
- **Mô tả chung:** Người dùng thao tác từ danh sách kịch bản đến màn hình chi tiết để cấu hình các bước kiểm thử.
- **Luồng sự kiện:**
  - Người dùng mở **Trang Kịch bản kiểm thử** để xem danh sách kịch bản.
  - Người dùng nhấn **Tạo kịch bản**, nhập thông tin cơ bản và lưu.
  - Hệ thống tạo kịch bản và hiển thị trong danh sách.
  - Người dùng mở **Màn hình Chi tiết kịch bản**.
  - Người dùng chỉnh bước tại **Trình biên tập bước kiểm thử** (thêm/sửa/xóa/sắp xếp).
  - Người dùng nhấn **Lưu danh sách bước**.
  - Hệ thống kiểm tra dữ liệu bước và lưu thay đổi nếu hợp lệ.
- **Ngoại lệ:**
  - Thiếu tham số bắt buộc trong một bước keyword.
  - Thứ tự bước không hợp lệ hoặc trùng.
- **Các yêu cầu đặc biệt:** Dữ liệu bước phải lưu theo thứ tự thực thi và giữ tính toàn vẹn.

## Usecase 6: Thực thi kịch bản (ĐC-19)

- **Tên Usecase:** Chạy kịch bản
- **Tác nhân:** admin, tester
- **Mục đích:** Cho phép người dùng thực thi kịch bản kiểm thử và nhận kết quả.
- **Điều kiện tiên quyết:** Kịch bản có tối thiểu một bước hợp lệ.
- **Mô tả chung:** Người dùng khởi chạy kịch bản từ màn hình chi tiết và theo dõi trạng thái thực thi.
- **Luồng sự kiện:**
  - Tại **Màn hình Chi tiết kịch bản**, người dùng nhấn **Chạy kịch bản**.
  - Hệ thống mở **Hộp thoại Chạy kịch bản** để chọn cấu hình.
  - Người dùng xác nhận chạy.
  - Hệ thống tạo run mới và mở **Màn hình Theo dõi thực thi**.
  - Hệ thống thực thi từng bước và cập nhật trạng thái theo thời gian thực.
  - Kết thúc chạy, hệ thống hiển thị kết quả tổng hợp và điều hướng sang báo cáo chi tiết.
- **Ngoại lệ:**
  - Lỗi thực thi tại một bước.
  - Không truy cập được môi trường kiểm thử.
- **Các yêu cầu đặc biệt:** Khi lỗi phải lưu log và ảnh chụp màn hình để phục vụ phân tích.

## Usecase 7: Quản lý đối tượng UI CRUD (ĐC-20 -> ĐC-23)

- **Tên Usecase:** Xem danh sách object, thêm object, sửa object, xóa object
- **Tác nhân:** admin, tester
- **Mục đích:** Cho phép người dùng quản lý kho đối tượng UI dùng cho keyword steps.
- **Điều kiện tiên quyết:** Đã chọn dự án.
- **Mô tả chung:** Người dùng thao tác với danh sách đối tượng UI và các hộp thoại CRUD.
- **Luồng sự kiện:**
  - Người dùng mở **Trang Kho đối tượng UI**.
  - Người dùng nhấn **Thêm đối tượng**, nhập dữ liệu trong **Hộp thoại Thêm đối tượng** rồi lưu.
  - Hệ thống kiểm tra dữ liệu và thêm đối tượng mới.
  - Người dùng chọn một đối tượng để sửa trong **Hộp thoại Sửa đối tượng**.
  - Hệ thống cập nhật thông tin object.
  - Người dùng xác nhận xóa tại **Hộp thoại Xóa đối tượng**.
  - Hệ thống xóa object và cập nhật danh sách.
- **Ngoại lệ:**
  - Selector không hợp lệ.
  - Object đang được tham chiếu nên chưa thể xóa.
- **Các yêu cầu đặc biệt:** Tên object trong cùng dự án phải là duy nhất.

## Usecase 8: Quản lý bộ dữ liệu CRUD (ĐC-24 -> ĐC-27)

- **Tên Usecase:** Xem danh sách dataset, tạo dataset, cập nhật dataset, xóa dataset
- **Tác nhân:** admin, tester
- **Mục đích:** Cho phép người dùng quản lý dữ liệu đầu vào cho data-driven testing.
- **Điều kiện tiên quyết:** Đã chọn dự án.
- **Mô tả chung:** Người dùng tạo và chỉnh dữ liệu test theo dòng/cột để phục vụ thực thi.
- **Luồng sự kiện:**
  - Người dùng mở **Trang Bộ dữ liệu**.
  - Người dùng chọn **Tạo bộ dữ liệu** và nhập dữ liệu trong **Hộp thoại Tạo bộ dữ liệu**.
  - Hệ thống kiểm tra định dạng dữ liệu và lưu.
  - Người dùng mở **Hộp thoại Cập nhật bộ dữ liệu** để chỉnh sửa dữ liệu.
  - Hệ thống cập nhật dataset.
  - Người dùng xác nhận xóa tại **Hộp thoại Xóa bộ dữ liệu**.
  - Hệ thống xóa dataset và làm mới danh sách.
- **Ngoại lệ:**
  - Dữ liệu sai cấu trúc cột.
  - Dataset đang được cấu hình chạy nên không thể xóa ngay.
- **Các yêu cầu đặc biệt:** Dataset phải hỗ trợ nhiều dòng dữ liệu cho một lần chạy lặp.

## Usecase 9: Báo cáo và xuất PDF (ĐC-28 -> ĐC-32)

- **Tên Usecase:** Xem danh sách runs, lọc báo cáo, chi tiết kết quả run, tải PDF, xem suite run
- **Tác nhân:** admin, tester, viewer
- **Mục đích:** Cho phép người dùng theo dõi lịch sử chạy và xuất báo cáo phục vụ đối soát.
- **Điều kiện tiên quyết:** Có dữ liệu run trong hệ thống.
- **Mô tả chung:** Người dùng thao tác tại màn hình báo cáo để xem kết quả chi tiết và tải file PDF.
- **Luồng sự kiện:**
  - Người dùng mở **Trang Báo cáo & Runs**.
  - Người dùng nhập điều kiện lọc (dự án, trạng thái, thời gian).
  - Hệ thống trả danh sách run phù hợp.
  - Người dùng mở **Màn hình Chi tiết Run** để xem từng bước.
  - Người dùng nhấn **Tải PDF**.
  - Hệ thống tạo file và hiển thị **Màn hình Tải báo cáo PDF**.
  - Người dùng tải báo cáo về máy.
- **Ngoại lệ:**
  - Không có dữ liệu theo bộ lọc.
  - Lỗi tạo file PDF.
- **Các yêu cầu đặc biệt:** Nội dung PDF phải khớp với dữ liệu hiển thị trên màn hình chi tiết run.

## Usecase 10: Ghi thao tác, test case và publish (ĐC-33 -> ĐC-37)

- **Tên Usecase:** Ghi thao tác thủ công, import Playwright script, smart record, tạo test case draft, publish test case
- **Tác nhân:** admin, tester
- **Mục đích:** Cho phép người dùng tạo test case nhanh từ thao tác thực tế và phát hành để sử dụng.
- **Điều kiện tiên quyết:** Người dùng có quyền thao tác test case trong dự án.
- **Mô tả chung:** Người dùng dùng các cơ chế ghi thao tác để sinh test case nháp rồi publish.
- **Luồng sự kiện:**
  - Người dùng mở **Trang Ghi thao tác**.
  - Người dùng chọn cách ghi: thủ công, **Màn hình Import Playwright** hoặc **Màn hình Smart Record**.
  - Hệ thống sinh danh sách bước đề xuất.
  - Người dùng rà soát trên **Trang Test Case Draft**.
  - Người dùng chỉnh sửa nội dung cần thiết.
  - Người dùng nhấn **Publish test case**.
  - Hệ thống kiểm tra dữ liệu và chuyển test case sang trạng thái published.
- **Ngoại lệ:**
  - Script import không đúng định dạng.
  - Thiếu thông tin bắt buộc khi publish.
- **Các yêu cầu đặc biệt:** Chỉ test case publish mới được đưa vào suite chạy chính thức.

## Usecase 11: Chạy test suite (ĐC-38)

- **Tên Usecase:** Chạy test suite
- **Tác nhân:** admin, tester
- **Mục đích:** Cho phép người dùng chạy một nhóm test case theo luồng regression.
- **Điều kiện tiên quyết:** Suite đã có ít nhất một test case được publish.
- **Mô tả chung:** Người dùng cấu hình và chạy suite để có kết quả tổng hợp toàn bộ bộ kiểm thử.
- **Luồng sự kiện:**
  - Người dùng mở **Màn hình Suite Runner**.
  - Người dùng chọn suite và cấu hình tham số chạy.
  - Người dùng nhấn **Chạy test suite**.
  - Hệ thống tạo suite run và thực thi tuần tự các test case.
  - Hệ thống cập nhật tiến trình tại **Màn hình Theo dõi Suite Run**.
  - Hệ thống tổng hợp kết quả pass/fail khi hoàn tất.
  - Người dùng mở chi tiết run để phân tích lỗi.
- **Ngoại lệ:**
  - Suite không có test case hợp lệ.
  - Một test case lỗi gây gián đoạn toàn bộ suite theo cấu hình dừng sớm.
- **Các yêu cầu đặc biệt:** Kết quả suite phải truy vết được tới từng test case thành phần.

## Usecase 12: Quản trị người dùng (ĐC-39 -> ĐC-42)

- **Tên Usecase:** Xem danh sách user, tạo user, cập nhật user, xóa user
- **Tác nhân:** admin
- **Mục đích:** Cho phép admin vận hành tài khoản và phân quyền người dùng hệ thống.
- **Điều kiện tiên quyết:** Người thao tác có quyền quản trị.
- **Mô tả chung:** Admin sử dụng màn hình quản trị để CRUD tài khoản và gán vai trò.
- **Luồng sự kiện:**
  - Admin mở **Trang Quản trị người dùng**.
  - Admin chọn **Tạo người dùng**, nhập thông tin tại **Hộp thoại Tạo người dùng**.
  - Hệ thống tạo tài khoản mới.
  - Admin chọn tài khoản cần sửa trong **Hộp thoại Cập nhật người dùng**.
  - Hệ thống cập nhật thông tin và vai trò.
  - Admin xác nhận xóa tại **Hộp thoại Xóa người dùng**.
  - Hệ thống xóa hoặc vô hiệu hóa tài khoản theo chính sách.
- **Ngoại lệ:**
  - Email đã tồn tại.
  - Không được xóa tài khoản quản trị cuối cùng.
- **Các yêu cầu đặc biệt:** Phân quyền theo vai trò phải có hiệu lực ngay sau khi cập nhật.
