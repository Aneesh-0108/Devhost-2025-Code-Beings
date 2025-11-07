# WorkWell AI - Multi-Face Emotion Tracking System

## Overview
Complete MERN stack application with multi-face recognition, emotion tracking, and burnout scoring using face-api.js and MongoDB.

## Features Implemented

### ✅ MongoDB Integration
- **Employee Model** (`backend/models/Employee.js`)
  - Schema fields: name, email (unique), role, burnoutScore (0-100), status (Low/Normal/Medium/High)
  - Face descriptor storage for face recognition
  - Emotion history tracking with timestamps
  - Automatic status calculation based on burnout score

- **Database Connection** (`backend/config/db.js`)
  - MongoDB connection URI: `mongodb://localhost:27017/workwell-ai`
  - Graceful degradation if MongoDB is unavailable
  - Environment variable configuration via `.env`

### ✅ Multi-Face Detection & Recognition
- **MonitorCam.jsx** - Enhanced webcam monitoring
  - Uses `detectAllFaces()` to detect multiple faces simultaneously
  - Face recognition with descriptor extraction (`withFaceDescriptors()`)
  - Individual emotion analysis for each detected face
  - Real-time burnout score calculation per person
  - Visual overlay with face numbering

### ✅ Burnout Scoring System
- **Emotion-to-Score Mapping**:
  - Happy: 10 (Low risk)
  - Neutral: 30 (Low risk)
  - Surprised: 40 (Normal risk)
  - Tired: 70 (High risk)
  - Sad: 90 (High risk)
  - Angry: 100 (Critical risk)
  - Disgusted: 85 (High risk)
  - Fearful: 80 (High risk)

- **Risk Categories**:
  - **Low** (0-29): Green badge
  - **Normal** (30-49): Blue badge
  - **Medium** (50-69): Yellow badge
  - **High** (70-100): Red badge

### ✅ Employee Upsert Endpoint
- **Route**: `POST /api/employees/update`
- **Controller**: `employeeController.updateEmployee()`
- **Functionality**:
  - Creates new employee if doesn't exist (by email)
  - Updates existing employee if found
  - Stores face descriptor for future recognition
  - Calculates and updates burnout score
  - Adds emotion to history array
  - Auto-calculates status based on score

### ✅ Live Dashboard Updates
- **EmployeeOverview.jsx**
  - Polls `/api/employees` every 10 seconds
  - Displays live data from MongoDB
  - Falls back to mockData.json if MongoDB empty
  - Shows burnout score, status, and AI insights

## API Endpoints

### GET /api/employees
Returns all employees from MongoDB (or mockData.json fallback)

### POST /api/employees/update
Updates or creates employee with emotion data

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "faceDescriptor": [0.123, -0.456, ...], // 128-dim array
  "emotion": "happy",
  "emotionScore": 10,
  "role": "Employee"
}
```

**Response**:
```json
{
  "message": "Employee updated successfully",
  "employee": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "burnoutScore": 10,
    "status": "Low",
    "lastEmotion": "happy",
    "emotionHistory": [...],
    "lastUpdated": "2025-01-..."
  }
}
```

## Frontend Components

### MonitorCam (Multi-Face)
- **Location**: `frontend/src/pages/MonitorCam.jsx`
- **AI Models Used**:
  - TinyFaceDetector (face detection)
  - FaceLandmark68Net (facial landmarks)
  - FaceExpressionNet (emotion recognition)
  - FaceRecognitionNet (face descriptors)
- **Update Frequency**: Every 3 seconds per face
- **Display**: Shows all detected faces with individual stats

### EmployeeOverview
- **Location**: `frontend/src/components/EmployeeOverview.jsx`
- **Polling**: Every 10 seconds
- **Data Source**: MongoDB via `/api/employees`

## Database Schema

```javascript
{
  name: String (required),
  email: String (unique, required),
  role: String (default: 'Employee'),
  burnoutScore: Number (0-100, default: 0),
  status: String (Low/Normal/Medium/High),
  weeklyHours: Number,
  todayHours: Number,
  faceDescriptor: [Number], // 128-dim face embedding
  lastEmotion: String,
  emotionHistory: [{
    emotion: String,
    score: Number,
    timestamp: Date
  }],
  lastUpdated: Date,
  timestamps: true
}
```

## Setup Instructions

### 1. Install MongoDB
```bash
# Windows (via Chocolatey)
choco install mongodb

# Or download from https://www.mongodb.com/try/download/community
```

### 2. Start MongoDB
```bash
# Windows
mongod --dbpath C:\data\db

# Linux/Mac
sudo systemctl start mongod
```

### 3. Install Dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. Configure Environment
Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/workwell-ai
NODE_ENV=development
```

### 5. Run Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access Application
- Frontend: http://localhost:5174
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

## Workflow

1. **User appears in webcam** → MonitorCam detects face
2. **Face analysis** → Extracts emotion and 128-dim descriptor
3. **Burnout calculation** → Maps emotion to burnout score (10-100)
4. **API call** → POST to `/api/employees/update` every 3 seconds
5. **MongoDB upsert** → Creates/updates employee by email
6. **Status update** → Auto-calculates Low/Normal/Medium/High
7. **Dashboard refresh** → EmployeeOverview polls every 10 seconds
8. **Live display** → Shows updated burnout scores and statuses

## File Structure

```
backend/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── employeeController.js    # Employee CRUD + upsert
│   └── aiController.js          # AI telemetry
├── models/
│   └── Employee.js              # Mongoose schema
├── routes/
│   ├── employees.js             # Employee routes
│   └── ai.js                    # AI routes
├── .env                         # Environment variables
└── server.js                    # Express app entry

frontend/
├── src/
│   ├── components/
│   │   └── EmployeeOverview.jsx # Employee table
│   ├── lib/
│   │   └── api.js               # API client functions
│   └── pages/
│       └── MonitorCam.jsx       # Multi-face detection
└── public/
    └── models/                  # face-api.js models
```

## Dependencies

### Backend
- express: 5.1.0
- cors: Latest
- mongoose: Latest
- dotenv: Latest
- nodemon: 3.1.10 (dev)

### Frontend
- react: 19.1.1
- vite: 7.2.1
- face-api.js: 0.22.2
- tailwindcss: 4.1.17

## Notes

- **UTF-8 Encoding**: All backend JavaScript files must use UTF-8 encoding for ES modules
- **Fallback Logic**: If MongoDB is unavailable, API falls back to mockData.json
- **Face Recognition**: Face descriptors are 128-dimensional arrays for future user identification
- **Emotion History**: All emotion readings are stored with timestamps for trend analysis
- **Auto Status**: Status (Low/Normal/Medium/High) is automatically calculated from burnout score

## Future Enhancements

- [ ] Face matching against stored descriptors for user identification
- [ ] Historical burnout trend charts
- [ ] Email alerts for high-risk employees
- [ ] Team-level burnout aggregation
- [ ] Custom emotion-to-score mappings per organization
