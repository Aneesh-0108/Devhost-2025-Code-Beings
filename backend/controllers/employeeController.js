import Employee from "../models/Employee.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate burnout score from emotion
const calculateBurnoutScore = (emotion) => {
    const scoreMap = {
        happy: 10,
        neutral: 30,
        tired: 70,
        sad: 90,
        angry: 100,
        disgusted: 85,
        fearful: 80,
        surprised: 40
    };
    return scoreMap[emotion?.toLowerCase()] || 50;
};

export const getEmployees = async (req, res) => {
    // Always use mockData.json for now (skip MongoDB to avoid timeout)
    try {
        const dataPath = path.resolve(__dirname, "../data/mockData.json");
        const jsonData = fs.readFileSync(dataPath, "utf-8");
        const data = JSON.parse(jsonData);
        const employeeList = Array.isArray(data) ? data : data.employees ?? [];
        res.json(employeeList);
    } catch (error) {
        console.error("Error reading mockData:", error);
        res.status(500).json({ message: "Error fetching employees" });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const { name, email, faceDescriptor, emotion, emotionScore, role } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Calculate burnout score from emotion
        const burnoutScore = emotion ? calculateBurnoutScore(emotion) : undefined;

        // Prepare update data
        const updateData = {
            name,
            email: email.toLowerCase(),
            ...(role && { role }),
            ...(faceDescriptor && { faceDescriptor }),
            ...(emotion && { lastEmotion: emotion }),
            ...(burnoutScore !== undefined && { burnoutScore })
        };

        // Add to emotion history if emotion data is provided
        if (emotion && emotionScore !== undefined) {
            updateData.$push = {
                emotionHistory: {
                    emotion,
                    score: emotionScore,
                    timestamp: new Date()
                }
            };
        }

        // Upsert employee (create if doesn't exist, update if exists)
        const employee = await Employee.findOneAndUpdate(
            { email: email.toLowerCase() },
            updateData,
            {
                upsert: true,
                new: true, // Return the updated document
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        // Calculate and update status based on burnout score
        employee.calculateStatus();
        await employee.save();

        res.json({
            message: "Employee updated successfully",
            employee
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({
            message: "Error updating employee",
            error: error.message
        });
    }
};
