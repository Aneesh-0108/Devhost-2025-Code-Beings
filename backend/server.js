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
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL, // Production frontend URL from Vercel
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all localhost origins
    if (isDevelopment) {
      return callback(null, true);
    }

    // In production, strictly check against allowed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Explicitly handle preflight OPTIONS requests for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use("/api/employees", employeesRouter);
app.use("/api/time", timeRouter);
app.use("/api/ai", aiRouter);


app.get("/", (req, res) => {
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