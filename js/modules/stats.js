// Focus Creature - Stats Module

const StatsModule = {
    async refresh() {
        const user = await UserDB.getOrCreate();

        // Draw radar chart
        const radarData = await calculateRadarData(user.id);
        if (radarData) {
            drawRadarChart('radar-chart', radarData);
        }

        // Generate insights
        const insights = await generateInsights(user.id);
        const insightsList = document.getElementById('insights-list');

        if (insights.length > 0 && insights[0] !== '累積更多數據即可獲得個人化洞察！') {
            insightsList.innerHTML = insights.map(i =>
                `<div class="insight-item">${i}</div>`
            ).join('');
        } else {
            insightsList.innerHTML = `<p class="no-data">${insights[0]}</p>`;
        }
    }
};
