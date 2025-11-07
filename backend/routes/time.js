import express from "express";
import { getTodayTime } from "../controllers/timeController.js";

const router = express.Router();

router.get("/today", getTodayTime);

export default router;
