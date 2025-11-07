import express from "express";
import { getTelemetry, postTelemetry } from "../controllers/aiController.js";

const router = express.Router();

router.get("/telemetry", getTelemetry);
router.post("/telemetry", postTelemetry);

export default router;

