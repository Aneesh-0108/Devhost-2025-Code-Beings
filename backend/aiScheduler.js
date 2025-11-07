import mongoose from 'mongoose';
import { getAllAnalytics, DoctorAnalytics, storeAnalytics } from './ai/modelTrainer.js';

/**
 * Generate mock patient traffic (if not already set)
 */
const generateMockPatientTraffic = (doctors) => {
    return doctors.map(doctor => ({
        doctorId: doctor.doctorId,
        patientsToday: doctor.currentPatients || Math.floor(Math.random() * 50) + 5,
        department: doctor.department || 'General'
    }));
};

/**
 * Calculate recommended patients based on burnout score
 */
const calculateRecommendedPatients = (burnoutScore, currentPatients) => {
    if (burnoutScore >= 70) {
        // High burnout - reduce to 25 max
        return Math.min(25, currentPatients);
    } else if (burnoutScore >= 50) {
        // Medium burnout - reduce to 35 max
        return Math.min(35, currentPatients);
    } else if (burnoutScore >= 30) {
        // Normal - can handle up to 40
        return Math.min(40, currentPatients);
    } else {
        // Low burnout - can handle up to 50
        return Math.min(50, currentPatients);
    }
};

/**
 * Fetch all doctors/employees with workload data
 */
const fetchAllDoctors = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            // MongoDB is connected
            const doctors = await DoctorAnalytics.find().lean();
            return doctors;
        } else {
            // Use in-memory storage from modelTrainer
            const analytics = await getAllAnalytics();
            if (analytics && analytics.length > 0) {
                return analytics;
            }
            return [];
        }
    } catch (error) {
        console.error('Error fetching doctors:', error.message);
        return [];
    }
};

/**
 * Update doctor workload in database
 */
const updateDoctorWorkload = async (doctorId, updates) => {
    try {
        // Get current doctor data
        const currentDoctor = await fetchAllDoctors().then(doctors => 
            doctors.find(d => d.doctorId === doctorId)
        );
        
        if (!currentDoctor) {
            console.log(`  ⚠️  Doctor ${doctorId} not found. Skipping update.`);
            return;
        }

        // Merge updates with existing data
        const updatedData = {
            ...currentDoctor,
            ...updates,
            lastUpdated: new Date()
        };

        // Use storeAnalytics to persist (handles both MongoDB and in-memory)
        await storeAnalytics(updatedData);
    } catch (error) {
        console.error(`Error updating doctor ${doctorId}:`, error.message);
    }
};

/**
 * Optimize workload distribution across all doctors
 */
