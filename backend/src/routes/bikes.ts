import { Router } from "express";
import { getCounters, getUsage } from "../controllers/bikeController";

const router = Router();

router.get("/counters", getCounters);
router.get("/usage", getUsage);

export default router;
