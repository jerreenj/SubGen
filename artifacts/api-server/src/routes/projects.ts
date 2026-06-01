import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, projectsTable, segmentsTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectParams,
  UpdateProjectBody,
  GetProjectParams,
  DeleteProjectParams,
  ExportProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt));
  res.json(projects);
});

router.get("/projects/stats", async (req, res): Promise<void> => {
  const [projectCount] = await db.select({ count: count() }).from(projectsTable);
  const [segmentCount] = await db.select({ count: count() }).from(segmentsTable);
  const recentProjects = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt)).limit(5);

  res.json({
    totalProjects: projectCount?.count ?? 0,
    totalSegments: segmentCount?.count ?? 0,
    recentProjects,
  });
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description } = parsed.data;
  const [project] = await db
    .insert(projectsTable)
    .values({
      name,
      description: description ?? null,
    })
    .returning();

  const segments = await db
    .select()
    .from(segmentsTable)
    .where(eq(segmentsTable.projectId, project!.id))
    .orderBy(segmentsTable.order);

  res.status(201).json({ ...project, segments });
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const segments = await db
    .select()
    .from(segmentsTable)
    .where(eq(segmentsTable.projectId, project.id))
    .orderBy(segmentsTable.order);

  res.json({ ...project, segments });
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.style !== undefined) updateData.style = parsed.data.style;

  const [project] = await db
    .update(projectsTable)
    .set(updateData)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const segments = await db
    .select()
    .from(segmentsTable)
    .where(eq(segmentsTable.projectId, project.id))
    .orderBy(segmentsTable.order);

  res.json({ ...project, segments });
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/projects/:id/export", async (req, res): Promise<void> => {
  const params = ExportProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const format = (req.query.format as string) || "srt";

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const segments = await db
    .select()
    .from(segmentsTable)
    .where(eq(segmentsTable.projectId, project.id))
    .orderBy(segmentsTable.order);

  let content = "";
  const filename = `${project.name.replace(/[^a-z0-9]/gi, "_")}.${format}`;

  if (format === "srt") {
    content = segments
      .map((seg, idx) => {
        const start = formatSrtTime(seg.startTime);
        const end = formatSrtTime(seg.endTime);
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join("\n");
  } else if (format === "vtt") {
    content = "WEBVTT\n\n";
    content += segments
      .map((seg, idx) => {
        const start = formatVttTime(seg.startTime);
        const end = formatVttTime(seg.endTime);
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join("\n");
  } else if (format === "ass") {
    const style = project.style as Record<string, unknown>;
    const fontName = String(style?.fontFamily ?? "Inter");
    const fontSize = Number(style?.fontSize ?? 32);
    const primaryColor = hexToAssColor(String(style?.color ?? "#FFFFFF"));
    const outlineColor = "&H00000000";
    const bold = style?.fontWeight === "700" || style?.fontWeight === "bold" ? -1 : 0;
    const italic = style?.italic ? -1 : 0;

    content = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, Bold, Italic, Alignment, MarginL, MarginR, MarginV
Style: Default,${fontName},${fontSize},${primaryColor},${outlineColor},${bold},${italic},2,10,10,30

[Events]
Format: Start, End, Style, Text
`;
    content += segments
      .map((seg) => {
        const start = formatAssTime(seg.startTime);
        const end = formatAssTime(seg.endTime);
        return `Dialogue: ${start},${end},Default,${seg.text}`;
      })
      .join("\n");
  }

  res.json({ content, format, filename });
});

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

function hexToAssColor(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return "&H00FFFFFF";
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H00${b}${g}${r}`;
}

export default router;
