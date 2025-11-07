import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import employeesRouter from "./routes/employees.js";
import timeRouter from "./routes/time.js";
import aiRouter from "./routes/ai.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

app.use("/api/employees", employeesRouter);
app.use("/api/time", timeRouter);
app.use("/api/ai", aiRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));