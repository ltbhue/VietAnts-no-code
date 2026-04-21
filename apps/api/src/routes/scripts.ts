import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";

const scriptSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
});

const keywordSchema = z.enum(["navigate", "click", "fill", "assertText"]);

const stepSchema = z.object({
  id: z.string().cuid().optional(),
  order: z.number().int().nonnegative(),
  keyword: keywordSchema,
  targetId: z.string().cuid().nullable().optional(),
  parameters: z.any().optional(),
});

export default function scriptsRouter(prisma: PrismaClient) {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", async (req, res) => {
    const scripts = await prisma.testScript.findMany({
      where: { createdById: req.user!.id },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(scripts);
  });

  router.post("/", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = scriptSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const { projectId, name, description } = parse.data;

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
    });
    if (!project) return res.status(403).json({ error: "Không có quyền truy cập project" });

    const script = await prisma.testScript.create({
      data: {
        name,
        description,
        projectId,
        createdById: req.user!.id,
      },
    });
    res.status(201).json(script);
  });

  router.get("/:id", async (req, res) => {
    const script = await prisma.testScript.findFirst({
      where: { id: req.params.id as any, createdById: req.user!.id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!script) return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    res.json(script);
  });

  router.put("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parseMeta = scriptSchema.partial().safeParse(req.body);
    if (!parseMeta.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parseMeta.error.flatten() });
    }
    const updated = await prisma.testScript.updateMany({
      where: { id: req.params.id as any, createdById: req.user!.id },
      data: parseMeta.data,
    });
    if (updated.count === 0) return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    const script = await prisma.testScript.findUnique({ where: { id: req.params.id as any } });
    res.json(script);
  });

  router.put("/:id/steps", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const stepsParse = z.array(stepSchema).safeParse(req.body.steps);
    if (!stepsParse.success) {
      return res.status(400).json({ error: "Danh sách bước test không hợp lệ", details: stepsParse.error.flatten() });
    }

    // Validate required parameters so executor can run reliably.
    const normalizeParams = (p: unknown) => {
      if (!p) return null;
      if (typeof p === "string") {
        try {
          return JSON.parse(p) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
      if (typeof p === "object") return p as Record<string, unknown>;
      return null;
    };

    const validationErrors: string[] = [];
    for (const st of stepsParse.data) {
      const p = normalizeParams(st.parameters);
      const kw = st.keyword;

      if (kw === "navigate") {
        const url = p?.url;
        if (typeof url !== "string" || !url.trim()) {
          validationErrors.push(`Step ${st.order}: navigate requires parameters.url`);
        }
      }

      if (kw === "click") {
        const selector = p?.selector;
        if (typeof selector !== "string" || !selector.trim()) {
          validationErrors.push(`Step ${st.order}: click requires parameters.selector`);
        }
      }

      if (kw === "fill") {
        const selector = p?.selector;
        const value = p?.value;
        const dataKey = p?.dataKey;
        if (typeof selector !== "string" || !selector.trim()) {
          validationErrors.push(`Step ${st.order}: fill requires parameters.selector`);
        }
        const hasValue = typeof value === "string" && !!value.trim();
        const hasDataKey = typeof dataKey === "string" && !!dataKey.trim();
        if (!hasValue && !hasDataKey) {
          validationErrors.push(`Step ${st.order}: fill requires parameters.value or parameters.dataKey`);
        }
      }

      if (kw === "assertText") {
        const selector = p?.selector;
        const expected = p?.expected;
        const dataKey = p?.dataKey;
        if (typeof selector !== "string" || !selector.trim()) {
          validationErrors.push(`Step ${st.order}: assertText requires parameters.selector`);
        }
        const hasExpected = typeof expected === "string" && !!expected.trim();
        const hasDataKey = typeof dataKey === "string" && !!dataKey.trim();
        if (!hasExpected && !hasDataKey) {
          validationErrors.push(`Step ${st.order}: assertText requires parameters.expected or parameters.dataKey`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Danh sách bước test không hợp lệ",
        details: { errors: validationErrors },
      });
    }
    const script = await prisma.testScript.findFirst({
      where: { id: req.params.id as any, createdById: req.user!.id },
    });
    if (!script) return res.status(404).json({ error: "Không tìm thấy dữ liệu" });

    await prisma.$transaction(async (tx: any) => {
      await tx.testStep.deleteMany({ where: { scriptId: script.id } });
      for (const s of stepsParse.data) {
        await tx.testStep.create({
          data: {
            order: s.order,
            keyword: s.keyword,
            targetId: s.targetId ?? null,
            parameters: s.parameters as any,
            scriptId: script.id,
          },
        });
      }
    });

    const withSteps = await prisma.testScript.findUnique({
      where: { id: script.id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    res.json(withSteps);
  });

  router.delete("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    await prisma.testScript.deleteMany({
      where: { id: req.params.id as any, createdById: req.user!.id },
    });
    res.status(204).end();
  });

  return router;
}

