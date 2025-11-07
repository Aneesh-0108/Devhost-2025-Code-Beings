import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Schema for Doctor Analytics
const doctorAnalyticsSchema = new mongoose.Schema({
    doctorId: {
        type: Number,
        required: true,
        unique: true
    },
    name: String,
    department: String,
    burnoutScore: {
        type: Number,
        min: 0,
        max: 100
    },
    category: {
        type: String,
        enum: ['Low', 'Medium', 'High']
    },
    weeklyHours: Number,
    patientLoad: Number,
    emotionScore: Number,
    shiftDuration: Number,
    currentPatients: {
        type: Number,
        default: 0
    },
    recommendedPatients: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Try to get model, create if doesn't exist
let DoctorAnalytics;
try {
    DoctorAnalytics = mongoose.models.DoctorAnalytics || mongoose.model('DoctorAnalytics', doctorAnalyticsSchema);
} catch (error) {
    DoctorAnalytics = mongoose.model('DoctorAnalytics', doctorAnalyticsSchema);
}

// In-memory fallback storage
let inMemoryStorage = [];

/**
 * Calculate burnout score based on the formula:
 * burnoutScore = (weeklyHours * 0.4) + (patientLoad * 0.4) + (emotionScore * 100 * 0.2)
 * Normalized to 0-100 scale
 */
const calculateBurnoutScore = (weeklyHours, patientLoad, emotionScore) => {
    // Normalize weeklyHours (35-70 range) to 0-100 scale
    const hoursNormalized = ((weeklyHours - 35) / 35) * 100;
    
    // Normalize patientLoad (10-60 range) to 0-100 scale
    const loadNormalized = ((patientLoad - 10) / 50) * 100;
    
    // Normalize emotionScore (0.1-1.0 range, lower = calmer) to 0-100 scale
    // Lower emotionScore means higher stress, so invert: (1 - emotionScore) * 100
    const emotionNormalized = (1 - emotionScore) * 100;
    
    // Apply weighted formula
    const burnoutScore = (hoursNormalized * 0.4) + (loadNormalized * 0.4) + (emotionNormalized * 0.2);
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(burnoutScore * 100) / 100));
};

/**
 * Categorize burnout score
 */
const categorizeBurnout = (burnoutScore) => {
    if (burnoutScore < 40) return 'Low';
    if (burnoutScore < 70) return 'Medium';
    return 'High';
};

/**
 * Predict burnout for a single doctor
 */
export const predictBurnout = async (doctorData) => {
    const { doctorId, weeklyHours, patientLoad, emotionScore } = doctorData;
    
    if (!doctorId || weeklyHours === undefined || patientLoad === undefined || emotionScore === undefined) {
        throw new Error('Missing required fields: doctorId, weeklyHours, patientLoad, emotionScore');
    }
    
    const burnoutScore = calculateBurnoutScore(weeklyHours, patientLoad, emotionScore);
    const category = categorizeBurnout(burnoutScore);
    
    const result = {
        doctorId,
        burnoutScore,
        category,
        ...doctorData
    };
    
    // Store in MongoDB or in-memory
    await storeAnalytics(result);
    
    return result;
};

/**
 * Store analytics in MongoDB or in-memory fallback
 */
export const storeAnalytics = async (analytics) => {
    try {
        if (mongoose.connection.readyState === 1) {
            // MongoDB is connected
            await DoctorAnalytics.findOneAndUpdate(
                { doctorId: analytics.doctorId },
                {
                    ...analytics,
                    lastUpdated: new Date()
                },
                { upsert: true, new: true }
            );
        } else {
            // Use in-memory storage
            const index = inMemoryStorage.findIndex(d => d.doctorId === analytics.doctorId);
            if (index >= 0) {
                inMemoryStorage[index] = { ...analytics, lastUpdated: new Date() };
            } else {
                inMemoryStorage.push({ ...analytics, lastUpdated: new Date() });
            }
        }
    } catch (error) {
        console.error('Error storing analytics:', error.message);
        // Fallback to in-memory
        const index = inMemoryStorage.findIndex(d => d.doctorId === analytics.doctorId);
        if (index >= 0) {
            inMemoryStorage[index] = { ...analytics, lastUpdated: new Date() };
        } else {
            inMemoryStorage.push({ ...analytics, lastUpdated: new Date() });
        }
    }
};

/**
 * Train model from training data
 */
export const trainModel = async () => {
    try {
        const dataPath = path.join(__dirname, '../data/doctorTrainingData.json');
        
        if (!fs.existsSync(dataPath)) {
            console.log('⚠️  Training data not found. Generating synthetic data...');
            const { generateDataset } = await import('../data/generateDoctorData.js');
            const doctors = generateDataset(50);
            fs.writeFileSync(dataPath, JSON.stringify(doctors, null, 2), 'utf-8');
            console.log('✅ Generated training data');
        }
        
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const doctors = JSON.parse(rawData);
        
        console.log(`📊 Training model with ${doctors.length} doctor records...`);
        
        const predictions = [];
        for (const doctor of doctors) {
            const prediction = await predictBurnout(doctor);
            predictions.push(prediction);
        }
        
        console.log(`✅ Model training complete. Processed ${predictions.length} doctors.`);
        console.log(`📈 Burnout distribution:`, {
            Low: predictions.filter(p => p.category === 'Low').length,
            Medium: predictions.filter(p => p.category === 'Medium').length,
            High: predictions.filter(p => p.category === 'High').length
        });
        
        return predictions;
    } catch (error) {
        console.error('❌ Error training model:', error.message);
        throw error;
    }
};

/**
 * Get all analytics from storage
 */
export const getAllAnalytics = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return await DoctorAnalytics.find().sort({ doctorId: 1 });
        } else {
            return inMemoryStorage;
        }
    } catch (error) {
        console.error('Error fetching analytics:', error.message);
        return inMemoryStorage;
    }
};

/**
 * Get analytics for a specific doctor
 */
export const getDoctorAnalytics = async (doctorId) => {
    try {
        if (mongoose.connection.readyState === 1) {
            return await DoctorAnalytics.findOne({ doctorId });
        } else {
            return inMemoryStorage.find(d => d.doctorId === doctorId);
        }
    } catch (error) {
        console.error('Error fetching doctor analytics:', error.message);
        return inMemoryStorage.find(d => d.doctorId === doctorId);
    }
};

export { DoctorAnalytics };

