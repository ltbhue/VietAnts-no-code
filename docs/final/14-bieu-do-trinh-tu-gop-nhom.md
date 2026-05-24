# Biểu đồ trình tự (gộp nhóm) — Giao diện web

Các use case **gần nhau** được gộp vào **một biểu đồ trình tự**. Tham chiếu đặc tả: `11-dac-ta-chuc-nang-giao-dien-web.md`.

| STT | Nhóm | Mã use case gộp | Số UC |
|-----|------|-----------------|-------|
| 1 | Trang chủ | ĐC-01 | 1 |
| 2 | Xác thực & tài khoản | ĐC-02 → ĐC-07 | 6 |
| 3 | Dashboard | ĐC-08 | 1 |
| 4 | Quản lý dự án | ĐC-09 → ĐC-12 | 4 |
| 5 | Quản lý kịch bản | ĐC-13 → ĐC-18 | 6 |
| 6 | Thực thi kịch bản | ĐC-19 | 1 |
| 7 | Đối tượng UI | ĐC-20 → ĐC-23 | 4 |
| 8 | Bộ dữ liệu | ĐC-24 → ĐC-27 | 4 |
| 9 | Báo cáo | ĐC-28 → ĐC-32 | 5 |
| 10 | Ghi thao tác & publish | ĐC-33 → ĐC-37 | 5 |
| 11 | Chạy suite | ĐC-38 | 1 |
| 12 | Quản trị người dùng | ĐC-39 → ĐC-42 | 4 |

**Tổng: 12 biểu đồ trình tự** (thay cho 42 biểu đồ tách riêng).

---

## STT 1 — Trang chủ (ĐC-01)

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant W as Frontend

    U->>W: GET /
    W-->>U: Trang giới thiệu VietAnts Testing
    U->>W: Nhấn Đăng nhập
    W-->>U: Redirect /login
```

---

## STT 2 — Xác thực & quản lý tài khoản (ĐC-02 → ĐC-07)

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant W as Frontend
    participant A as API Auth
    participant DB as PostgreSQL

  rect rgb(240,248,255)
    Note over U,DB: Đăng nhập (ĐC-02)
    U->>W: POST /login — email, password
    W->>A: POST /auth/login
    A->>DB: find user, bcrypt.compare
    alt Thành công
        A-->>W: JWT + user
        W->>W: localStorage
        W-->>U: /dashboard
    else Sai / khóa 5 lần
        A-->>W: 401 / 429
    end
  end

  rect rgb(255,250,240)
    Note over U,DB: Đăng ký (ĐC-03)
    U->>W: POST /register
    W->>A: POST /auth/register
    A->>DB: create User (TESTER/VIEWER)
    A-->>W: 201 → /login
  end

  rect rgb(245,255,245)
    Note over U,DB: Quên & đặt lại MK (ĐC-04, ĐC-05)
    U->>A: POST /auth/forgot-password
    A-->>U: resetToken (MVP)
    U->>A: POST /auth/reset-password
    A->>DB: update password
  end

  rect rgb(255,245,250)
    Note over U,DB: Đổi MK & đăng xuất (ĐC-06, ĐC-07)
    U->>A: POST /auth/change-password + JWT
    A->>DB: update password
    U->>W: Đăng xuất
    W->>W: xóa localStorage → /login
  end
```

---

## STT 3 — Dashboard & thống kê (ĐC-08)

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant W as Frontend
    participant A as API
    participant DB as PostgreSQL

    U->>W: Mở /dashboard
    W->>A: GET /projects
    A->>DB: projects accessible
    A-->>W: projects[]
    W->>A: GET /runs
    A-->>W: runs[]
    W->>A: GET /projects/:id/suites
    A-->>W: suites[]
    U->>W: Chọn project, 7/30 ngày, suite (optional)
    W->>A: GET /runs/analytics?days&projectId&suiteId
    A->>DB: aggregate
    A-->>W: passRate, timeSeries, commonErrors
    W-->>U: Biểu đồ & thẻ KPI
