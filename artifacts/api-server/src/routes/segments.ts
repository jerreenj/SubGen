import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, segmentsTable } from "@workspace/db";
import {
  CreateSegmentParams,
  CreateSegmentBody,
  ReplaceSegmentsParams,
  ReplaceSegmentsBody,
  UpdateSegmentParams,
  UpdateSegmentBody,
  DeleteSegmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/projects/:id/segments", async (req, res): Promise<void> => {
  const params = CreateSegmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateSegmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [segment] = await db
    .insert(segmentsTable)
    .values({
      projectId: params.data.id,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      text: parsed.data.text,
      order: parsed.data.order,
    })
    .returning();

  res.status(201).json(segment);
});

router.put("/projects/:id/segments/batch", async (req, res): Promise<void> => {
  const params = ReplaceSegmentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ReplaceSegmentsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.delete(segmentsTable).where(eq(segmentsTable.projectId, params.data.id));

  if (parsed.data.segments.length === 0) {
    res.json([]);
    return;
  }

  const newSegments = await db
    .insert(segmentsTable)
    .values(
      parsed.data.segments.map((seg) => ({
        projectId: params.data.id,
        startTime: seg.startTime,
        endTime: seg.endTime,
        text: seg.text,
        order: seg.order,
      }))
    )
    .returning();

  res.json(newSegments);
});

router.patch("/segments/:id", async (req, res): Promise<void> => {
  const params = UpdateSegmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSegmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.startTime !== undefined) updateData.startTime = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) updateData.endTime = parsed.data.endTime;
  if (parsed.data.text !== undefined) updateData.text = parsed.data.text;
  if (parsed.data.order !== undefined) updateData.order = parsed.data.order;

  const [segment] = await db
    .update(segmentsTable)
    .set(updateData)
    .where(eq(segmentsTable.id, params.data.id))
    .returning();

  if (!segment) {
    res.status(404).json({ error: "Segment not found" });
    return;
  }

  res.json(segment);
});

router.delete("/segments/:id", async (req, res): Promise<void> => {
  const params = DeleteSegmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [segment] = await db
    .delete(segmentsTable)
    .where(eq(segmentsTable.id, params.data.id))
    .returning();

  if (!segment) {
    res.status(404).json({ error: "Segment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
