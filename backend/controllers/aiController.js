import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

