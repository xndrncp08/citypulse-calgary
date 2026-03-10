import { Router } from "express";
import { getWeather, getAirQuality } from "../controllers/environmentController";

const router = Router();

router.get("/weather", getWeather);
router.get("/air-quality", getAirQuality);

export default router;
