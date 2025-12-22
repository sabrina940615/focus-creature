// Focus Creature - Creature Generator Module

const CREATURE_TYPES = {
    LIGHT: 'light',
    SOUND: 'sound',
    TEMPERATURE: 'temperature',
    COMPOSITE: 'composite'
};

// Creature definitions with pixel art emojis and personalities
const CREATURE_DEFINITIONS = {
    // Light creatures
    light: {
        dim: { emoji: '🦉', name: '夜影貓頭鷹', personality: '偏好安靜暗處', color: '#4a4a6a' },
        normal: { emoji: '🐿️', name: '平衡松鼠', personality: '適應力強', color: '#8b6914' },
        bright: { emoji: '🌻', name: '陽光向日葵', personality: '活力充沛', color: '#ffd700' }
    },
    // Sound creatures
    sound: {
        quiet: { emoji: '🐢', name: '靜謐海龜', personality: '深沉思考者', color: '#2ecc71' },
        steady: { emoji: '🐝', name: '節奏蜜蜂', personality: '穩定工作者', color: '#f39c12' },
        noisy: { emoji: '🦜', name: '熱鬧鸚鵡', personality: '社交型專注', color: '#e74c3c' }
    },
    // Temperature creatures  
    temperature: {
        cold: { emoji: '🐧', name: '清涼企鵝', personality: '冷靜分析者', color: '#3498db' },
        normal: { emoji: '🦊', name: '舒適狐狸', personality: '自在隨和', color: '#e67e22' },
        hot: { emoji: '🌵', name: '耐熱仙人掌', personality: '堅韌不拔', color: '#27ae60' }
    },
    // Composite creatures (combinations)
    composite: {
        balanced: { emoji: '🦄', name: '和諧獨角獸', personality: '全面發展型', color: '#9b59b6' },
        introvert: { emoji: '🐉', name: '內斂神龍', personality: '深度專注型', color: '#1abc9c' },
        extrovert: { emoji: '🦋', name: '繽紛蝴蝶', personality: '環境適應型', color: '#e84393' }
    }
};

// Calculate focus score for sound test (0-100, higher is better)
function calculateSoundTestScore(game) {
    const accuracy = parseFloat(game.accuracy) || 0; // 正確率 0-100

    // 專注分數 = 正確率
    return accuracy;
}

// Calculate focus score for task session (0-100, higher is better)
function calculateTaskScore(task) {
    const continuity = parseInt(task.continuityScore) || 3; // 1-3, lower is better
    const completion = parseInt(task.completionScore) || 3; // 1-3, lower is better

    // Convert to 0-100 scale (invert so higher is better)
    // 1 (best) -> 100, 2 (medium) -> 66.7, 3 (worst) -> 33.3
    const continuityScore = ((4 - continuity) / 3) * 100;
    const completionScore = ((4 - completion) / 3) * 100;

    return (continuityScore + completionScore) / 2;
}

// Determine creature based on average values
function determineCreatureVariant(type, avgValue) {
    if (avgValue <= 1.5) return type === 'sound' ? 'quiet' : (type === 'light' ? 'dim' : 'cold');
    if (avgValue <= 2.5) return type === 'sound' ? 'steady' : 'normal';
    return type === 'sound' ? 'noisy' : (type === 'light' ? 'bright' : 'hot');
}

