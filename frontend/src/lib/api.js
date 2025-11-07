const API_BASE = "http://localhost:5000/api";

export async function fetchEmployees() {
    try {
        const response = await fetch(`${API_BASE}/employees`);
        if (!response.ok) {
            throw new Error("Failed to fetch employees");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching employees:", error);
        throw error;
    }
}

export async function fetchAiTelemetry() {
    try {
        const response = await fetch(`${API_BASE}/ai/telemetry`);
        if (!response.ok) {
            throw new Error("Failed to fetch AI telemetry");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching AI telemetry:", error);
        throw error;
    }
}

export async function sendAiTelemetry(data) {
    try {
        const response = await fetch(`${API_BASE}/ai/telemetry`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error("Failed to send AI telemetry");
        }
        return await response.json();
    } catch (error) {
        console.error("Error sending AI telemetry:", error);
        throw error;
    }
}

export async function updateEmployee(data) {
    try {
        const response = await fetch(`${API_BASE}/employees/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error("Failed to update employee");
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating employee:", error);
        throw error;
    }
}

