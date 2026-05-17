import { Router, type IRouter } from "express";
import healthRouter from "./health";
import commoditiesRouter from "./commodities";
import regionsRouter from "./regions";
import weatherRouter from "./weather";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/commodities", commoditiesRouter);
router.use("/regions", regionsRouter);
router.use("/weather", weatherRouter);
router.use("/news", newsRouter);

export default router;