// Check if creature should be unlocked (needs 2+ data points)
async function checkCreatureUnlock(userId, type) {
    const existingCreatures = await CreatureDB.getByType(userId, type);

    // For sound type, use GameDB and TaskDB to calculate combined scores
    if (type === 'sound') {
        const games = await GameDB.getByUser(userId);
        const tasks = await TaskDB.getByUser(userId);

        if (games.length < 2) return null; // Need at least 2 game tests

        // Group by environment and calculate average scores
        const envScores = {};

        // Add sound test scores
        games.forEach(game => {
            const env = parseInt(game.soundLevel);
            const soundTestScore = calculateSoundTestScore(game);

            if (!envScores[env]) {
                envScores[env] = { soundTestScores: [], taskScores: [], total: 0, count: 0 };
            }
            envScores[env].soundTestScores.push(soundTestScore);
        });

        // Add task session scores for the same sound environments
        tasks.forEach(task => {
            const env = parseInt(task.soundEnvironment) || parseInt(task.soundLevel);
            if (env && envScores[env]) {
                const taskScore = calculateTaskScore(task);
                envScores[env].taskScores.push(taskScore);
            }
        });

        // Calculate combined average for each environment
        for (const env in envScores) {
            const data = envScores[env];

            // Average sound test score
            const avgSoundTest = data.soundTestScores.length > 0
                ? data.soundTestScores.reduce((a, b) => a + b, 0) / data.soundTestScores.length
                : 0;

            // Average task score (if any)
            const avgTask = data.taskScores.length > 0
                ? data.taskScores.reduce((a, b) => a + b, 0) / data.taskScores.length
                : 0;

            // Combined score: (sound test + task) / 2, or just sound test if no tasks
            if (data.taskScores.length > 0) {
                data.average = (avgSoundTest + avgTask) / 2;
            } else {
                data.average = avgSoundTest;
            }

            data.total = data.average;
            data.count = 1;
        }

        const environments = Object.keys(envScores);
        let bestEnv = null;
        let bestScore = -1;

        if (environments.length === 1) {
            // Same environment - check if score meets threshold
            const env = parseInt(environments[0]);
            const avgScore = envScores[env].average;

            if (avgScore >= 60) { // Threshold: 60 points
                bestEnv = env;
                bestScore = avgScore;
            } else {
                console.log(`Sound test score (${avgScore.toFixed(1)}) below threshold (60), no creature unlocked`);
                return null;
            }
        } else {
            // Different environments - compare performance
            for (const [env, data] of Object.entries(envScores)) {
                if (data.average > bestScore) {
                    bestScore = data.average;
                    bestEnv = parseInt(env);
                }
            }
        }

        if (bestEnv === null) return null;

        // Determine variant based on best environment
        const variant = determineCreatureVariant(type, bestEnv);
        const definition = CREATURE_DEFINITIONS[type][variant];

        // Check if this variant already exists
        const existing = existingCreatures.find(c => c.variant === variant);

        if (existing) {
            // Update data count and score
            existing.dataCount = games.length;
            existing.environmentParams = {
                environment: bestEnv,
                averageScore: bestScore,
                totalTests: games.length
            };
            await Database.update(STORES.CREATURES, existing);
            return { updated: true, creature: existing };
        }

        // Create new creature
        const newCreature = {
            userId,
            creatureType: type,
            variant,
            emoji: definition.emoji,
            name: definition.name,
            personality: definition.personality,
            color: definition.color,
            environmentParams: {
                environment: bestEnv,
                averageScore: bestScore,
                totalTests: games.length
            },
            dataCount: games.length,
            isActive: true
        };

        const savedCreature = await CreatureDB.add(newCreature);

        // Show unlock notification
        showUnlockNotification(savedCreature);

        console.log(`Unlocked ${definition.name} (env: ${bestEnv}, score: ${bestScore.toFixed(1)})`);
        return { created: true, creature: savedCreature };
    }

    // For other types (light, temperature), use EnvLogDB and TaskDB
    const logs = await EnvLogDB.getByUser(userId);
    const tasks = await TaskDB.getByUser(userId);

    if (logs.length < 2) return null;

    // Calculate average environment value for this type
    let total = 0;
    let fieldName = type === 'light' ? 'lightLevel' : 'temperatureLevel';

    logs.forEach(log => {
        total += parseInt(log[fieldName]) || 2;
    });

    const avg = total / logs.length;
    const variant = determineCreatureVariant(type, avg);
    const definition = CREATURE_DEFINITIONS[type][variant];

    // Calculate average focus score from task sessions
    let totalScore = 0;
    let scoreCount = 0;

    tasks.forEach(task => {
        const score = calculateTaskScore(task);
        totalScore += score;
        scoreCount++;
    });

    const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    // Check if this variant already exists
    const existing = existingCreatures.find(c => c.variant === variant);

    if (existing) {
        // Update data count and score
        existing.dataCount = logs.length;
        existing.environmentParams = {
            environment: Math.round(avg),
            averageScore: avgScore,
            totalTests: logs.length
        };
        await Database.update(STORES.CREATURES, existing);
        return { updated: true, creature: existing };
    }

    // Create new creature
    const newCreature = {
        userId,
        creatureType: type,
        variant,
        emoji: definition.emoji,
        name: definition.name,
        personality: definition.personality,
        color: definition.color,
        environmentParams: {
            environment: Math.round(avg),
            averageScore: avgScore,
            totalTests: logs.length
        },
        dataCount: logs.length,
        isActive: true
    };

    const savedCreature = await CreatureDB.add(newCreature);

    // Show unlock notification
    showUnlockNotification(savedCreature);

    return { created: true, creature: savedCreature };
}

