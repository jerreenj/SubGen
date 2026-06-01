import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import segmentsRouter from "./segments";
import transcribeRouter from "./transcribe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(segmentsRouter);
router.use(transcribeRouter);

export default router;
