// Focus Creature - Collection Module

const CollectionModule = {
    currentTab: 'all',

    init() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
                this.refresh();
            });
        });

        // Add close button handler for detail modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-detail-modal')) {
                this.hideCreatureDetail();
            }
        });
    },

    async refresh() {
        const user = await UserDB.getOrCreate();
        const creatures = await CreatureDB.getByUser(user.id);
        const grid = document.getElementById('collection-grid');

        // Get all possible creatures for locked display
        const allPossible = this.getAllPossibleCreatures();

        // Filter by tab
        let possibleFiltered = allPossible;
        if (this.currentTab !== 'all') {
            possibleFiltered = allPossible.filter(c => c.creatureType === this.currentTab);
        }

        // Track unlocked variants
        const unlockedVariants = new Set(creatures.map(c => `${c.creatureType}-${c.variant}`));

        let html = '';
        let unlockedCount = 0;

        // Display all possible creatures (unlocked first, then locked)
        possibleFiltered.forEach(possibleCreature => {
            const key = `${possibleCreature.creatureType}-${possibleCreature.variant}`;
            const unlockedCreature = creatures.find(c =>
                c.creatureType === possibleCreature.creatureType &&
                c.variant === possibleCreature.variant
            );

            if (unlockedCreature) {
                // Show unlocked creature
                html += createCreatureCard(unlockedCreature, false);
                unlockedCount++;
            } else {
                // Show locked creature
                html += createCreatureCard({
                    ...possibleCreature,
                    name: '???',
                    personality: '尚未解鎖'
                }, true);
            }
        });

        // Update progress display
        this.updateProgress(unlockedCount, possibleFiltered.length);

        grid.innerHTML = html || '<p class="no-data">尚未收集任何小生物</p>';

        // Add click handlers to creature cards
        grid.querySelectorAll('.creature-card:not(.locked)').forEach(card => {
            card.addEventListener('click', () => {
                const creatureId = card.dataset.id;
                if (creatureId) {
                    const creature = creatures.find(c => c.id === creatureId);
                    if (creature) {
                        this.showCreatureDetail(creature);
                    }
                }
            });
        });
    },

    updateProgress(unlocked, total) {
        const pageHeader = document.querySelector('#page-collection .page-header');
        let progressEl = pageHeader.querySelector('.unlock-progress');

        if (!progressEl) {
            progressEl = document.createElement('div');
            progressEl.className = 'unlock-progress';
            pageHeader.appendChild(progressEl);
        }

        const percentage = Math.round((unlocked / total) * 100);
        progressEl.innerHTML = `
            <div class="progress-text">已收集 ${unlocked} / ${total}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    },

    getAllPossibleCreatures() {
        const all = [];

        ['light', 'sound', 'temperature'].forEach(type => {
            Object.entries(CREATURE_DEFINITIONS[type]).forEach(([variant, def]) => {
                all.push({
                    creatureType: type,
                    variant,
                    emoji: def.emoji,
                    name: def.name,
                    color: def.color,
                    personality: def.personality
                });
            });
        });

        // Add composite creatures
        Object.entries(CREATURE_DEFINITIONS.composite).forEach(([variant, def]) => {
            all.push({
                creatureType: 'composite',
                variant,
                emoji: def.emoji,
                name: def.name,
                color: def.color,
                personality: def.personality
            });
        });

        return all;
    },

    async showCreatureDetail(creature) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'creature-detail-modal';

        if (creature.creatureType === 'composite') {
            // Get source creatures for display
            const user = await UserDB.getOrCreate();
            const allCreatures = await CreatureDB.getByUser(user.id);

            const sourceLight = allCreatures.find(c => c.id === creature.sourceCreatures?.lightId);
            const sourceSound = allCreatures.find(c => c.id === creature.sourceCreatures?.soundId);
            const sourceTemp = allCreatures.find(c => c.id === creature.sourceCreatures?.temperatureId);

            const lightScore = creature.environmentParams?.light?.averageScore || 0;
            const soundScore = creature.environmentParams?.sound?.averageScore || 0;
            const tempScore = creature.environmentParams?.temperature?.averageScore || 0;

            // Get environment values (1-3)
            const lightEnv = creature.environmentParams?.light?.environment || 2;
            const soundEnv = creature.environmentParams?.sound?.environment || 2;
            const tempEnv = creature.environmentParams?.temperature?.environment || 2;

            // Get environment descriptions
            const lightDesc = this.getEnvironmentName('light', lightEnv);
            const soundDesc = this.getEnvironmentName('sound', soundEnv);
            const tempDesc = this.getEnvironmentName('temperature', tempEnv);

            // Composite creature detail
            modal.innerHTML = `
                <div class="detail-modal-content">
                    <button class="close-detail-modal">✕</button>
                    <div class="detail-header">
                        <div class="detail-creature-display" style="background: ${creature.color}">
                            ${creature.emoji}
                        </div>
                        <h2>${creature.name}</h2>
                        <p class="detail-personality">${creature.personality}</p>
                    </div>
                    <div class="detail-body">
                        <div class="source-creatures-section">
                            <h3>合成來源</h3>
                            <div class="source-creatures-grid">
                                <div class="source-creature-item">
                                    <div class="source-creature-icon" style="background: ${sourceLight?.color || '#f0f0f0'}">
                                        ${sourceLight?.emoji || '❓'}
                                    </div>
                                    <div class="source-creature-name">${sourceLight?.name || '未知'}</div>
                                </div>
                                <div class="source-creature-item">
                                    <div class="source-creature-icon" style="background: ${sourceSound?.color || '#f0f0f0'}">
                                        ${sourceSound?.emoji || '❓'}
                                    </div>
                                    <div class="source-creature-name">${sourceSound?.name || '未知'}</div>
                                </div>
                                <div class="source-creature-item">
                                    <div class="source-creature-icon" style="background: ${sourceTemp?.color || '#f0f0f0'}">
                                        ${sourceTemp?.emoji || '❓'}
                                    </div>
                                    <div class="source-creature-name">${sourceTemp?.name || '未知'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="focus-score-section">
                            <div class="score-header">
                                <h3>綜合專注分數</h3>
                                <button class="score-help-btn" title="查看說明">❓</button>
                            </div>
                            <div class="score-display">${creature.focusScore || 0}</div>
                            <div class="score-label">分</div>
                        </div>
                        <div class="radar-chart-section">
                            <div class="radar-header">
                                <h3>環境數據雷達圖</h3>
                                <button class="radar-help-btn" title="查看說明">❓</button>
                            </div>
                            <canvas id="creature-radar-chart" width="300" height="300"></canvas>
                            <div class="radar-scores">
                                <div class="radar-score-item">
                                    <span class="score-label-text">${lightDesc}：</span>
                                    <span class="score-value">${Math.round(lightScore)}分</span>
                                </div>
                                <div class="radar-score-item">
                                    <span class="score-label-text">${soundDesc}：</span>
                                    <span class="score-value">${Math.round(soundScore)}分</span>
                                </div>
                                <div class="radar-score-item">
                                    <span class="score-label-text">${tempDesc}：</span>
                                    <span class="score-value">${Math.round(tempScore)}分</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add help button handlers
            modal.querySelector('.radar-help-btn').addEventListener('click', () => {
                this.showRadarHelp();
            });

            modal.querySelector('.score-help-btn').addEventListener('click', () => {
                this.showScoreHelp(creature);
            });

            setTimeout(() => this.drawRadarChart(creature), 100);
        } else {
            // Basic creature (sound, light, temperature) detail
            const envValue = creature.environmentParams?.environment || 2;
            const avgScore = creature.environmentParams?.averageScore || 0;
            const testCount = creature.environmentParams?.totalTests || 0;

            const envName = this.getEnvironmentName(creature.creatureType, envValue);
            const typeName = getTypeName(creature.creatureType);

            modal.innerHTML = `
                <div class="detail-modal-content">
                    <button class="close-detail-modal">✕</button>
                    <div class="detail-header">
                        <div class="detail-creature-display" style="background: ${creature.color}">
                            ${creature.emoji}
                        </div>
                        <h2>${creature.name}</h2>
                        <p class="detail-personality">${creature.personality}</p>
                    </div>
                    <div class="detail-body">
                        <div class="env-attribute-section">
                            <h3>環境偵測屬性</h3>
                            <div class="attribute-card">
                                <div class="attribute-label">${typeName}</div>
                                <div class="attribute-value">${envName}</div>
                            </div>
                        </div>
                        <div class="focus-score-section">
                            <h3>專注分數 <button class="basic-score-help-btn">❓</button></h3>
                            <div class="score-display">${Math.round(avgScore)}</div>
                            <div class="score-label">分</div>
                        </div>
                        ${creature.creatureType === 'sound' ? `<div class="test-count-section">
                            <p class="test-count-text">基於 ${testCount} 次測驗數據</p>
                        </div>` : ''}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add help button handler for basic creatures
            const helpBtn = modal.querySelector('.basic-score-help-btn');
            if (helpBtn) {
                helpBtn.addEventListener('click', () => {
                    this.showBasicScoreHelp(creature);
                });
            }
        }
    },

    hideCreatureDetail() {
        const modal = document.querySelector('.creature-detail-modal');
        if (modal) {
            modal.remove();
        }
    },

    drawRadarChart(creature) {
        const canvas = document.getElementById('creature-radar-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = 150;
        const centerY = 150;
        const maxRadius = 120;

        // Get environment values from source creatures
        const lightEnv = creature.environmentParams?.light?.environment || 2;
        const soundEnv = creature.environmentParams?.sound?.environment || 2;
        const tempEnv = creature.environmentParams?.temperature?.environment || 2;

        // Normalize to 0-3 scale for radar (1-3 -> 0.33-1.0)
        const values = [
            lightEnv / 3,   // Light
            soundEnv / 3,   // Sound  
            tempEnv / 3     // Temperature
        ];

        const labels = ['光線', '聲音', '溫度'];
        const angleStep = (Math.PI * 2) / 3;

        // Clear canvas
        ctx.clearRect(0, 0, 300, 300);

        // Draw background circles
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (maxRadius / 3) * i, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = '#d0d0d0';
        for (let i = 0; i < 3; i++) {
            const angle = angleStep * i - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * maxRadius,
                centerY + Math.sin(angle) * maxRadius
            );
            ctx.stroke();
        }

        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 3; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const labelRadius = maxRadius + 20;
            ctx.fillText(
                labels[i],
                centerX + Math.cos(angle) * labelRadius,
                centerY + Math.sin(angle) * labelRadius
            );
        }

        // Draw data polygon
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < 3; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const radius = maxRadius * values[i];
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#3498db';
        for (let i = 0; i < 3; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const radius = maxRadius * values[i];
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    getEnvironmentName(type, value) {
        const envMap = {
            sound: {
                1: '安靜',
                2: '穩定聲響',
                3: '多變吵雜'
            },
            light: {
                1: '偏暗',
                2: '剛好',
                3: '偏亮'
            },
            temperature: {
                1: '偏冷',
                2: '剛好',
                3: '偏熱'
            }
        };

        return envMap[type]?.[value] || '未知';
    },

    showRadarHelp() {
        // Create help modal
        const helpModal = document.createElement('div');
        helpModal.className = 'radar-help-modal';
        helpModal.innerHTML = `
            <div class="help-modal-content">
                <button class="close-help-modal">✕</button>
                <h3>🎯 雷達圖說明</h3>
                <div class="help-content">
                    <div class="help-section">
                        <h4>📊 數值範圍：1-3</h4>
                        <p>雷達圖顯示的是此合成小生物<strong>最適合的環境因素</strong>，數值越大代表越靠外圈。</p>
                    </div>
                    
                    <div class="help-section">
                        <h4>💡 三個維度的意義</h4>
                        <ul>
                            <li><strong>光線</strong>：1=偏暗、2=剛好、3=偏亮</li>
                            <li><strong>聲音</strong>：1=安靜、2=穩定聲響、3=多變吵雜</li>
                            <li><strong>溫度</strong>：1=偏冷、2=剛好、3=偏熱</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h4>🌟 如何解讀？</h4>
                        <p>雷達圖顯示你在哪種<strong>環境組合</strong>下專注表現最好：</p>
                        <ul>
                            <li>數值來自三個來源小生物的環境偏好</li>
                            <li>越靠外圈（數值越大）= 該環境因素越強烈</li>
                            <li>例如：聲音=3 表示你在吵雜環境下專注表現較好</li>
                        </ul>
                    </div>
                    
                    <div class="help-section score-guide">
                        <div class="env-example">
                            <strong>範例解讀</strong>
                            <p>如果雷達圖顯示：光線2、聲音1、溫度3</p>
                            <p>→ 你的最佳專注環境是：<br>「剛好的光線 + 安靜的環境 + 偏熱的溫度」</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // Add close handler
        helpModal.querySelector('.close-help-modal').addEventListener('click', () => {
            helpModal.remove();
        });

        // Close on background click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });
    },

    showScoreHelp(creature) {
        // Create help modal
        const helpModal = document.createElement('div');
        helpModal.className = 'radar-help-modal';

        const lightScore = Math.round(creature.environmentParams?.light?.averageScore || 0);
        const soundScore = Math.round(creature.environmentParams?.sound?.averageScore || 0);
        const tempScore = Math.round(creature.environmentParams?.temperature?.averageScore || 0);
        const totalScore = creature.focusScore || 0;

        helpModal.innerHTML = `
            <div class="help-modal-content">
                <button class="close-help-modal">✕</button>
                <h3>🎯 綜合專注分數說明</h3>
                <div class="help-content">
                    <div class="help-section">
                        <h4>📊 分數來源</h4>
                        <p>綜合專注分數是由三個來源小生物的專注分數平均計算而得：</p>
                        <div class="score-calculation">
                            <div class="calc-item">
                                <span class="calc-label">💡 光線小生物：</span>
                                <span class="calc-value">${lightScore} 分</span>
                            </div>
                            <div class="calc-item">
                                <span class="calc-label">🔊 聲音小生物：</span>
                                <span class="calc-value">${soundScore} 分</span>
                            </div>
                            <div class="calc-item">
                                <span class="calc-label">🌡️ 溫度小生物：</span>
                                <span class="calc-value">${tempScore} 分</span>
                            </div>
                            <div class="calc-divider"></div>
                            <div class="calc-result">
                                <span class="calc-label">平均分數：</span>
                                <span class="calc-value highlight">${totalScore} 分</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h4>🧮 計算公式</h4>
                        <p class="formula">綜合分數 = (光線分數 + 聲音分數 + 溫度分數) ÷ 3</p>
                        <p class="formula-example">範例：(${lightScore} + ${soundScore} + ${tempScore}) ÷ 3 = ${totalScore}</p>
                    </div>
                    
                    <div class="help-section">
                        <h4>💡 分數意義</h4>
                        <p>綜合專注分數代表你在<strong>所有環境維度</strong>下的整體專注表現：</p>
                        <ul>
                            <li><strong>高分（80+）</strong>：你在各種環境下都能保持良好專注</li>
                            <li><strong>中等（60-79）</strong>：整體表現不錯，但某些環境仍有提升空間</li>
                            <li><strong>待提升（0-59）</strong>：建議多在不同環境下練習，找出最適合自己的專注環境</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h4>🌟 如何提升？</h4>
                        <p>想要提升綜合分數，需要在光線、聲音、溫度三個維度都有良好表現。建議：</p>
                        <ul>
                            <li>在不同環境下進行聲音測驗和專注任務</li>
                            <li>找出你的最佳專注環境組合</li>
                            <li>針對分數較低的維度多加練習</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // Add close handler
        helpModal.querySelector('.close-help-modal').addEventListener('click', () => {
            helpModal.remove();
        });

        // Close on background click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });
    },

    showBasicScoreHelp(creature) {
        const helpModal = document.createElement('div');
        helpModal.className = 'radar-help-modal';

        const avgScore = Math.round(creature.environmentParams?.averageScore || 0);
        const testCount = creature.environmentParams?.totalTests || 0;
        const creatureType = creature.creatureType;

        // Different source explanation based on creature type
        let sourceTitle = '📊 分數來源';
        let sourceContent = '';

        if (creatureType === 'sound') {
            sourceTitle = '🔊 分數來源';
            sourceContent = `
                <p>此專注分數來自<strong>聲音測驗</strong>與<strong>專注任務</strong>的綜合評估：</p>
                <ul>
                    <li>共進行了 <strong>${testCount}</strong> 次聲音相關評估</li>
                    <li><strong>聲音測驗</strong>：測試您在特定聲音環境下的反應速度與準確性</li>
                    <li><strong>專注任務</strong>：記錄您在實際專注時的連續性與完成度</li>
                    <li>綜合分數反映了您在該聲音環境下的全面專注表現</li>
                </ul>
                <p style="margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <strong>📐 計算公式：</strong><br>
                    專注分數 = (聲音測驗分數 + 專注任務分數) / 2
                </p>
            `;
        } else if (creatureType === 'light') {
            sourceTitle = '💡 分數來源';
            sourceContent = `
                <p>此專注分數來自<strong>任務環境偵測</strong>：</p>
                <ul>
                    <li>在您進行專注任務時，系統自動偵測環境光線</li>
                    <li>記錄您在不同光線環境下的專注表現</li>
                    <li>分數反映了您在該光線條件下完成任務的品質</li>
                    <li>無需額外測驗，透過實際使用累積數據</li>
                </ul>
                <p style="margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <strong>📐 計算公式：</strong><br>
                    專注分數 = (連續性分數 + 完成度分數) / 2
                </p>
            `;
        } else if (creatureType === 'temperature') {
            sourceTitle = '🌡️ 分數來源';
            sourceContent = `
                <p>此專注分數來自<strong>任務環境偵測</strong>：</p>
                <ul>
                    <li>在您進行專注任務時，系統自動偵測環境溫度</li>
                    <li>記錄您在不同溫度環境下的專注表現</li>
                    <li>分數反映了您在該溫度條件下完成任務的品質</li>
                    <li>無需額外測驗，透過實際使用累積數據</li>
                </ul>
                <p style="margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <strong>📐 計算公式：</strong><br>
                    專注分數 = (連續性分數 + 完成度分數) / 2
                </p>
            `;
        }

        helpModal.innerHTML = `
            <div class="help-modal-content">
                <button class="close-help-modal">✕</button>
                <h3>🎯 專注分數說明</h3>
                <div class="help-content">
                    <div class="help-section">
                        <h4>${sourceTitle}</h4>
                        ${sourceContent}
                    </div>
                    
                    <div class="help-section">
                        <h4>📈 分數意義</h4>
                        <p>專注分數範圍為 <strong>0-100 分</strong>，代表您的專注表現水平：</p>
                        <div class="score-ranges">
                            <div class="score-range excellent">
                                <span class="range-label">優秀</span>
                                <span class="range-value">80-100 分</span>
                                <p class="range-desc">專注表現非常好，能在此環境保持高效專注</p>
                            </div>
                            <div class="score-range good">
                                <span class="range-label">良好</span>
                                <span class="range-value">60-79 分</span>
                                <p class="range-desc">專注表現不錯，此環境適合您工作</p>
                            </div>
                            <div class="score-range average">
                                <span class="range-label">待提升</span>
                                <span class="range-value">0-59 分</span>
                                <p class="range-desc">建議調整環境或多加練習以提升專注力</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h4>💡 如何提升分數？</h4>
                        <ul>
                            <li><strong>環境優化</strong>：嘗試微調環境參數找到最佳組合</li>
                            <li><strong>規律作息</strong>：保持良好的睡眠和精神狀態</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // Add close button handler
        helpModal.querySelector('.close-help-modal').addEventListener('click', () => {
            helpModal.remove();
        });

        // Close on background click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });
    }
};