// Check for composite creature unlock
async function checkCompositeUnlock(userId) {
    const creatures = await CreatureDB.getByUser(userId);
    const types = new Set(creatures.map(c => c.creatureType));

    // Need all 3 base types
    if (!types.has('light') || !types.has('sound') || !types.has('temperature')) {
        return null;
    }

    // Check if composite already exists
    const existingComposite = creatures.find(c => c.creatureType === 'composite');

    // Get the most recent creature of each type
    const lightCreatures = creatures.filter(c => c.creatureType === 'light');
    const soundCreatures = creatures.filter(c => c.creatureType === 'sound');
    const tempCreatures = creatures.filter(c => c.creatureType === 'temperature');

    const lightCreature = lightCreatures[lightCreatures.length - 1]; // Most recent
    const soundCreature = soundCreatures[soundCreatures.length - 1];
    const tempCreature = tempCreatures[tempCreatures.length - 1];

    // Determine composite type based on combinations
    let compositeVariant = 'balanced';

    const dimQuietCold = (lightCreature.variant === 'dim' || soundCreature.variant === 'quiet' || tempCreature.variant === 'cold');
    const brightNoisyHot = (lightCreature.variant === 'bright' || soundCreature.variant === 'noisy' || tempCreature.variant === 'hot');

    if (dimQuietCold && !brightNoisyHot) compositeVariant = 'introvert';
    else if (brightNoisyHot && !dimQuietCold) compositeVariant = 'extrovert';

    const definition = CREATURE_DEFINITIONS.composite[compositeVariant];

    // Calculate average focus score from the three source creatures
    const lightScore = lightCreature.environmentParams?.averageScore || 0;
    const soundScore = soundCreature.environmentParams?.averageScore || 0;
    const tempScore = tempCreature.environmentParams?.averageScore || 0;
    const averageFocusScore = Math.round((lightScore + soundScore + tempScore) / 3);

    const compositeCreature = {
        userId,
        creatureType: 'composite',
        variant: compositeVariant,
        emoji: definition.emoji,
        name: definition.name,
        personality: definition.personality,
        color: definition.color,
        environmentParams: {
            light: lightCreature.environmentParams,
            sound: soundCreature.environmentParams,
            temperature: tempCreature.environmentParams
        },
        sourceCreatures: {
            lightId: lightCreature.id,
            soundId: soundCreature.id,
            temperatureId: tempCreature.id
        },
        focusScore: averageFocusScore,
        dataCount: 0,
        isActive: true
    };

    if (existingComposite) {
        // Update existing composite with new data
        existingComposite.environmentParams = compositeCreature.environmentParams;
        existingComposite.sourceCreatures = compositeCreature.sourceCreatures;
        existingComposite.focusScore = compositeCreature.focusScore;
        existingComposite.variant = compositeVariant;
        existingComposite.emoji = definition.emoji;
        existingComposite.name = definition.name;
        existingComposite.personality = definition.personality;
        existingComposite.color = definition.color;

        await Database.update(STORES.CREATURES, existingComposite);
        return { updated: true, creature: existingComposite };
    }

    const savedCreature = await CreatureDB.add(compositeCreature);

    // Show unlock notification for special composite unlock
    showUnlockNotification(savedCreature, true);

    return { created: true, creature: savedCreature };
}

// Get creature display for home page
async function getMainCreature(userId) {
    const creatures = await CreatureDB.getByUser(userId);
    if (creatures.length === 0) return null;

    // Priority: composite > most recent
    const composite = creatures.find(c => c.creatureType === 'composite');
    if (composite) return composite;

    return creatures[creatures.length - 1];
}

// Generate creature card HTML
function createCreatureCard(creature, locked = false) {
    return `
        <div class="creature-card ${locked ? 'locked' : 'clickable-creature'}" data-id="${creature.id || ''}" style="${!locked ? 'cursor: pointer;' : ''}">
            <div class="creature-image" style="background: ${creature.color || 'var(--gradient-purple)'}">
                ${creature.emoji || '?'}
            </div>
            <div class="creature-card-name">${creature.name || '???'}</div>
            <span class="creature-type-badge">${getTypeName(creature.creatureType)}</span>
            ${!locked ? '<div class="click-hint">點擊查看詳情</div>' : ''}
        </div>
    `;
}

function getTypeName(type) {
    const names = { light: '光線', sound: '聲音', temperature: '溫度', composite: '合成' };
    return names[type] || type;
}
