const axios = require('axios');

async function test() {
    try {
        // First login
        const loginRes = await axios.post('https://nutrisnapai.onrender.com/auth/login', {
            email: 'jagadesh@example.com',
            password: 'password123'
        });
        const token = loginRes.data.access_token;
        console.log("Logged in:", token.substring(0, 20) + '...');

        const payload = {
            reminder_type: 'workout',
            title: 'Workout Reminder',
            reminder_time: '08:00 AM',
            repeat_type: 'Daily',
            repeat_days: null,
            is_enabled: true,
            notification_status: 'Upcoming'
        };

        const createRes = await axios.post('https://nutrisnapai.onrender.com/reminders', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Create successful:", createRes.data);

        const getRes = await axios.get('https://nutrisnapai.onrender.com/reminders', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Get reminders:", getRes.data);

    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
test();
