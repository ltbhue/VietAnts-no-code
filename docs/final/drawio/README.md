# Biểu đồ draw.io (diagrams.net) — 12 nhóm đặc tả

File **`.drawio`** mở trực tiếp trên [diagrams.net](https://app.diagrams.net) (draw.io) để chỉnh **kéo-thả**, giống công cụ UML trong đồ án.

## Mở file

1. Vào https://app.diagrams.net (hoặc cài **draw.io Desktop**).
2. **File → Open from → Device** → chọn file trong thư mục này (ví dụ `stt-02-sequence.drawio`).
3. Chỉnh vị trí, màu, font, thêm khung `alt` / `opt` nếu cần.

## Bật thư viện UML (giống mẫu đồ án)

1. **More Shapes** (góc dưới trái).
2. Bật **UML** (và **Flowchart** nếu cần).
3. Kéo thêm: **Lifeline**, **Actor**, **Activation**, **Rhombus** (điều kiện), **Terminator** (bắt đầu/kết thúc).

## Danh sách file (24 file = 12 nhóm × 2)

| STT | Trình tự (Sequence) | Hoạt động (Activity) |
|-----|---------------------|----------------------|
| 1 | `stt-01-sequence.drawio` | `stt-01-activity.drawio` |
| 2 | `stt-02-sequence.drawio` | `stt-02-activity.drawio` |
| … | … | … |
| 12 | `stt-12-sequence.drawio` | `stt-12-activity.drawio` |

Ánh xạ với `17-dac-ta-chuc-nang-gop-nhom.md` (Hình 3.5.1a/b → 3.5.12a/b).

## Xuất ảnh chèn Word

1. Trong draw.io: **File → Export as → PNG** (hoặc PDF/SVG).
2. Chọn **Border width = 0**, **Zoom 200%** để chữ rõ.
3. Chèn vào Word: **Hình 3.5.xa** (trình tự), **Hình 3.5.xb** (hoạt động).

## Tạo lại từ Mermaid (nếu sửa file 14/15)

```bash
node scripts/generate-drawio-diagrams.js
```

## So với PNG Mermaid hiện có

| | Mermaid (`images/17-...`) | draw.io (thư mục này) |
|--|---------------------------|----------------------|
| Chỉnh tay | Khó (sửa code) | Dễ (kéo-thả) |
| Giao diện | Tự động, gọn | UML chuẩn, tùy chỉnh màu/font |
| Báo cáo | Đã có trong `.docx` | Xuất PNG mới nếu trường yêu cầu draw.io |

**42 use case chi tiết:** dùng file `12`/`13` làm tham chiếu, vẽ thêm từng sơ đồ trong draw.io hoặc nhân bản (`File → Duplicate`) từ mẫu STT tương ứng.
