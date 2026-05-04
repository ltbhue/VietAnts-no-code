# 06. Kiến trúc & bộ sơ đồ hệ thống (cập nhật)

Tài liệu này gom toàn bộ sơ đồ quan trọng để phục vụ báo cáo tốt nghiệp và bàn giao kỹ thuật.

## 1) Sơ đồ ngữ cảnh (Context)

```mermaid
flowchart LR
  U[Người dùng<br/>ADMIN / TESTER / VIEWER] --> W[Web App<br/>Next.js]
  W --> A[API Server<br/>Express]
  A --> D[(PostgreSQL<br/>Prisma)]
  A --> P[Playwright Engine]
  A --> T[Telegram Bot API]
  A --> L[Linear API]
```

## 2) Sơ đồ container (C4-Container style)

```mermaid
flowchart TB
  subgraph Frontend
    W1[AppShell + Pages]
    W2[Script/Recorder UI]
  end

  subgraph Backend
    B1[Auth + Role Middleware]
    B2[Projects/Scripts/Datasets/Objects APIs]
    B3[Runs/Suites/Tests APIs]
    B4[Executor + Report Services]
  end

  subgraph Data
    DB[(PostgreSQL)]
  end

  W1 --> B1
  W2 --> B2
  W2 --> B3
  B2 --> DB
  B3 --> DB
  B4 --> DB
  B3 --> B4
```

## 3) Sơ đồ component backend

```mermaid
flowchart LR
  R[Routes] --> M[Middleware auth/role]
  R --> S[Services]
  S --> O[External APIs<br/>Telegram / Linear]
  R --> P[Prisma Client]
  S --> P
```

## 4) Sơ đồ use case

```mermaid
flowchart LR
  Admin((ADMIN))
  Tester((TESTER))
  Viewer((VIEWER))

  UC1[Quản lý user/role]
  UC2[Tạo project & gán thành viên]
  UC3[Tạo/Sửa kịch bản]
  UC4[Chạy test run]
  UC5[Xem báo cáo/PDF]
  UC6[Quản lý dataset/object]

  Admin --> UC1
  Admin --> UC2
  Admin --> UC3
  Admin --> UC4
  Admin --> UC5
  Admin --> UC6

  Tester --> UC3
  Tester --> UC4
  Tester --> UC5
  Tester --> UC6

  Viewer --> UC5
```

## 5) Sơ đồ hoạt động (Activity) – chạy kịch bản

```mermaid
flowchart TD
  A[User chọn Script + Dataset] --> B{Có thay đổi chưa lưu?}
  B -- Có --> C[Hiển thị cảnh báo, yêu cầu lưu]
  B -- Không --> D[POST /runs]
  D --> E[Executor mở browser]
  E --> F[Lặp qua từng step]
  F --> G{Step pass?}
  G -- Có --> H[Ghi testResult passed]
  G -- Không --> I[Ghi testResult failed + screenshot]
  I --> J[Notify Telegram + tạo Linear issue]
  H --> K{Còn step?}
  I --> K
  K -- Có --> F
  K -- Không --> L[Đóng browser + cập nhật trạng thái run]
```

## 6) Sơ đồ sequence – Login

```mermaid
sequenceDiagram
  actor U as User
  participant W as Web
  participant A as API /auth/login
  participant DB as PostgreSQL

  U->>W: Nhập email/password
  W->>A: POST /auth/login
  A->>DB: find user by email
  DB-->>A: user + password hash
  A->>A: bcrypt.compare + sign JWT
  A-->>W: token + user info
  W->>W: lưu authToken/authUser
```

## 7) Sơ đồ sequence – tạo project và gán tester/viewer

```mermaid
sequenceDiagram
  actor A0 as Admin
  participant W as Web Projects UI
  participant A as API /projects
  participant DB as PostgreSQL

  A0->>W: Nhập tên project + chọn memberIds
  W->>A: POST /projects
  A->>DB: create Project(ownerId=admin)
  A->>DB: createMany ProjectMember(userId in memberIds)
  A-->>W: project + members
```

## 8) Sơ đồ trạng thái (State) – TestRun

```mermaid
stateDiagram-v2
  [*] --> queued
  queued --> running
  running --> passed
  running --> failed
  passed --> [*]
  failed --> [*]
```

## 9) Sơ đồ trạng thái (State) – TestCase lifecycle

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Published: publish
  Published --> Draft: chỉnh sửa phiên bản mới
  Published --> [*]
  Draft --> [*]
```

## 10) ERD rút gọn (Mermaid)

```mermaid
erDiagram
  USER ||--o{ PROJECT : owns
  USER ||--o{ PROJECT_MEMBER : joins
  PROJECT ||--o{ PROJECT_MEMBER : has
  PROJECT ||--o{ TEST_SCRIPT : contains
  TEST_SCRIPT ||--o{ TEST_STEP : has
  TEST_SCRIPT ||--o{ TEST_RUN : executed_as
  TEST_RUN ||--o{ TEST_RESULT : contains
  PROJECT ||--o{ DATA_SET : has
  PROJECT ||--o{ UI_OBJECT : has
  PROJECT ||--o{ TEST_CASE : has
  TEST_CASE ||--o{ TEST_CASE_VERSION : versions
  PROJECT ||--o{ TEST_SUITE : has
  TEST_SUITE ||--o{ TEST_SUITE_ITEM : contains
  TEST_SUITE ||--o{ SUITE_RUN : executed_as
```

## 11) Sơ đồ class/domain (mức khái niệm)

```mermaid
classDiagram
  class Project {
    +id
    +name
    +description
    +ownerId
  }
  class ProjectMember {
    +projectId
    +userId
  }
  class TestScript {
    +id
    +name
    +projectId
    +createdById
  }
  class TestStep {
    +order
    +keyword
    +parameters
  }
  class TestRun {
    +status
    +startedAt
    +finishedAt
  }
  class TestResult {
    +stepOrder
    +status
    +message
    +screenshot
  }

  Project "1" --> "*" ProjectMember
  Project "1" --> "*" TestScript
  TestScript "1" --> "*" TestStep
  TestScript "1" --> "*" TestRun
  TestRun "1" --> "*" TestResult
```

## 12) Sơ đồ deployment (môi trường local/dev)

```mermaid
flowchart LR
  Browser[Browser] --> Web[Next.js dev server :3000]
  Web --> API[Express API :4000]
  API --> PG[(PostgreSQL)]
  API --> PW[Playwright browsers]
  API --> TG[Telegram API]
  API --> LI[Linear API]
```

## 13) Sơ đồ luồng dữ liệu (DFD mức 1)

```mermaid
flowchart TB
  U[User] --> P1[Quản lý project/kịch bản]
  U --> P2[Thực thi test]
  U --> P3[Xem báo cáo]
  P1 --> D1[(Project + Script + Step)]
  P2 --> D2[(Run + Result)]
  P3 --> D2
  P2 --> N1[Telegram/Linear]
```

## 14) Sơ đồ quyết định quyền truy cập project

```mermaid
flowchart TD
  A[Request với userId] --> B{project.ownerId == userId?}
  B -- Yes --> OK[Cho phép]
  B -- No --> C{project.members có userId?}
  C -- Yes --> OK
  C -- No --> DENY[Từ chối 403/404]
```

---

## Danh sách sơ đồ đã bao phủ

- Context
- Container
- Component
- Use case
- Activity
- Sequence (2 luồng)
- State (2 loại)
- ERD
- Class/domain
- Deployment
- DFD
- Access decision flow

Đây là bộ sơ đồ tổng hợp dùng trực tiếp cho báo cáo và thuyết trình.

