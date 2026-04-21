import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";
import { parseStep, validateForPublish } from "@vietants/domain";

const createRecordedTestSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(["desktop-web", "mobile-web"]).optional(),
  steps: z.array(z.unknown()).min(1),
});
const smartRecordSchema = z.object({
  url: z.string().url(),
  actions: z
    .array(
      z.object({
        type: z.enum(["navigate", "click", "fill", "assertText"]),
        selector: z.string().optional(),
        value: z.string().optional(),
        expected: z.string().optional(),
      }),
    )
    .min(1),
});

export default function testsRouter(prisma: PrismaClient) {
  const router = Router();

  router.use(authMiddleware);

  router.get("/:projectId/tests", async (req, res) => {
    const projectId = req.params.projectId as string;
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const cases = await prisma.testCase.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    res.json(cases);
  });

  router.post("/:projectId/tests", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parsed = createRecordedTestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const projectId = req.params.projectId as string;
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    let validatedSteps: ReturnType<typeof parseStep>[];
    try {
      validatedSteps = parsed.data.steps.map((s) => parseStep(s));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid step";
      return res.status(400).json({ error: message });
    }

    const content = {
      lifecycle: "Draft" as const,
      platform: parsed.data.platform ?? "desktop-web",
      steps: validatedSteps,
    };

    const created = await prisma.testCase.create({
      data: {
        title: parsed.data.name,
        projectId,
        versions: {
          create: {
            version: 1,
            content,
          },
        },
      },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    const v = created.versions[0];
    if (!v) {
      return res.status(500).json({ error: "Version not created" });
    }

    const lifecycle = (v.content as { lifecycle?: string }).lifecycle ?? "Draft";

    return res.status(201).json({
      id: created.id,
      lifecycle,
      version: v.version,
      name: created.title,
    });
  });

  router.post("/:projectId/tests/smart-record", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parsed = smartRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const projectId = req.params.projectId as string;
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const suggestions: string[] = [];
    const smartSteps = parsed.data.actions.map((action, index) => {
      let selectorScore = 0;
      if (action.selector) {
        if (action.selector.includes("data-test")) selectorScore = 95;
        else if (action.selector.includes("#")) selectorScore = 80;
        else selectorScore = 55;
      }

      if (action.type === "click" && action.selector && selectorScore < 70) {
        suggestions.push(`Step ${index + 1}: selector may be flaky, prefer data-test attribute.`);
      }
      if (action.type === "fill" && !action.value) {
        suggestions.push(`Step ${index + 1}: fill action has no value.`);
      }

      if (action.type === "click") {
        return { kind: "recorded.click", selector: action.selector ?? "body", meta: { selectorScore } };
      }
      if (action.type === "fill") {
        return {
          kind: "keyword.fill",
          selector: action.selector ?? "input",
          value: action.value ?? "",
          meta: { selectorScore },
        };
      }
      if (action.type === "assertText") {
        return {
          kind: "keyword.assertText",
          selector: action.selector ?? "body",
          expected: action.expected ?? "",
          meta: { selectorScore },
        };
      }
      return { kind: "keyword.navigate", url: parsed.data.url, meta: { selectorScore: 100 } };
    });

    if (!smartSteps.some((s) => s.kind === "keyword.assertText")) {
      suggestions.push("Suggestion: add an assertText step after critical actions.");
    }

    return res.json({
      ok: true,
      url: parsed.data.url,
      smartSteps,
      suggestions,
    });
  });

  router.post(
    "/:projectId/tests/:testCaseId/publish",
    requireRole(["ADMIN", "TESTER"]),
    async (req, res) => {
      const projectId = req.params.projectId as string;
      const testCaseId = req.params.testCaseId as string;

      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: req.user!.id },
      });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const tc = await prisma.testCase.findFirst({
        where: { id: testCaseId, projectId },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      if (!tc) {
        return res.status(404).json({ error: "Test case not found" });
      }

      const latest = tc.versions[0];
      if (!latest) {
        return res.status(404).json({ error: "No version" });
      }

      const raw = latest.content as Record<string, unknown>;
      const validation = validateForPublish({
        steps: raw.steps as unknown[],
        lifecycle: raw.lifecycle as string | undefined,
        platform: raw.platform as string | undefined,
      });
      if (!validation.ok) {
        return res.status(400).json({ error: "Validation failed", errors: validation.errors });
      }

      const nextContent = { ...raw, lifecycle: "Published" };

      await prisma.testCaseVersion.update({
        where: { id: latest.id },
        data: { content: nextContent },
      });

      return res.json({
        ok: true,
        lifecycle: "Published",
        version: latest.version,
        testCaseId: tc.id,
      });
    },
  );

  return router;
}
