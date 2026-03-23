# Hướng dẫn sử dụng ứng dụng kiểm thử no-code Vietants

## 1. Đăng nhập

- Mở trình duyệt và truy cập vào địa chỉ frontend (Next.js).
- Chọn nút **Đi tới màn hình đăng nhập** hoặc truy cập trực tiếp `/login`.
- Nhập **email** và **mật khẩu** được cấp, nhấn **Đăng nhập**.

## 2. Màn hình Dashboard

- Sau khi đăng nhập thành công, hệ thống chuyển sang `/dashboard`.
- Dashboard hiển thị danh sách các **Project** và nút điều hướng:
  - **Kịch bản**: sang trang `/scripts` để xem và chỉnh sửa kịch bản.
  - **Báo cáo**: sang trang `/reports` để xem thống kê kết quả kiểm thử.

## 3. Quản lý Kịch bản kiểm thử

- Truy cập `/scripts`:
  - Cột trái hiển thị danh sách các kịch bản mà bạn là người tạo.
  - Chọn một kịch bản để xem chi tiết **các bước (steps)**.
- Mỗi bước thể hiện:
  - `order`: thứ tự thực thi.
  - `keyword`: hành động (navigate, click, fill, assertText).
  - `targetId` (nếu có): tham chiếu tới đối tượng UI trong Object Repository.
  - `parameters`: tham số cho hành động (URL, selector, giá trị điền, text kiểm tra,...).

Trong bản hiện tại, việc tạo/sửa kịch bản và bước được thực hiện qua API (Postman) để minh họa mô hình no-code/low-code, có thể nâng cấp thành giao diện kéo-thả trong các bước tiếp theo.

## 4. Thực thi kịch bản (Execution)

- Tester sử dụng API `/runs` (Postman) để:
  - Chỉ định `scriptId` cần chạy.
  - Tùy chọn `dataSetId` để chạy theo kiểu data-driven testing.
- Dịch vụ thực thi sẽ:
  - Dùng Playwright mở trình duyệt.
  - Thực hiện lần lượt từng bước theo thứ tự.
  - Ghi nhận kết quả từng bước (Pass/Fail), log, screenshot nếu lỗi.

## 5. Xem báo cáo & Dashboard

- Truy cập `/reports`:
  - Thẻ thống kê tổng số lần chạy, số Pass và số Fail.
  - Bảng chi tiết các lần chạy gần đây: tên kịch bản, thời gian bắt đầu/kết thúc, trạng thái.
- Khi cần phân tích sâu hơn:
  - Gọi API `/runs/:id/results` để xem chi tiết từng bước, message và đường dẫn screenshot.

## 6. Vai trò người dùng

- **Admin**:
  - Toàn quyền quản lý user (qua backend/API), project, kịch bản.
  - Định nghĩa chuẩn quy ước keywords, locator và dữ liệu dùng chung.
- **Tester**:
  - Tạo project, kịch bản, object, dataset.
  - Thực thi kịch bản, xem báo cáo.
- **Viewer**:
  - Chỉ xem báo cáo và dashboard, không sửa/xoá cấu hình hay kịch bản.

