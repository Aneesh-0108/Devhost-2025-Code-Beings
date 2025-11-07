import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Resolves the correct path regardless of where you run the server
const dataPath = path.resolve(__dirname, "../data/mockData.json");

export const getEmployees = (req, res) => {
    try {
        const jsonData = fs.readFileSync(dataPath, "utf-8");
        const data = JSON.parse(jsonData);
        const employees = Array.isArray(data) ? data : data.employees ?? [];
        res.json(employees);
    } catch (error) {
        console.error("Error reading data file:", error.message);
        res.status(500).json({
            message: "Error reading data file",
            error: error.message,
        });
    }
};

