import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import employeesRouter from "./routes/employees.js";
import timeRouter from "./routes/time.js";
import aiRouter from "./routes/ai.js";
import { trainModel } from "./ai/modelTrainer.js";
import { optimizeWorkload } from "./aiScheduler.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

app.use("/api/employees", employeesRouter);
app.use("/api/time", timeRouter);
app.use("/api/ai", aiRouter);

// Initialize AI System
const initializeAI = async () => {
    try {
        console.log("🤖 Initializing AI System...");
        console.log("📊 Training burnout prediction model...");
        await trainModel();
        console.log("✅ AI System initialized successfully!");
    } catch (error) {
        console.error("❌ Error initializing AI System:", error.message);
        console.log("⚠️  Continuing without AI initialization...");
    }
};

const PORT = process.env.PORT || 5000;

// Start server and initialize AI
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    // Initialize AI after a short delay to ensure MongoDB connection is ready
    setTimeout(() => {
        initializeAI().then(() => {
            // Start AI Scheduler after AI initialization
            console.log("🤖 Starting AI Scheduler (runs every 60 seconds)...");
            // Run immediately once, then every 60 seconds
            optimizeWorkload();
            setInterval(optimizeWorkload, 60000);
        });
    }, 2000);
});