import { Router, type IRouter } from "express";
import multer from "multer";
import OpenAI, { toFile } from "openai";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

router.post("/transcribe", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const apiKey = req.headers["x-api-key"] as string | undefined;
  const baseURL = req.headers["x-base-url"] as string | undefined;
  const model = (req.headers["x-model"] as string | undefined) || "whisper-1";

  if (!apiKey) {
    res.status(401).json({ error: "No API key provided. Set your key in Settings." });
    return;
  }

  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const language = req.body.language as string | undefined;
  req.log.info({ filename: req.file.originalname, size: req.file.size, model }, "Transcribing audio");

  const file = await toFile(req.file.buffer, req.file.originalname, {
    type: req.file.mimetype,
  });

  const transcription = await client.audio.transcriptions.create({
    model,
    file,
    response_format: "verbose_json",
    ...(language ? { language } : {}),
  });

  type VerboseSegment = { start: number; end: number; text: string };
  const rawSegments = (transcription as unknown as { segments?: VerboseSegment[] }).segments;

  let resultSegments: Array<{ startTime: number; endTime: number; text: string; order: number }>;

  if (rawSegments && rawSegments.length > 0) {
    resultSegments = rawSegments.map((seg, idx) => ({
      startTime: seg.start,
      endTime: seg.end,
      text: seg.text.trim(),
      order: idx,
    }));
  } else {
    const fullText = transcription.text ?? "";
    const words = fullText.split(" ").filter(Boolean);
    const chunkSize = 8;
    resultSegments = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      const startTime = (i / Math.max(words.length, 1)) * 60;
      const endTime = ((i + chunkSize) / Math.max(words.length, 1)) * 60;
      resultSegments.push({
        startTime,
        endTime: Math.min(endTime, 60),
        text: chunk,
        order: resultSegments.length,
      });
    }
  }

  const detectedLang = (transcription as unknown as { language?: string }).language;

  res.json({
    text: transcription.text ?? "",
    language: detectedLang ?? language ?? "en",
    segments: resultSegments,
  });
});

export default router;
