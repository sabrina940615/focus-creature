// Focus Creature - Statistics Helper Module

// Calculate radar chart data from environment logs
async function calculateRadarData(userId) {
    const logs = await EnvLogDB.getByUser(userId);

    if (logs.length === 0) {
        return null;
    }

    let lightTotal = 0, soundTotal = 0, tempTotal = 0;

    logs.forEach(log => {
        lightTotal += parseInt(log.lightLevel) || 2;
        soundTotal += parseInt(log.soundLevel) || 2;
        tempTotal += parseInt(log.temperatureLevel) || 2;
    });

    const count = logs.length;

    return {
        light: (lightTotal / count / 3 * 100).toFixed(1),
        sound: (soundTotal / count / 3 * 100).toFixed(1),
        temperature: (tempTotal / count / 3 * 100).toFixed(1)
    };
}

// Generate insights based on data
async function generateInsights(userId) {
    const logs = await EnvLogDB.getByUser(userId);
    const sessions = await TaskDB.getByUser(userId);
    const insights = [];

    if (logs.length < 3) {
        return ['累積更多數據即可獲得個人化洞察！'];
    }

    // Analyze preferred light
    const lightCounts = { 1: 0, 2: 0, 3: 0 };
    const soundCounts = { 1: 0, 2: 0, 3: 0 };
    const tempCounts = { 1: 0, 2: 0, 3: 0 };

    logs.forEach(log => {
        lightCounts[log.lightLevel]++;
        soundCounts[log.soundLevel]++;
        tempCounts[log.temperatureLevel]++;
    });

    // Light insight
    const maxLight = Object.entries(lightCounts).sort((a, b) => b[1] - a[1])[0];
    const lightLabels = { 1: '偏暗', 2: '適中', 3: '明亮' };
    insights.push(`💡 你偏好在 ${lightLabels[maxLight[0]]} 的環境中專注`);

    // Sound insight
    const maxSound = Object.entries(soundCounts).sort((a, b) => b[1] - a[1])[0];
    const soundLabels = { 1: '安靜', 2: '穩定背景音', 3: '有聲環境' };
    insights.push(`🔊 你最常在 ${soundLabels[maxSound[0]]} 的環境下工作`);

    // Temperature insight
    const maxTemp = Object.entries(tempCounts).sort((a, b) => b[1] - a[1])[0];
    const tempLabels = { 1: '涼爽', 2: '適中', 3: '溫暖' };
    insights.push(`🌡️ 你傾向選擇 ${tempLabels[maxTemp[0]]} 的溫度`);

    // Session productivity insight
    if (sessions.length >= 3) {
        const goodSessions = sessions.filter(s => s.completionScore === 1).length;
        const rate = (goodSessions / sessions.length * 100).toFixed(0);
        insights.push(`📊 你的完整專注率為 ${rate}%`);
    }

    return insights;
}

// Draw simple radar chart on canvas
function drawRadarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background circles
    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * i / 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Labels and data points
    const labels = [
        { label: '💡 光線', value: data.light },
        { label: '🔊 聲音', value: data.sound },
        { label: '🌡️ 溫度', value: data.temperature }
    ];

    const angles = labels.map((_, i) => (i * 2 * Math.PI / 3) - Math.PI / 2);

    // Draw axes
    ctx.strokeStyle = '#4a4a6a';
    angles.forEach(angle => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        ctx.stroke();
    });

    // Draw labels
    ctx.fillStyle = '#b8b8d0';
    ctx.font = '12px "Noto Sans TC"';
    ctx.textAlign = 'center';
    labels.forEach((item, i) => {
        const x = centerX + (radius + 25) * Math.cos(angles[i]);
        const y = centerY + (radius + 25) * Math.sin(angles[i]);
        ctx.fillText(item.label, x, y + 5);
    });

    // Draw data polygon
    ctx.beginPath();
    labels.forEach((item, i) => {
        const r = radius * (item.value / 100);
        const x = centerX + r * Math.cos(angles[i]);
        const y = centerY + r * Math.sin(angles[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Fill
    ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    labels.forEach((item, i) => {
        const r = radius * (item.value / 100);
        const x = centerX + r * Math.cos(angles[i]);
        const y = centerY + r * Math.sin(angles[i]);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#9b59b6';
        ctx.fill();
    });
}

// Format time display
function formatTime(minutes) {
    if (minutes < 60) return `${minutes} 分鐘`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小時 ${mins} 分鐘` : `${hours} 小時`;
}
