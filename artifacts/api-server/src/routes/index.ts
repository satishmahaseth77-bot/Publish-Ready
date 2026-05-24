import { Router, type IRouter } from "express";
import healthRouter from "./health";
import youtubeRouter from "./youtube";
import emailRouter from "./email";

const router: IRouter = Router();

router.use(healthRouter);
router.use(youtubeRouter);
router.use(emailRouter);

export default router;