```

---

## STT 4 — Quản lý dự án CRUD (ĐC-09 → ĐC-12)

```mermaid
sequenceDiagram
    actor A as Admin
    participant W as Frontend /projects
    participant API as API /projects
    participant DB as PostgreSQL

    A->>W: Mở /projects
    W->>API: GET /projects
    API->>DB: findMany + members
    API-->>W: Danh sách (ĐC-09)

    alt Tạo dự án (ĐC-10)
        A->>API: POST /projects {name, memberIds}
        API->>DB: create Project + ProjectMember
        API-->>W: 201
    else Cập nhật (ĐC-11)
        A->>API: PUT /projects/:id
        API->>DB: update + sync members
        API-->>W: 200
    else Xóa (ĐC-12)
        A->>API: DELETE /projects/:id
        API->>DB: delete
        API-->>W: 204
    end
    W-->>A: Refresh bảng dự án
```

---

## STT 5 — Quản lý kịch bản kiểm thử (ĐC-13 → ĐC-18)

```mermaid
sequenceDiagram
    actor U as Admin/Tester/Viewer
    participant W as Frontend
    participant API as API /scripts
    participant DB as PostgreSQL

    U->>W: /scripts — chọn project
    W->>API: GET /scripts?projectId
    API-->>W: Danh sách (ĐC-13)

    opt Tạo / xóa (ĐC-14, ĐC-15) — chỉ Admin/Tester
        alt POST tạo mới
            U->>API: POST /scripts
            API->>DB: create TestScript
        else DELETE
            U->>API: DELETE /scripts/:id
        end
    end

    U->>W: Mở /scripts/:id
    W->>API: GET /scripts/:id
    W->>API: GET /datasets, /objects
    API-->>W: script + steps + assets (ĐC-16)

    loop Biên tập bước local (ĐC-17)
        U->>W: Thêm/sửa/xóa/sắp xếp step
        W->>W: steps[], dirty=true
    end

    U->>API: PUT /scripts/:id/steps
    API->>API: Validate keyword
    API->>DB: transaction replace steps
    API-->>W: OK, dirty=false (ĐC-18)
```

---

## STT 6 — Thực thi kịch bản (ĐC-19)

```mermaid
sequenceDiagram
    actor U as Admin/Tester
    participant W as Frontend
    participant API as API /runs
    participant EX as Executor
    participant PW as Playwright
    participant DB as PostgreSQL
    participant L as Linear (optional)

    U->>W: Chọn browser, dataset, Chạy
    W->>API: POST /runs {scriptId, dataSetId, browser}
    API->>EX: executeScriptRun()
    EX->>DB: create TestRun
    EX->>PW: launch + newPage
    loop Mỗi row DataSet
        loop Mỗi TestStep
            EX->>PW: navigate/click/fill/assertText
            alt Pass
                EX->>DB: TestResult passed
            else Fail
                EX->>PW: screenshot
                EX->>DB: TestResult failed
                EX->>L: create issue (nếu cấu hình)
            end
        end
    end
    EX->>DB: update TestRun status
    API-->>W: run + results
    W-->>U: Timeline kết quả từng bước
```

---

## STT 7 — Quản lý đối tượng UI CRUD (ĐC-20 → ĐC-23)

```mermaid
sequenceDiagram
    actor U as User
    participant W as Frontend /objects
    participant API as API /objects
    participant DB as PostgreSQL

    U->>W: Chọn project
    W->>API: GET /objects?projectId
    API-->>W: Danh sách (ĐC-20)

    alt Thêm (ĐC-21) — Admin/Tester
        U->>API: POST /objects
        API->>DB: create UiObject
    else Sửa (ĐC-22)
        U->>API: PUT /objects/:id
        API->>DB: update
    else Xóa (ĐC-23)
        U->>API: DELETE /objects/:id
        API->>DB: delete
    end
    API-->>W: Response
    W-->>U: Cập nhật bảng
```

---

## STT 8 — Quản lý bộ dữ liệu CRUD (ĐC-24 → ĐC-27)

```mermaid
sequenceDiagram
    actor U as User
    participant W as Frontend /datasets
    participant API as API /datasets
    participant DB as PostgreSQL

    W->>API: GET /datasets?projectId
    API-->>W: Danh sách (ĐC-24)

    alt Tạo (ĐC-25)
        U->>API: POST /datasets {rows[]}
        API->>DB: create DataSet
    else Cập nhật (ĐC-26)
        U->>API: PUT /datasets/:id
    else Xóa (ĐC-27)
        U->>API: DELETE /datasets/:id
    end
    API-->>W: JSON
    W-->>U: Refresh UI
