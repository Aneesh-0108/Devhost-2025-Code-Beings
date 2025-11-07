# Quick Start Guide - WorkWell AI Multi-Face Tracking

## Prerequisites
- MongoDB installed and running on localhost:27017
- Node.js 18+ installed

## 1. Start MongoDB (if not running)

### Windows PowerShell
```powershell
# Start MongoDB service
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db
```

## 2. Start Backend Server

```powershell
cd c:\Hackathon\Devhost-2025-Code-Beings\workwell-ai\backend
npm run dev
```

**Expected output:**
```
Server running on port 5000
✅ MongoDB connected: workwell-ai
```

## 3. Start Frontend Development Server

**New terminal:**
```powershell
cd c:\Hackathon\Devhost-2025-Code-Beings\workwell-ai\frontend
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
➜ Local: http://localhost:5174/
```

## 4. Test the Multi-Face System

### A. View Dashboard
1. Open browser to http://localhost:5174
2. Navigate to Dashboard
3. Should see employee list (polling every 10 seconds)

### B. Test Multi-Face Detection
1. Navigate to "Monitor Cam" page
2. Allow webcam access when prompted
3. System will:
   - Load 4 AI models (TinyFaceDetector, FaceLandmark68, FaceExpression, FaceRecognition)
   - Detect all visible faces
   - Show face count and individual stats
   - Label each face with "Face 1", "Face 2", etc.
   - Display emotion, burnout score, and risk level per face

### C. Verify MongoDB Updates
Every 3 seconds, detected faces are sent to MongoDB:
```powershell
# Check MongoDB data
mongosh
use workwell-ai
db.employees.find().pretty()
```

**You should see:**
- New employees created: `user1@example.com`, `user2@example.com`, etc.
- Each with `burnoutScore`, `status`, `faceDescriptor`, `emotionHistory`

## 5. Test API Endpoints Manually

### Get all employees:
```powershell
curl http://localhost:5000/api/employees
```

### Update an employee:
```powershell
curl -X POST http://localhost:5000/api/employees/update `
  -H "Content-Type: application/json" `
  -d '{"name":"Test User","email":"test@example.com","emotion":"happy","emotionScore":10}'
```

## Expected Behavior

### MonitorCam Page:
- **Detected Faces: 0-N** (updates in real-time)
- **Face Cards**: One card per detected face showing:
  - Expression (happy, sad, angry, etc.)
  - Burnout Score (10-100)
  - Burnout Risk (Low/Normal/Medium/High with color badge)
  - Recommendation text

### Dashboard/EmployeeOverview:
- **Auto-refresh every 10 seconds**
- Shows employees from MongoDB (or mockData.json fallback)
- Displays burnout score and status for each employee

## Burnout Score Reference

| Emotion | Score | Risk Level |
|---------|-------|-----------|
| Happy | 10 | Low (Green) |
| Neutral | 30 | Normal (Blue) |
| Surprised | 40 | Normal (Blue) |
| Fearful | 80 | High (Red) |
| Disgusted | 85 | High (Red) |
| Sad | 90 | High (Red) |
| Angry | 100 | High (Red) |
| Tired | 70 | High (Red) |

## Troubleshooting

### MongoDB not connected
- Error: `MongoDB connection failed`
- Solution: Start MongoDB service or mongod process

### Camera not working
- Error: `NotAllowedError: Permission denied`
- Solution: Allow camera access in browser settings

### Face models not loading
- Error: `Failed to fetch model`
- Solution: Ensure frontend server is running and models exist in `frontend/public/models/`

### No faces detected
- Check lighting conditions
- Ensure face is visible in webcam
- Try adjusting `scoreThreshold` in MonitorCam.jsx (currently 0.5)

## Database Schema

Each employee document:
```javascript
{
  _id: ObjectId,
  name: "User 1",
  email: "user1@example.com",
  role: "Employee",
  burnoutScore: 30,           // 0-100
  status: "Normal",            // Low/Normal/Medium/High
  faceDescriptor: [0.1, ...], // 128 numbers
  lastEmotion: "neutral",
  emotionHistory: [
    { emotion: "happy", score: 10, timestamp: ISODate }
  ],
  lastUpdated: ISODate,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## Key Files Modified

1. ✅ `backend/server.js` - Added MongoDB connection
2. ✅ `backend/config/db.js` - Database connection logic
3. ✅ `backend/models/Employee.js` - Mongoose schema
4. ✅ `backend/controllers/employeeController.js` - Upsert logic + burnout calculation
5. ✅ `backend/routes/employees.js` - Added POST /update endpoint
6. ✅ `frontend/src/pages/MonitorCam.jsx` - Multi-face detection with descriptors
7. ✅ `frontend/src/lib/api.js` - Added updateEmployee() function
8. ✅ `backend/.env` - MongoDB URI configuration

## Next Steps

- Add face matching to identify returning users by face descriptor
- Implement historical trend charts
- Add email alerts for high-risk employees
- Create admin dashboard for team-level insights
