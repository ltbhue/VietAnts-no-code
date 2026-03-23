import axios from "axios";

interface LinearFailurePayload {
  scriptName: string;
  runId: string;
  stepOrder: number;
  errorMessage: string;
}

export async function createLinearIssueOnFailure(payload: LinearFailurePayload) {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;

  if (!apiKey || !teamId) {
    // Chưa cấu hình Linear, bỏ qua để không ảnh hưởng luồng chính
    return;
  }

  const title = `[Test Fail] ${payload.scriptName} – step ${payload.stepOrder}`;
  const descriptionLines = [
    `Test run failed in automated no-code testing system.`,
    ``,
    `- Script: ${payload.scriptName}`,
    `- Run ID: ${payload.runId}`,
    `- Step order: ${payload.stepOrder}`,
    `- Error: ${payload.errorMessage}`,
  ];

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  try {
    await axios.post(
      "https://api.linear.app/graphql",
      {
        query: mutation,
        variables: {
          input: {
            teamId,
            title,
            description: descriptionLines.join("\n"),
          },
        },
      },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    // Không throw để tránh làm fail test run
    console.error("Failed to create Linear issue", err);
  }
}

