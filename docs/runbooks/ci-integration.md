# Tích hợp CI/CD (MVP)

1. Tạo secret `CI_API_TOKEN` trùng với biến môi trường trên server API.
2. Trong pipeline (sau build), gọi:

```http
POST /ci/trigger-suite
Authorization: Bearer <CI_API_TOKEN>
Content-Type: application/json

{
  "suiteId": "<id>",
  "buildId": "<build id>",
  "commitSha": "<sha>",
  "environment": "staging"
}
```

3. Phản hồi `202` kèm `runId` và `status`. Kiểm tra chi tiết qua `GET /suites/:suiteId/runs/:runId` (cần JWT người dùng) hoặc mở rộng sau cho CI callback.
