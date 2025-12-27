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

// CORS Configuration - Supports both development and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL, // Production frontend URL from Vercel
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use("/api/employees", employeesRouter);
app.use("/api/time", timeRouter);
app.use("/api/ai", aiRouter);


app.get("/",(req,res)=>{
  res.send("Worwell AI backend is running!")
});

// Health check endpoint for deployment monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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
app.listen(PORT, '0.0.0.0', async () => {
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