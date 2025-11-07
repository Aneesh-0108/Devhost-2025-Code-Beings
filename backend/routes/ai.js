import express from "express";
import { 
    getTelemetry, 
    postTelemetry, 
    predictBurnout, 
    balanceWorkloadController,
    optimizeWorkloadController
} from "../controllers/aiController.js";

const router = express.Router();

// Existing telemetry routes
router.get("/telemetry", getTelemetry);
router.post("/telemetry", postTelemetry);

// New AI routes
router.post("/predictBurnout", predictBurnout);
router.get("/balanceWorkload", balanceWorkloadController);
router.post("/optimize", optimizeWorkloadController);

export default router;

