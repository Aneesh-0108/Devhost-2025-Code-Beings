import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { predictBurnout as predictBurnoutModel } from '../ai/modelTrainer.js';
import { balanceWorkload } from '../ai/workloadBalancer.js';
import { optimizeWorkload } from '../aiScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.resolve(__dirname, "../data/mockData.json");

const readData = () => {
    const raw = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(raw);
};

const writeData = (data) => {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
};

const deriveBurnoutRisk = (stressScore, dominantExpression) => {
    if (stressScore >= 0.7 || ["angry", "fearful", "disgusted"].includes(dominantExpression)) {
        return "High";
    }

    if (stressScore >= 0.4 || ["sad", "surprised"].includes(dominantExpression)) {
        return "Medium";
    }

    return "Low";
};

const buildRecommendation = (risk) => {
    switch (risk) {
        case "High":
            return "Schedule immediate check-in and encourage time off.";
        case "Medium":
            return "Monitor workload and suggest mindfulness breaks.";
        default:
            return "Continue supportive practices and celebrate wins.";
    }
};

export const postTelemetry = (req, res) => {
    const { expression, stressScore, timestamp } = req.body ?? {};

    if (
        typeof expression !== "string" ||
        typeof stressScore !== "number" ||
        Number.isNaN(stressScore)
    ) {
        return res.status(400).json({
            message: "Invalid telemetry payload: expression (string) and stressScore (number) are required.",
        });
    }

    try {
        const data = readData();
        const container = Array.isArray(data)
            ? { employees: data, aiInsights: {} }
            : data;

        const burnoutRisk = deriveBurnoutRisk(stressScore, expression.toLowerCase());
        const recommendation = buildRecommendation(burnoutRisk);
        const nextSnapshot = {
            burnoutRisk,
            stressScore,
            dominantExpression: expression,
            recommendation,
            lastUpdated: timestamp || new Date().toISOString(),
        };

        const updated = {
            ...container,
            aiInsights: {
                ...(container.aiInsights ?? {}),
                ...nextSnapshot,
            },
        };

        writeData(updated);

        return res.status(200).json(nextSnapshot);
    } catch (error) {
        console.error("Error updating telemetry data:", error.message);
        return res.status(500).json({
            message: "Failed to persist telemetry data.",
            error: error.message,
        });
    }
};

export const getTelemetry = (req, res) => {
    try {
        const data = readData();
        const container = Array.isArray(data)
            ? { aiInsights: {} }
            : data;

        return res.status(200).json(container.aiInsights ?? {});
    } catch (error) {
        console.error("Error reading telemetry data:", error.message);
        return res.status(500).json({
            message: "Failed to read telemetry data.",
            error: error.message,
        });
    }
};

// AI Burnout Prediction Controller
export const predictBurnout = async (req, res) => {
    try {
        const { doctor, doctors } = req.body;

        // Handle single doctor or array of doctors
        const doctorsToProcess = doctors || (doctor ? [doctor] : []);

        if (doctorsToProcess.length === 0) {
            return res.status(400).json({
                message: "Please provide either 'doctor' (object) or 'doctors' (array) in the request body.",
            });
        }

        const predictions = [];
        for (const doc of doctorsToProcess) {
            try {
                const prediction = await predictBurnoutModel(doc);
                predictions.push(prediction);
            } catch (error) {
                console.error(`Error predicting burnout for doctor ${doc.doctorId}:`, error.message);
                predictions.push({
                    doctorId: doc.doctorId,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            count: predictions.length,
            predictions: predictions.length === 1 ? predictions[0] : predictions
        });
    } catch (error) {
        console.error("Error in predictBurnout controller:", error.message);
        return res.status(500).json({
            message: "Failed to predict burnout.",
            error: error.message,
        });
    }
};

// Workload Balancing Controller
export const balanceWorkloadController = async (req, res) => {
    try {
        const workloadData = await balanceWorkload();
        
        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            ...workloadData
        });
    } catch (error) {
        console.error("Error in balanceWorkload controller:", error.message);
        return res.status(500).json({
            message: "Failed to balance workload.",
            error: error.message,
        });
    }
};

// AI Scheduler Optimization Controller
export const optimizeWorkloadController = async (req, res) => {
    try {
        console.log("📞 Manual optimization triggered via API");
        await optimizeWorkload();
        
        return res.status(200).json({
            success: true,
            message: "Workload optimization completed successfully",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in optimizeWorkload controller:", error.message);
        return res.status(500).json({
            message: "Failed to optimize workload.",
            error: error.message,
        });
    }
};

