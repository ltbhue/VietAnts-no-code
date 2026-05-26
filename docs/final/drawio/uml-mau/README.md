# Biểu đồ draw.io — theo mẫu UML đồ án

Mở tại https://app.diagrams.net → **File → Open** → chọn file `.drawio` trong thư mục này.

## Chuẩn hình (giống mẫu trường)

### Sơ đồ trình tự
| Ký hiệu | Ý nghĩa | Ví dụ |
|---------|---------|--------|
| Hình người | **Actor** — Người dùng | Tester, Admin |
| Tròn + gạch trái | **Boundary (GD)** — Giao diện | `GD_DangNhap` |
| Tròn + mũi tên | **Control (Ctr)** — Xử lý/API | `Ctr_DangNhap` |
| Tròn + gạch đáy | **Entity (E)** — CSDL | `E_User` |
| Mũi tên liền + số | Gọi / thao tác | `1. Nhập email, mật khẩu` |
| Mũi tên đứt | Trả về | `2. return ...` |

### Sơ đồ hoạt động
| Thành phần | Mô tả |
|------------|--------|
| Cột trái | **Người dùng** |
| Cột phải | **Hệ thống** |
| Ô vàng, viền đỏ | Bước đánh số `1.`, `2.`, … |
| Hình thoi đỏ | Điều kiện / rẽ nhánh |
| Chấm đen | Bắt đầu |
| Chấm đen viền đỏ | Kết thúc |

## Đặt tên file

| File | Nội dung |
|------|----------|
| `dc-01-sequence-uml.drawio` | ĐC-01 — trình tự |
| `dc-01-activity-uml.drawio` | ĐC-01 — hoạt động |
| … | … |
| `dc-42-activity-uml.drawio` | ĐC-42 — hoạt động |

**Tổng: 84 file** (42 use case × 2).

## Xuất ảnh chèn Word

1. Mở file `.drawio` → chỉnh lại chữ/nhãn nếu cần.
2. **File → Export as → PNG** (Zoom **200%**, Border **0**).
3. Chèn vào báo cáo: dưới mỗi Bảng đặc tả tương ứng.

## Tạo lại sau khi sửa file 12/13

```bash
node scripts/generate-drawio-uml-mau.js
```

## So với bản cũ

| Thư mục | Kiểu |
|---------|------|
| `drawio/` (stt-XX) | Gộp 12 nhóm, đơn giản |
| **`drawio/uml-mau/`** | **42 UC, đúng mẫu UML đồ án** ← dùng bản này |
