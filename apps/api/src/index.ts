import dotenv from "dotenv";
import { buildServer } from "./server";

dotenv.config();

const app = buildServer();
// Render sẽ gán biến PORT cho service (FE). API chạy cổng riêng để không xung đột.
const port = process.env.API_PORT || 4000;

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});


