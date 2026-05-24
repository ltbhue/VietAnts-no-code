# Biểu đồ hoạt động (gộp nhóm) — Giao diện web

Các use case **gần nhau** gộp **một biểu đồ hoạt động**. Tham chiếu: `11-dac-ta-chuc-nang-giao-dien-web.md`.

| STT | Nhóm | Mã use case gộp |
|-----|------|-----------------|
| 1 | Trang chủ | ĐC-01 |
| 2 | Xác thực & tài khoản | ĐC-02 → ĐC-07 |
| 3 | Dashboard | ĐC-08 |
| 4 | Quản lý dự án | ĐC-09 → ĐC-12 |
| 5 | Quản lý kịch bản | ĐC-13 → ĐC-18 |
| 6 | Thực thi kịch bản | ĐC-19 |
| 7 | Đối tượng UI | ĐC-20 → ĐC-23 |
| 8 | Bộ dữ liệu | ĐC-24 → ĐC-27 |
| 9 | Báo cáo | ĐC-28 → ĐC-32 |
| 10 | Ghi thao tác & publish | ĐC-33 → ĐC-37 |
| 11 | Chạy suite | ĐC-38 |
| 12 | Quản trị người dùng | ĐC-39 → ĐC-42 |

**Tổng: 12 biểu đồ hoạt động** (thay cho 42 biểu đồ tách riêng).

---

## STT 1 — Trang chủ (ĐC-01)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[Mở /]
    B --> C[Hiển thị giới thiệu]
    C --> D{Nhấn Đăng nhập?}
    D -- Có --> E[/login/]
    D -- Không --> F([Kết thúc])
    E --> F
```

---

## STT 2 — Xác thực & quản lý tài khoản (ĐC-02 → ĐC-07)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B{Chọn chức năng}

    B --> C[/login — Đăng nhập/]
    C --> C1[Nhập email, MK]
    C1 --> C2{Khóa 5 lần sai?}
    C2 -- Có --> C3[Chờ 10 phút]
    C3 --> C1
    C2 -- Không --> C4{Xác thực OK?}
    C4 -- Không --> C5[Tăng đếm lỗi]
    C5 --> C1
    C4 -- Có --> C6[Lưu JWT → dashboard]

    B --> D[/register — Đăng ký/]
    D --> D1{MK + email hợp lệ?}
    D1 -- Không --> D2[Lỗi]
    D2 --> D
    D1 -- Có --> D3{Tạo user OK?}
    D3 --> D4[/login/]

    B --> E[/forgot-password/]
    E --> E1[Tạo reset token]
    E1 --> F[/reset-password/]
    F --> F1{Token hợp lệ?}
    F1 -- Không --> F2[Lỗi]
    F2 --> F
    F1 -- Có --> F3[Đặt MK mới → login]

    B --> G[/settings/account — Đổi MK/]
    G --> G1{MK cũ đúng, MK mới hợp lệ?}
    G1 -- Không --> G
    G1 -- Có --> G2[Thành công]

    B --> H[Đăng xuất — AppShell]
    H --> H1[Xóa localStorage]
    H1 --> I[/login/]

    C6 --> Z([Kết thúc])
    D4 --> Z
    F3 --> Z
    G2 --> Z
    I --> Z
```

---

## STT 3 — Dashboard (ĐC-08)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B{Có JWT?}
    B -- Không --> C[/login/]
    B -- Có --> D[Tải projects, runs, suites]
    D --> E[Chọn project / suite / 7 hoặc 30 ngày]
    E --> F[Gọi /runs/analytics]
    F --> G[Hiển thị KPI, biểu đồ, lỗi phổ biến]
    G --> H{Làm mới?}
    H -- Có --> D
    H -- Không --> I([Kết thúc])
