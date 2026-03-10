import { Router } from "express";
import {
  getIncidents,
  getHeatmap,
  getHistory,
} from "../controllers/trafficController";

const router = Router();

router.get("/incidents", getIncidents);
router.get("/heatmap", getHeatmap);
router.get("/history", getHistory);

export default router;
