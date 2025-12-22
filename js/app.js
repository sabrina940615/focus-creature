// Focus Creature - Main App Entry Point

// Home Module
const HomeModule = {
    async refresh() {
        const user = await UserDB.getOrCreate();

        // Update stats
        const totalTime = await TaskDB.getTotalTime(user.id);
        const creatureCount = await CreatureDB.count(user.id);
        const sessions = await TaskDB.getByUser(user.id);
        const games = await GameDB.getByUser(user.id);

        document.getElementById('stat-total-time').textContent = totalTime || 0;
        document.getElementById('stat-creatures').textContent = creatureCount || 0;
        // Count both task sessions and game tests
        document.getElementById('stat-sessions').textContent = (sessions.length + games.length) || 0;

        // Update main creature display
        const mainCreature = await getMainCreature(user.id);
        const creatureDisplay = document.getElementById('main-creature');

        if (mainCreature) {
            creatureDisplay.innerHTML = `
                <div class="creature-image" style="background: ${mainCreature.color}; width: 120px; height: 120px; font-size: 4rem;">
                    ${mainCreature.emoji}
                </div>
                <p style="font-family: var(--font-pixel); font-size: 0.8rem; margin-top: 16px; color: var(--accent-cyan);">
                    ${mainCreature.name}
                </p>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">
                    ${mainCreature.personality}
                </p>
            `;
        }
    },

    async showFocusHistory() {
        const user = await UserDB.getOrCreate();
        const sessions = await TaskDB.getByUser(user.id);
        const logs = await EnvLogDB.getByUser(user.id);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'history-modal';

        let historyHTML = '';

        if (sessions.length === 0) {
            historyHTML = '<p class="no-history">尚無專注紀錄，開始你的第一次專注吧！</p>';
        } else {
            // Sort sessions by date (newest first)
            const sortedSessions = [...sessions].sort((a, b) =>
                new Date(b.startTime) - new Date(a.startTime)
            );

            historyHTML = sortedSessions.map((session, index) => {
                const log = logs[index] || {};
                const date = new Date(session.startTime);
                const dateStr = date.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const timeStr = date.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const lightLabels = { 1: '偏暗', 2: '剛好', 3: '偏亮' };
                const soundLabels = { 1: '安靜', 2: '穩定聲響', 3: '多變吵雜' };
                const tempLabels = { 1: '偏冷', 2: '剛好', 3: '偏熱' };
                const continuityLabels = { 1: '連續完成', 2: '短暫切換', 3: '頻繁切換' };
                const completionLabels = { 1: '完成預期', 2: '部分完成', 3: '幾乎沒進展' };

                const focusScore = Math.round(
                    ((4 - (session.continuityScore || 3)) / 3 * 100 +
                        (4 - (session.completionScore || 3)) / 3 * 100) / 2
                );

                return `
                    <div class="history-item">
                        <div class="history-header">
                            <span class="history-date">${dateStr}</span>
                            <span class="history-time">${timeStr}</span>
                        </div>
                        <div class="history-duration">
                            <span class="duration-icon">⏱️</span>
                            <span>${session.actualDuration || session.plannedDuration} 分鐘</span>
                        </div>
                        <div class="history-env-tags">
                            <span class="env-tag light">💡 ${lightLabels[log.lightLevel] || '未知'}</span>
                            <span class="env-tag sound">🔊 ${soundLabels[log.soundLevel] || '未知'}</span>
                            <span class="env-tag temp">🌡️ ${tempLabels[log.temperatureLevel] || '未知'}</span>
                        </div>
                        <div class="history-scores">
                            <div class="score-item">
                                <span class="score-label">連續性</span>
                                <span class="score-value">${continuityLabels[session.continuityScore] || '未記錄'}</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">完成度</span>
                                <span class="score-value">${completionLabels[session.completionScore] || '未記錄'}</span>
                            </div>
                            <div class="score-item focus-score">
                                <span class="score-label">專注分數</span>
                                <span class="score-value">${focusScore} 分</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.innerHTML = `
            <div class="history-modal-content">
                <button class="close-history-modal">✕</button>
                <h3>📋 歷史專注紀錄</h3>
                <div class="history-list">
                    ${historyHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handlers
        modal.querySelector('.close-history-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    async showSoundTestHistory() {
        const user = await UserDB.getOrCreate();
        const games = await GameDB.getByUser(user.id);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'history-modal';

        let historyHTML = '';

        if (!games || games.length === 0) {
            historyHTML = '<p class="no-history">尚無聲音測驗紀錄，開始你的第一次測驗吧！</p>';
        } else {
            // Sort games by date (newest first)
            const sortedGames = [...games].sort((a, b) =>
                new Date(b.timestamp || b.id) - new Date(a.timestamp || a.id)
            );

            const envLabels = {
                'library': '📚 圖書館',
                'office': '🏢 辦公室',
                'cafe': '☕ 咖啡廳',
                1: '📚 圖書館',
                2: '🏢 辦公室',
                3: '☕ 咖啡廳'
            };

            historyHTML = sortedGames.map((game, index) => {
                let dateStr = '無日期記錄';
                let timeStr = '';

                if (game.timestamp) {
                    const date = new Date(game.timestamp);
                    if (!isNaN(date.getTime())) {
                        dateStr = date.toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        timeStr = date.toLocaleTimeString('zh-TW', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                }

                const envLabel = envLabels[game.soundEnvironment] || envLabels[game.soundLevel] || '未知環境';
                const accuracy = game.accuracy || 0;
                const errorRate = game.errorRate || 0;
                const avgReaction = game.avgReactionTime || 0;

                return `
                    <div class="history-item">
                        <div class="history-header">
                            <span class="history-date">${dateStr}</span>
                            <span class="history-time">${timeStr}</span>
                        </div>
                        <div class="history-env">
                            <span class="env-badge">${envLabel}</span>
                        </div>
                        <div class="history-scores">
                            <div class="score-item">
                                <span class="score-label">正確率</span>
                                <span class="score-value">${accuracy}%</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">錯誤率</span>
                                <span class="score-value">${errorRate}%</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">反應時間</span>
                                <span class="score-value">${avgReaction}ms</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.innerHTML = `
            <div class="history-modal-content">
                <button class="close-history-modal">✕</button>
                <h3>🎧 歷史聲音測驗紀錄</h3>
                <div class="history-list">
                    ${historyHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handlers
        modal.querySelector('.close-history-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    async resetAllData() {
        // 顯示確認對話框
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <h3>⚠️ 確認重置</h3>
                <p>此操作將刪除以下所有數據：</p>
                <ul>
                    <li>📋 所有專注任務紀錄</li>
                    <li>🎵 所有聲音測驗數據</li>
                    <li>🐾 所有圖鑑小生物</li>
                    <li>📊 用戶統計數據</li>
                </ul>
                <p class="warning-text">此操作無法復原！</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn cancel">取消</button>
                    <button class="confirm-btn delete">確認刪除</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 取消按鈕
        modal.querySelector('.cancel').addEventListener('click', () => {
            modal.remove();
        });

        // 確認刪除按鈕
        modal.querySelector('.delete').addEventListener('click', async () => {
            try {
                // 刪除所有數據表的內容
                const deleteStore = async (storeName) => {
                    return new Promise((resolve, reject) => {
                        const request = indexedDB.open('FocusCreatureDB');
                        request.onsuccess = (event) => {
                            const db = event.target.result;
                            const tx = db.transaction(storeName, 'readwrite');
                            const store = tx.objectStore(storeName);
                            const clearReq = store.clear();
                            clearReq.onsuccess = () => {
                                db.close();
                                resolve();
                            };
                            clearReq.onerror = () => reject(clearReq.error);
                        };
                        request.onerror = () => reject(request.error);
                    });
                };

                // 清空所有數據表
                await deleteStore('taskSessions');
                await deleteStore('environmentLogs');
                await deleteStore('gameResults');
                await deleteStore('creatures');

                // 重置用戶數據
                const user = await UserDB.getOrCreate();
                user.totalFocusTime = 0;
                await UserDB.update(user);

                modal.remove();

                // 顯示成功訊息
                alert('✅ 所有數據已成功刪除！');

                // 刷新頁面
                location.reload();
            } catch (error) {
                console.error('Reset failed:', error);
                alert('❌ 刪除失敗：' + error.message);
                modal.remove();
            }
        });

        // 點擊背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    init() {
        // 初始化重置按鈕
        const resetBtn = document.getElementById('btn-reset-all-data');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetAllData());
        }
    }
};

// App initialization
async function initApp() {
    try {
        // Initialize database
        await initDB();
        console.log('Database initialized');

        // Initialize all modules
        Navigation.init();
        OnboardingModule.init();
        SoundTestModule.init();
        TaskSessionModule.init();
        CollectionModule.init();
        HomeModule.init();

        // Check onboarding status
        const onboardingComplete = await OnboardingModule.checkOnboardingStatus();

        if (onboardingComplete) {
            Navigation.showNav();
            Navigation.navigateTo('home');
        } else {
            Navigation.hideNav();
            // Stay on onboarding page
        }

        console.log('Focus Creature App initialized!');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