```

---

## STT 4 — Quản lý dự án (ĐC-09 → ĐC-12)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B{Role ADMIN?}
    B -- Không --> C[Redirect dashboard]
    B -- Có --> D[Mở /projects]
    D --> E[Hiển thị danh sách — ĐC-09]
    E --> F{Thao tác?}

    F --> G[Tạo — ĐC-10]
    G --> G1{Nhập tên, members}
    G1 --> G2[POST /projects]
    G2 --> E

    F --> H[Sửa — ĐC-11]
    H --> H1[PUT /projects/:id]
    H1 --> E

    F --> I[Xóa — ĐC-12]
    I --> I1{Xác nhận?}
    I1 -- Không --> E
    I1 -- Có --> I2[DELETE]
    I2 --> E

    F --> J([Kết thúc])
    C --> J
```

---

## STT 5 — Quản lý kịch bản (ĐC-13 → ĐC-18)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[/scripts — chọn project/]
    B --> C[GET danh sách — ĐC-13]
    C --> D{Thao tác?}

    D --> E[Tạo script — ĐC-14]
    E --> C

    D --> F[Xóa script — ĐC-15]
    F --> C

    D --> G[Mở chi tiết /scripts/:id — ĐC-16]
    G --> H{canMutate?}
    H -- Không --> I[Chỉ xem steps]
    H -- Có --> J[Biên tập steps — ĐC-17]
    J --> J1[Thêm/sửa/xóa/sắp xếp]
    J1 --> J2{dirty?}
    J2 -- Có --> K[Lưu — ĐC-18]
    K --> K1{Validate server?}
    K1 -- Không --> L[Hiển thị lỗi từng bước]
    L --> J
    K1 -- Có --> M[dirty=false]
    M --> G
    J2 -- Không --> G

    D --> N([Kết thúc / sang Chạy test])
    I --> N
```

---

## STT 6 — Thực thi kịch bản (ĐC-19)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[Chọn browser, dataset]
    B --> C{dirty chưa lưu?}
    C -- Có --> D[Cảnh báo]
    D --> E[Nhấn Chạy]
    C -- Không --> E
    E --> F[POST /runs]
    F --> G[Tạo TestRun + mở Playwright]
    G --> H{Còn row dataset?}
    H -- Không --> O[Cập nhật passed]
    H -- Có --> I{Còn step?}
    I -- Không --> H
    I -- Có --> J[Thực thi keyword]
    J --> K{Pass?}
    K -- Có --> L[Ghi TestResult passed]
    L --> I
    K -- Không --> M[Screenshot + failed + Linear?]
    M --> N[Cập nhật run failed]
    N --> P[Hiển thị timeline UI]
    O --> P
    P --> Q([Kết thúc])
```

---

## STT 7 — Đối tượng UI CRUD (ĐC-20 → ĐC-23)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[/objects — chọn project/]
    B --> C[GET danh sách — ĐC-20]
    C --> D{Thao tác?}

    D --> E[Thêm — ĐC-21]
    E --> E1{locator hợp lệ?}
    E1 -- Không --> E
    E1 -- Có --> E2[POST]
    E2 --> C

    D --> F[Sửa — ĐC-22]
    F --> F1[PUT]
    F1 --> C

    D --> G[Xóa — ĐC-23]
    G --> G1{Xác nhận?}
    G1 -- Có --> G2[DELETE]
    G2 --> C

    D --> H([Kết thúc])
```

---

## STT 8 — Bộ dữ liệu CRUD (ĐC-24 → ĐC-27)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[/datasets/]
    B --> C[GET — ĐC-24]
    C --> D{Thao tác?}

    D --> E[Tạo — ĐC-25]
    E --> E1{rows là array?}
    E1 -- Không --> E
    E1 -- Có --> E2[POST]
    E2 --> C

    D --> F[Sửa — ĐC-26]
    F --> F1[PUT]
    F1 --> C

    D --> G[Xóa — ĐC-27]
    G --> G1{Xác nhận?}
    G1 -- Có --> G2[DELETE]
    G2 --> C

    D --> H([Kết thúc])
```

