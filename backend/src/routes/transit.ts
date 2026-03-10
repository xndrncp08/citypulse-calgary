import { Router } from "express";
import { getRoutes, getStops, getPerformance } from "../controllers/transitController";

const router = Router();

router.get("/routes", getRoutes);
router.get("/stops", getStops);
router.get("/performance", getPerformance);

export default router;
