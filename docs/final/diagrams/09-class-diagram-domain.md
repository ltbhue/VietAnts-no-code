# Sơ đồ lớp — miền dữ liệu (Class Diagram)

Sơ đồ phản ánh các thực thể miền và quan hệ chính (theo `schema.prisma`), dùng cho báo cáo / luận văn.

```mermaid
classDiagram
    direction LR

    class User {
        +String id
        +String email
        +String password
        +String fullName
        +Role role
    }

    class Workspace {
        +String id
        +String name
    }

    class Project {
        +String id
        +String name
        +String description
        +String ownerId
        +String workspaceId
    }

    class ProjectMember {
        +String id
        +String projectId
        +String userId
    }

    class TestScript {
        +String id
        +String name
        +String projectId
        +String createdById
    }

    class TestStep {
        +String id
        +Int order
        +String keyword
        +String targetId
        +Json parameters
    }

    class UiObject {
        +String id
        +String name
        +String locator
    }

    class DataSet {
        +String id
        +String name
        +Json rows
    }

    class TestRun {
        +String id
        +DateTime startedAt
        +DateTime finishedAt
        +String status
        +String browser
        +String dataSetId
    }

    class TestResult {
        +String id
        +Int stepOrder
        +String status
        +String screenshot
    }

    class TestCase {
        +String id
        +String title
    }

    class TestCaseVersion {
        +String id
        +Int version
        +Json content
    }

    class TestSuite {
        +String id
        +String name
    }

    class TestSuiteItem {
        +String id
        +Int sortOrder
    }

    class SuiteRun {
        +String id
        +String status
        +String trigger
        +String buildId
        +String commitSha
    }

    User "1" --> "*" Project : owns
    Workspace "1" --> "*" Project : contains
    Project "1" --> "*" ProjectMember : members
    User "1" --> "*" ProjectMember : memberships
    ProjectMember "*" --> "1" Project
    ProjectMember "*" --> "1" User

    Project "1" --> "*" TestScript : has
    User "1" --> "*" TestScript : createdBy
    TestScript "1" --> "*" TestStep : steps
    UiObject "1" --> "*" TestStep : target
    Project "1" --> "*" UiObject : has
    Project "1" --> "*" DataSet : has

    User "1" --> "*" TestRun : runs
    TestScript "1" --> "*" TestRun : runs
    DataSet "1" --> "*" TestRun : optional
    TestRun "1" --> "*" TestResult : results

    Project "1" --> "*" TestCase : has
    TestCase "1" --> "*" TestCaseVersion : versions
    Project "1" --> "*" TestSuite : has
    TestSuite "*" --> "*" TestCaseVersion : TestSuiteItem
    TestSuite "1" --> "*" SuiteRun : runs
```

**Ghi chú:** Quan hệ `ProjectMember` (nhiều–nhiều User–Project) được thể hiện gọn bằng liên kết `via`; chi tiết ràng buộc khóa ngoại xem ERD.
