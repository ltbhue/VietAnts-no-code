# ERD — Quan hệ thực thể (Hình minh họa)

Theo schema PostgreSQL (Prisma). Tên quan hệ mang tính mô tả.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ PROJECT_MEMBER : joins
    USER ||--o{ TEST_SCRIPT : creates
    USER ||--o{ TEST_RUN : triggers

    WORKSPACE ||--o{ PROJECT : contains

    PROJECT ||--o{ PROJECT_MEMBER : has_member
    PROJECT }o--|| USER : owner

    PROJECT ||--o{ TEST_SCRIPT : has
    PROJECT ||--o{ UI_OBJECT : has
    PROJECT ||--o{ DATASET : has
    PROJECT ||--o{ TEST_CASE : has
    PROJECT ||--o{ TEST_SUITE : has

    PROJECT_MEMBER }o--|| PROJECT : project
    PROJECT_MEMBER }o--|| USER : user

    TEST_SCRIPT ||--o{ TEST_STEP : steps
    TEST_SCRIPT ||--o{ TEST_RUN : runs

    TEST_STEP }o--o| UI_OBJECT : targets

    TEST_RUN ||--o{ TEST_RESULT : contains
    TEST_RUN }o--|| TEST_SCRIPT : script
    TEST_RUN }o--|| USER : user
    TEST_RUN }o--o| DATASET : data

    TEST_CASE ||--o{ TEST_CASE_VERSION : versions

    TEST_SUITE ||--o{ TEST_SUITE_ITEM : items
    TEST_SUITE ||--o{ SUITE_RUN : runs

    TEST_SUITE_ITEM }o--|| TEST_SUITE : suite
    TEST_SUITE_ITEM }o--|| TEST_CASE_VERSION : version
```

**Thu gọn:** Có thể xuất bản chỉ nhóm `USER–PROJECT–TEST_SCRIPT–TEST_STEP–TEST_RUN–TEST_RESULT` cho phần “chạy script”; nhóm `TEST_CASE–TEST_SUITE–SUITE_RUN` cho phần suite/CI.
