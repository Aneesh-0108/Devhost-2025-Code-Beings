export async function fetchEmployees() {
    const res = await fetch('/api/employees');
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
}

export async function fetchTodayTime() {
    const res = await fetch('/api/time/today');
    if (!res.ok) throw new Error('Failed to fetch time');
    return res.json();
}

export async function fetchAiTelemetry() {
    const res = await fetch('/api/ai/telemetry');
    if (!res.ok) throw new Error('Failed to fetch AI telemetry');
    return res.json();
}

export async function sendAiTelemetry(payload) {
    const res = await fetch('/api/ai/telemetry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to send AI telemetry');
    }

    return res.json();
}