import { Router } from "express";
import { predict } from "../controllers/commuteController";

const router = Router();

router.post("/predict", predict);

export default router;
