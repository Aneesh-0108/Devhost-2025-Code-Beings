import express from "express";
import { getEmployees, updateEmployee } from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", getEmployees);
router.post("/update", updateEmployee);

export default router;