---

## STT 9 — Báo cáo (ĐC-28 → ĐC-32)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[/reports/]
    B --> C[GET /runs — ĐC-28]
    C --> D[Thẻ Pass/Fail + bảng]
    D --> E{Lọc? — ĐC-29}
    E -- Có --> F[GET với query]
    F --> D
    E -- Không --> G{Chọn run?}
    G -- Chi tiết --> H[GET /runs/:id/results — ĐC-30]
    H --> I{Hiển thị screenshot?}
    I --> G
    G -- Tải PDF --> J[GET report.pdf — ĐC-31]
    J --> K[Download file]
    K --> G
    G -- Suite run MVP --> L[/report/:runId + suiteId — ĐC-32/]
    L --> G
    G -- Thoát --> M([Kết thúc])
```

---

## STT 10 — Ghi thao tác & publish (ĐC-33 → ĐC-37)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[/recorder/]
    B --> C[Chọn project, URL]
    C --> D{Thao tác recorder?}

    D --> E[Thêm thao tác thủ công — ĐC-33]
    E --> D

    D --> F[Import Playwright — ĐC-34]
    F --> F1{Parse OK?}
    F1 -- Không --> D
    F1 -- Có --> D

    D --> G[Smart record — ĐC-35]
    G --> G1[POST smart-record]
    G1 --> D

    D --> H[Tạo Draft — ĐC-36]
    H --> H1{>= 1 action hợp lệ?}
    H1 -- Không --> D
    H1 -- Có --> H2[POST /tests]
    H2 --> I[/editor/ — Publish ĐC-37/]
    I --> I1[validateForPublish]
    I1 --> I2{OK?}
    I2 -- Không --> I3[Hiển thị lỗi]
    I3 --> I
    I2 -- Có --> I4[Published]
    I4 --> J([Kết thúc])
```

---

## STT 11 — Chạy test suite (ĐC-38)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[/suite-runs/]
    B --> C[Nhập suiteId]
    C --> D[POST /suites/:id/runs]
    D --> E[Tạo SuiteRun]
    E --> F{Còn test case trong suite?}
    F -- Không --> K[Cập nhật passed/failed]
    F -- Có --> G[Chạy từng step Playwright]
    G --> H{Pass?}
    H -- Có --> I[Bước tiếp]
    I --> G
    H -- Không --> J[Screenshot, đánh dấu fail]
    J --> F
    K --> L[Hiển thị JSON kết quả]
    L --> M([Kết thúc])
```

---

## STT 12 — Quản trị người dùng (ĐC-39 → ĐC-42)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B{ADMIN?}
    B -- Không --> C[Redirect]
    B -- Có --> D[/admin/users/]
    D --> E[GET users — ĐC-39]
    E --> F{Thao tác?}

    F --> G[Tạo — ĐC-40]
    G --> G1{Email trùng?}
    G1 -- Có --> G
    G1 -- Không --> E

    F --> H[Sửa — ĐC-41]
    H --> H1{Admin cuối / email trùng?}
    H1 -- Lỗi --> H
    H1 -- OK --> E

    F --> I[Xóa — ĐC-42]
    I --> I1{Xóa self / admin cuối / còn project/script/run?}
    I1 -- Vi phạm --> I2[400]
    I2 --> E
    I1 -- OK --> I3[DELETE]
    I3 --> E

    F --> J([Kết thúc])
    C --> J
```

---

## So sánh với bản tách 42 sơ đồ

| | Bản tách (`12`, `13`) | Bản gộp (`14`, `15`) |
|---|----------------------|----------------------|
| Sequence | 42 | **12** |
| Activity | 42 | **12** |
| Phù hợp | Phụ lục chi tiết | **Chương thiết kế chính** |

Khuyến nghị đồ án: dùng **file 14 & 15** trong báo cáo; giữ file 12 & 13 làm phụ lục nếu cần.
