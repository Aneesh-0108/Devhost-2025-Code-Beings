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
