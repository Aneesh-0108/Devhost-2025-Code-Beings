import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fake names for doctors
const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
    'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
    'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
    'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
    'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
    'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Frank', 'Christine', 'Gregory', 'Debra',
    'Raymond', 'Rachel', 'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Virginia',
    'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Julie'
];

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
    'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
    'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
    'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
    'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
    'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
    'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
    'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
    'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross'
];

const departments = [
    'Cardiology', 'Pediatrics', 'Surgery', 'Emergency', 'Oncology', 'Neurology',
    'Orthopedics', 'Radiology', 'Psychiatry', 'Dermatology', 'Gastroenterology',
    'Pulmonology', 'Endocrinology', 'Nephrology', 'Hematology', 'Rheumatology',
    'Urology', 'Ophthalmology', 'Otolaryngology', 'Anesthesiology', 'Pathology',
    'Internal Medicine', 'Family Medicine', 'Obstetrics', 'Gynecology'
];

// Generate random number in range
const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random float in range
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Calculate burnout risk based on combined stress factors
const calculateBurnoutRisk = (weeklyHours, patientLoad, emotionScore) => {
    // Normalize values for scoring
    const hoursScore = ((weeklyHours - 35) / 35) * 100; // 0-100 scale
    const loadScore = ((patientLoad - 10) / 50) * 100; // 0-100 scale
    const emotionScoreNormalized = (1 - emotionScore) * 100; // Lower emotion = higher stress
    
    // Weighted burnout score
    const burnoutScore = (hoursScore * 0.4) + (loadScore * 0.4) + (emotionScoreNormalized * 0.2);
    
    // Categorize
    if (burnoutScore < 40) return 'Low';
    if (burnoutScore < 70) return 'Medium';
    return 'High';
};

// Generate a single doctor entry
const generateDoctor = (id) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const department = departments[Math.floor(Math.random() * departments.length)];
    const weeklyHours = randomInRange(35, 70);
    const patientLoad = randomInRange(10, 60);
    const emotionScore = randomFloat(0.1, 1.0);
    const shiftDuration = randomInRange(6, 12);
    
    const burnoutRisk = calculateBurnoutRisk(weeklyHours, patientLoad, emotionScore);
    
    return {
        doctorId: id,
        name,
        department,
        weeklyHours,
        patientLoad,
        emotionScore: Math.round(emotionScore * 100) / 100,
        shiftDuration,
        burnoutRisk
    };
};

// Generate dataset
const generateDataset = (count = 50) => {
    const doctors = [];
    for (let i = 1; i <= count; i++) {
        doctors.push(generateDoctor(i));
    }
    return doctors;
};

// Main execution
const main = () => {
    const doctors = generateDataset(50);
    const outputPath = path.join(__dirname, 'doctorTrainingData.json');
    
    fs.writeFileSync(outputPath, JSON.stringify(doctors, null, 2), 'utf-8');
    console.log(`✅ Generated ${doctors.length} doctor entries in ${outputPath}`);
    console.log(`📊 Sample entry:`, JSON.stringify(doctors[0], null, 2));
};

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('generateDoctorData.js');
if (isMainModule) {
    main();
}

export { generateDataset, calculateBurnoutRisk };

