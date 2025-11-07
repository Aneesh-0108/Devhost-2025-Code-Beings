import { getAllAnalytics, getDoctorAnalytics, predictBurnout } from './modelTrainer.js';

/**
 * Generate mock patient traffic data
 */
const generateMockPatientTraffic = (doctors) => {
    return doctors.map(doctor => ({
        doctorId: doctor.doctorId,
        patientsToday: Math.floor(Math.random() * 50) + 5, // 5-55 patients
        department: doctor.department || 'General'
    }));
};

/**
 * Balance workload across doctors based on burnout scores and current patient load
 */
export const balanceWorkload = async () => {
    try {
        // Get all doctor analytics
        const analytics = await getAllAnalytics();
        
        if (!analytics || analytics.length === 0) {
            console.log('⚠️  No doctor analytics found. Generating mock data...');
            // Generate mock analytics if none exist
            const mockDoctors = Array.from({ length: 10 }, (_, i) => ({
                doctorId: i + 1,
                name: `Doctor ${i + 1}`,
                department: ['Cardiology', 'Pediatrics', 'Surgery', 'Emergency'][i % 4],
                weeklyHours: 40 + (i * 3),
                patientLoad: 20 + (i * 2),
                emotionScore: 0.3 + (i * 0.05)
            }));
            
            for (const doctor of mockDoctors) {
                await predictBurnout(doctor);
            }
            
            const updatedAnalytics = await getAllAnalytics();
            return await calculateWorkloadDistribution(updatedAnalytics);
        }
        
        return await calculateWorkloadDistribution(analytics);
    } catch (error) {
        console.error('Error balancing workload:', error.message);
        throw error;
    }
};

/**
 * Calculate optimal workload distribution
 */
const calculateWorkloadDistribution = async (analytics) => {
    // Use stored currentPatients if available, otherwise generate mock traffic
    const patientTraffic = generateMockPatientTraffic(analytics);
    
    // Combine analytics with current traffic (prefer stored currentPatients)
    const doctorsWithWorkload = analytics.map(doctor => {
        // Use stored currentPatients if available, otherwise use generated traffic
        const storedPatients = doctor.currentPatients !== undefined ? doctor.currentPatients : null;
        const traffic = patientTraffic.find(t => t.doctorId === doctor.doctorId) || {
            doctorId: doctor.doctorId,
            patientsToday: 0,
            department: doctor.department
        };
        
        const currentPatients = storedPatients !== null ? storedPatients : traffic.patientsToday;
        
        return {
            doctorId: doctor.doctorId,
            name: doctor.name || `Doctor ${doctor.doctorId}`,
            department: doctor.department,
            burnoutScore: doctor.burnoutScore || 0,
            category: doctor.category || 'Low',
            weeklyHours: doctor.weeklyHours || 0,
            currentPatients: currentPatients,
            isOverloaded: (doctor.burnoutScore > 70) || (currentPatients > 40),
            needsRedistribution: (doctor.burnoutScore > 70) || (currentPatients > 40)
        };
    });
    
    // Calculate average workload
    const totalPatients = doctorsWithWorkload.reduce((sum, d) => sum + d.currentPatients, 0);
    const averagePatients = totalPatients / doctorsWithWorkload.length;
    
    // Identify overloaded doctors
    const overloadedDoctors = doctorsWithWorkload.filter(d => d.needsRedistribution);
    const availableDoctors = doctorsWithWorkload.filter(d => !d.needsRedistribution && d.burnoutScore < 50);
    
    // Redistribute workload
    const recommendations = doctorsWithWorkload.map(doctor => {
        let recommendedPatients = doctor.currentPatients;
        let redistribution = [];
        
        if (doctor.needsRedistribution && availableDoctors.length > 0) {
            // Calculate how many patients to redistribute
            const excessPatients = Math.max(0, doctor.currentPatients - 35); // Target max 35 patients
            const patientsPerDoctor = Math.ceil(excessPatients / availableDoctors.length);
            
            recommendedPatients = doctor.currentPatients - excessPatients;
            
            // Distribute to available doctors
            redistribution = availableDoctors.slice(0, Math.min(3, availableDoctors.length)).map(avail => ({
                toDoctorId: avail.doctorId,
                toDoctorName: avail.name,
                redistributeCount: Math.min(patientsPerDoctor, excessPatients)
            }));
        } else if (!doctor.needsRedistribution && doctor.currentPatients < averagePatients * 0.7) {
            // Can take more patients
            recommendedPatients = Math.min(averagePatients, doctor.currentPatients + 5);
        }
        
        return {
            ...doctor,
            recommendedPatients: Math.round(recommendedPatients),
            redistribution,
            status: doctor.needsRedistribution ? 'Overloaded' : 
                   doctor.burnoutScore > 50 ? 'At Risk' : 'Normal'
        };
    });
    
    return {
        summary: {
            totalDoctors: recommendations.length,
            overloadedCount: overloadedDoctors.length,
            averagePatients: Math.round(averagePatients * 100) / 100,
            totalPatients,
            redistributionNeeded: overloadedDoctors.length > 0
        },
        doctors: recommendations.sort((a, b) => b.burnoutScore - a.burnoutScore)
    };
};

/**
 * Get workload balance for a specific doctor
 */
export const getDoctorWorkload = async (doctorId) => {
    try {
        const analytics = await getDoctorAnalytics(doctorId);
        if (!analytics) {
            return null;
        }
        
        const traffic = {
            doctorId: analytics.doctorId,
            patientsToday: Math.floor(Math.random() * 50) + 5,
            department: analytics.department
        };
        
        return {
            doctorId: analytics.doctorId,
            name: analytics.name,
            department: analytics.department,
            burnoutScore: analytics.burnoutScore,
            category: analytics.category,
            currentPatients: traffic.patientsToday,
            isOverloaded: (analytics.burnoutScore > 70) || (traffic.patientsToday > 40),
            recommendedMaxPatients: analytics.burnoutScore > 70 ? 25 : 40
        };
    } catch (error) {
        console.error('Error getting doctor workload:', error.message);
        throw error;
    }
};

