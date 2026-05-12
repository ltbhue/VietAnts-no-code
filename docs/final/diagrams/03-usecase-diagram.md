# Sơ đồ Use Case (Hình minh họa)

```mermaid
usecaseDiagram
    left to right direction

    actor "ADMIN" as ADMIN
    actor "TESTER" as TESTER
    actor "VIEWER" as VIEWER
    actor "CI Pipeline" as CI

    package "Hệ thống kiểm thử không mã" {
        usecase "Đăng nhập" as UC1
        usecase "Quản lý script kiểm thử" as UC2
        usecase "Quản lý Object Repository" as UC3
        usecase "Quản lý DataSet" as UC4
        usecase "Chạy test script" as UC5
        usecase "Xem báo cáo / PDF" as UC6
        usecase "Quản lý suite và chạy suite" as UC7
        usecase "Trigger suite từ CI" as UC8
        usecase "Quản lý user và phân quyền" as UC9
    }

    ADMIN --> UC1
    ADMIN --> UC9
    ADMIN --> UC6

    TESTER --> UC1
    TESTER --> UC2
    TESTER --> UC3
    TESTER --> UC4
    TESTER --> UC5
    TESTER --> UC6
    TESTER --> UC7

    VIEWER --> UC1
    VIEWER --> UC6

    CI --> UC8
```
