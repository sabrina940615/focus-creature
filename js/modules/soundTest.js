// Focus Creature - Sound Test Module

const SoundTestModule = {
    currentStep: 1,
    selectedEnv: null,
    soundLevel: null, // Auto-defined based on environment
    audioElement: null,
    audioElementAmbience: null, // For cafe ambience track

    init() {
        // Environment selection
        document.querySelectorAll('.env-option').forEach(opt => {
            opt.addEventListener('click', () => this.selectEnvironment(opt.dataset.env));
        });

        // Pre-test options removed - soundLevel is auto-defined based on environment

        // Finish button
        document.getElementById('btn-finish-test')?.addEventListener('click', () => {
            Navigation.navigateTo('home');
            this.reset();
        });

        // Initialize game
        focusGame.init((results) => this.onGameComplete(results));
    },

    reset() {
        this.currentStep = 1;
        this.selectedEnv = null;
        this.soundLevel = null;
        this.stopAudio();

        document.querySelectorAll('.sound-step').forEach((step, i) => {
            step.classList.toggle('active', i === 0);
        });
        document.querySelectorAll('.env-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        focusGame.reset();
    },

    selectEnvironment(env) {
        this.selectedEnv = env;

        // Auto-define soundLevel based on environment
        // Cafe = noisy (3), Library = quiet (1)
        this.soundLevel = env === 'cafe' ? 3 : 1;

        document.querySelectorAll('.env-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.env === env);
        });

        // Start audio and go directly to game (skip step 2)
        setTimeout(() => {
            this.playAudio(env);
            this.goToStep(3);
        }, 500);
    },

    playAudio(env) {
        this.stopAudio();

        if (env === 'cafe') {
            // Play both jazz music and ambience for cafe
            this.audioElement = document.getElementById('audio-cafe');
            this.audioElementAmbience = document.getElementById('audio-cafe-ambience');

            if (this.audioElement) {
                this.audioElement.volume = 0.4; // Jazz music slightly lower
                this.audioElement.play().catch(e => console.log('Audio play failed:', e));
            }
            if (this.audioElementAmbience) {
                this.audioElementAmbience.volume = 0.3; // Ambience as background
                this.audioElementAmbience.play().catch(e => console.log('Ambience play failed:', e));
            }
        } else {
            // Library - just one audio track
            this.audioElement = document.getElementById(`audio-${env}`);
            if (this.audioElement) {
                this.audioElement.volume = 0.5;
                this.audioElement.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    },

    stopAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        if (this.audioElementAmbience) {
            this.audioElementAmbience.pause();
            this.audioElementAmbience.currentTime = 0;
        }
    },

    goToStep(step) {
        this.currentStep = step;
        document.querySelectorAll('.sound-step').forEach((s, i) => {
            s.classList.toggle('active', i === step - 1);
        });
    },

    async onGameComplete(results) {
        this.stopAudio();

        // Save game results
        const user = await UserDB.getOrCreate();

        await GameDB.add({
            userId: user.id,
            timestamp: new Date().toISOString(), // 添加時間戳
            soundEnvironment: this.selectedEnv,
            soundLevel: this.soundLevel, // Auto-defined: cafe=3, library=1
            accuracy: parseFloat(results.accuracy),
            errorRate: parseFloat(results.errorRate),
            avgReactionTime: results.avgReactionTime,
            errorDistribution: results.errorDistribution,
            totalCorrect: results.totalCorrect,
            totalErrors: results.totalErrors,
            totalMisses: results.totalMisses
        });

        // No environment logs needed - creature unlock based on GameDB

        // Check for creature unlock
        await checkCreatureUnlock(user.id, 'sound');

        // Display results
        this.displayResults(results);
        this.goToStep(4);
    },

    displayResults(results) {
        document.getElementById('result-reaction').textContent = `${results.avgReactionTime}ms`;
        document.getElementById('result-accuracy').textContent = `${results.accuracy}%`;
        document.getElementById('result-error').textContent = `${results.errorRate}%`;

        // Show creature based on auto-defined soundLevel
        const creatureEl = document.getElementById('sound-creature');
        const variant = this.soundLevel <= 1.5 ? 'quiet' : (this.soundLevel <= 2.5 ? 'steady' : 'noisy');
        const creature = CREATURE_DEFINITIONS.sound[variant];

        creatureEl.textContent = creature.emoji;
        creatureEl.style.background = creature.color;

        // Update creature name and intro
        document.querySelector('.creature-name').textContent = creature.name;
        const introEl = document.getElementById('creature-intro');
        if (introEl) {
            introEl.innerHTML = `
                <p class="intro-text">
                    🎉 <strong>恭喜解鎖新的小生物!</strong><br><br>
                    <strong>${creature.name}</strong><br>
                    ${creature.personality}<br><br>
                    這隻小生物代表你在${this.selectedEnv === 'cafe' ? '咖啡廳' : '圖書館'}環境下的專注特質。
                </p>
            `;
        }
    },

    getTimePeriod() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    }
};
