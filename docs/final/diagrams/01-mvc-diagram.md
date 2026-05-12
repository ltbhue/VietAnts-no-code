# Sơ đồ MVC (Hình minh họa)

```mermaid
flowchart LR
    U[Người dùng] --> V[View - Next.js]
    V --> C[Controller/Route - Express]
    C --> M[Model - Prisma/PostgreSQL]
    M --> C
    C --> V
```