```

---

## STT 9 — Báo cáo & xuất PDF (ĐC-28 → ĐC-32)

```mermaid
sequenceDiagram
    actor U as User
    participant W as Frontend
    participant API as API
    participant PDF as reportPdf
    participant DB as PostgreSQL

    U->>W: Mở /reports
    W->>API: GET /runs
    API-->>W: runs[] + thống kê (ĐC-28)

    U->>W: Lọc status, scriptId
    W->>API: GET /runs?status&scriptId
    API-->>W: runs đã lọc (ĐC-29)

    U->>W: Chi tiết run
    W->>API: GET /runs/:id/results
    API-->>W: results + screenshots (ĐC-30)

    U->>W: Tải PDF
    W->>API: GET /runs/:id/report.pdf + Bearer
    API->>PDF: generateRunPdf
    PDF-->>W: application/pdf
    W-->>U: Download (ĐC-31)

    opt Suite run MVP (ĐC-32)
        U->>API: GET /suites/:suiteId/runs/:runId
        API-->>W: JSON suite run
    end
```

---

## STT 10 — Ghi thao tác, test case & publish (ĐC-33 → ĐC-37)

```mermaid
sequenceDiagram
    actor U as Admin/Tester
    participant W as Frontend
    participant API as API /projects/:id/tests
    participant DOM as Domain validation
    participant DB as PostgreSQL

    rect rgb(240,255,240)
        Note over U,W: Recorder — local (ĐC-33, ĐC-34)
        U->>W: Thêm thao tác / Import Playwright script
        W->>W: parse → actions[]
    end

    U->>API: POST .../smart-record
    API-->>W: smartSteps, suggestions (ĐC-35)

    U->>API: POST .../tests {steps, platform}
    API->>DB: TestCase + Version Draft (ĐC-36)

    U->>W: /editor — Publish
    W->>API: POST .../tests/:id/publish
    API->>DOM: validateForPublish
  alt OK
        API->>DB: lifecycle = Published
        API-->>W: 200 (ĐC-37)
    else Lỗi
        API-->>W: 400 errors[]
    end
```

---

## STT 11 — Chạy test suite (ĐC-38)

```mermaid
sequenceDiagram
    actor U as Admin/Tester
    participant W as Frontend /suite-runs
    participant API as API /suites
    participant SR as Suite Runner
    participant PW as Playwright
    participant DB as PostgreSQL

    U->>W: Nhập suiteId, Chạy suite
    W->>API: POST /suites/:suiteId/runs
    API->>DB: SuiteRun running, trigger=ui
    API->>SR: executeSuiteRun()
    loop Mỗi TestSuiteItem
        SR->>PW: newPage, runSuiteStep
        SR->>SR: stepLog pass/fail
    end
    SR->>DB: update SuiteRun + results JSON
    API-->>W: 202 {runId, status}
    W-->>U: Hiển thị kết quả
```

---

## STT 12 — Quản trị người dùng (ĐC-39 → ĐC-42)

```mermaid
sequenceDiagram
    actor A as Admin
    participant W as Frontend /admin/users
    participant API as API /auth/admin
    participant DB as PostgreSQL

    A->>W: Mở /admin/users
    W->>API: GET /auth/admin/users
    API-->>W: users[] (ĐC-39)

    alt Tạo (ĐC-40)
        A->>API: POST /auth/admin/create-user
        API->>DB: User + optional ProjectMember
    else Sửa (ĐC-41)
        A->>API: PUT /auth/admin/users/:id
        API->>DB: update (check admin duy nhất)
    else Xóa (ĐC-42)
        A->>API: DELETE /auth/admin/users/:id
        API->>API: Kiểm tra ràng buộc owner/script/runs
        API->>DB: delete User
    end
    API-->>W: Response
    W-->>A: Refresh + search
```

---

## Ghi chú sử dụng trong đồ án

- Mỗi **Hình 3.x** = một nhóm STT ở trên.
- Trong phần mô tả, liệt kê: *“Biểu đồ gộp các use case ĐC-02 đến ĐC-07…”*.
- Chi tiết từng bước vẫn tham chiếu **Bảng đặc tả** trong file `11-dac-ta-chuc-nang-giao-dien-web.md`.