export const optimizeWorkload = async () => {
    const startTime = Date.now();
    console.log('\n🔄 ===== AI Scheduler: Starting Workload Optimization =====');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

    try {
        // Fetch all doctors
        let doctors = await fetchAllDoctors();

        if (!doctors || doctors.length === 0) {
            console.log('⚠️  No doctors found. Skipping optimization.');
            return;
        }

        // Initialize currentPatients if not set
        doctors = doctors.map(doctor => ({
            ...doctor,
            currentPatients: doctor.currentPatients || Math.floor(Math.random() * 50) + 5,
            burnoutScore: doctor.burnoutScore || 0
        }));

        // Log BEFORE state
        console.log('📊 BEFORE Redistribution:');
        console.log('─'.repeat(80));
        const beforeTotal = doctors.reduce((sum, d) => sum + (d.currentPatients || 0), 0);
        const beforeAvg = (beforeTotal / doctors.length).toFixed(2);
        doctors.forEach(doctor => {
            console.log(
                `  ${doctor.name || `Doctor ${doctor.doctorId}`.padEnd(20)} | ` +
                `Current: ${String(doctor.currentPatients || 0).padStart(3)} | ` +
                `Burnout: ${String(doctor.burnoutScore || 0).padStart(3)} | ` +
                `Status: ${doctor.category || 'N/A'}`
            );
        });
        console.log(`  Total Patients: ${beforeTotal} | Average: ${beforeAvg}`);
        console.log('─'.repeat(80));

        // Identify overworked and underworked doctors
        const overworked = doctors.filter(d => {
            const recommended = calculateRecommendedPatients(d.burnoutScore || 0, d.currentPatients || 0);
            return (d.currentPatients || 0) > recommended;
        });

        const underworked = doctors
            .filter(d => {
                const recommended = calculateRecommendedPatients(d.burnoutScore || 0, d.currentPatients || 0);
                return (d.currentPatients || 0) < recommended && (d.burnoutScore || 0) < 50;
            })
            .sort((a, b) => (a.burnoutScore || 0) - (b.burnoutScore || 0)); // Prioritize lower burnout

        console.log(`\n🔍 Analysis:`);
        console.log(`  Overworked doctors: ${overworked.length}`);
        console.log(`  Underworked doctors: ${underworked.length}`);

        if (overworked.length === 0) {
            console.log('✅ All doctors are within optimal workload range. No redistribution needed.\n');
            return;
        }

        // Calculate total excess workload
        let totalExcess = 0;
        const redistributionPlan = [];

        overworked.forEach(overloaded => {
            const recommended = calculateRecommendedPatients(
                overloaded.burnoutScore || 0,
                overloaded.currentPatients || 0
            );
            const excess = (overloaded.currentPatients || 0) - recommended;
            totalExcess += excess;

            redistributionPlan.push({
                from: overloaded.doctorId,
                fromName: overloaded.name || `Doctor ${overloaded.doctorId}`,
                excess: excess,
                current: overloaded.currentPatients || 0,
                recommended: recommended
            });
        });

        console.log(`  Total excess patients to redistribute: ${totalExcess}`);

        // Redistribute to underworked doctors
        if (underworked.length > 0 && totalExcess > 0) {
            const patientsPerDoctor = Math.ceil(totalExcess / underworked.length);
            let remainingExcess = totalExcess;

            underworked.forEach((underloaded, index) => {
                if (remainingExcess <= 0) return;

                const recommended = calculateRecommendedPatients(
                    underloaded.burnoutScore || 0,
                    underloaded.currentPatients || 0
                );
                const capacity = recommended - (underloaded.currentPatients || 0);
                const toAdd = Math.min(patientsPerDoctor, capacity, remainingExcess);

                if (toAdd > 0) {
                    const newCurrent = (underloaded.currentPatients || 0) + toAdd;
                    const newRecommended = calculateRecommendedPatients(
                        underloaded.burnoutScore || 0,
                        newCurrent
                    );

                    // Update in database
                    updateDoctorWorkload(underloaded.doctorId, {
                        currentPatients: newCurrent,
                        recommendedPatients: newRecommended
                    });

                    console.log(
                        `  ➡️  Redistributing ${toAdd} patients to ${underloaded.name || `Doctor ${underloaded.doctorId}`} ` +
                        `(${underloaded.currentPatients || 0} → ${newCurrent})`
                    );

                    remainingExcess -= toAdd;
                }
            });
        }

        // Reduce workload for overworked doctors
        redistributionPlan.forEach(plan => {
            const newCurrent = plan.recommended;
            const newRecommended = calculateRecommendedPatients(
                doctors.find(d => d.doctorId === plan.from)?.burnoutScore || 0,
                newCurrent
            );

            updateDoctorWorkload(plan.from, {
                currentPatients: newCurrent,
                recommendedPatients: newRecommended
            });

            console.log(
                `  ⬇️  Reducing ${plan.fromName} workload ` +
                `(${plan.current} → ${newCurrent} patients)`
            );
        });

        // Fetch updated data
        const updatedDoctors = await fetchAllDoctors();

        // Log AFTER state
        console.log('\n📊 AFTER Redistribution:');
        console.log('─'.repeat(80));
        const afterTotal = updatedDoctors.reduce((sum, d) => sum + (d.currentPatients || 0), 0);
        const afterAvg = (afterTotal / updatedDoctors.length).toFixed(2);
        updatedDoctors.forEach(doctor => {
            const recommended = calculateRecommendedPatients(
                doctor.burnoutScore || 0,
                doctor.currentPatients || 0
            );
            console.log(
                `  ${(doctor.name || `Doctor ${doctor.doctorId}`).padEnd(20)} | ` +
                `Current: ${String(doctor.currentPatients || 0).padStart(3)} | ` +
                `Recommended: ${String(recommended).padStart(3)} | ` +
                `Burnout: ${String(doctor.burnoutScore || 0).padStart(3)}`
            );
        });
        console.log(`  Total Patients: ${afterTotal} | Average: ${afterAvg}`);
        console.log('─'.repeat(80));

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Optimization complete in ${duration}s`);
        console.log('🔄 ===== AI Scheduler: Workload Optimization Complete =====\n');

    } catch (error) {
        console.error('❌ Error in optimizeWorkload:', error.message);
        console.error(error.stack);
    }
};

// Export for manual triggering
export default optimizeWorkload;

