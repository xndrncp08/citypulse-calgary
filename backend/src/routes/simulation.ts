import { Router } from "express";
import { run } from "../controllers/simulationController";

const router = Router();

router.post("/run", run);

export default router;
