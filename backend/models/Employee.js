import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        default: 'Employee'
    },
    burnoutScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['Low', 'Normal', 'Medium', 'High'],
        default: 'Normal'
    },
    weeklyHours: {
        type: Number,
        default: 0
    },
    todayHours: {
        type: Number,
        default: 0
    },
    faceDescriptor: {
        type: [Number],
        default: []
    },
    lastEmotion: {
        type: String,
        default: 'neutral'
    },
    emotionHistory: [{
        emotion: String,
        score: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastUpdated before saving
employeeSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

// Calculate status based on burnout score
employeeSchema.methods.calculateStatus = function () {
    if (this.burnoutScore >= 70) {
        this.status = 'High';
    } else if (this.burnoutScore >= 50) {
        this.status = 'Medium';
    } else if (this.burnoutScore >= 30) {
        this.status = 'Normal';
    } else {
        this.status = 'Low';
    }
};

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
