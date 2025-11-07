export const getTodayTime = (req, res) => {
    const todayData = {
        todayHours: 3.5,
        yesterdayHours: 6.8
    };
    res.json(todayData);
};