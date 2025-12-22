// Focus Creature - Task Session Module

const TaskSessionModule = {
    currentStep: 'a',
    formData: {
        period: null,
        location: null,
        light: null,
        temperature: null,
        sound: null,
        duration: null,
        continuity: null,
        completion: null
    },
    timerInterval: null,
    timeRemaining: 0,
    totalDuration: 0,
    isPaused: false,

    init() {
        // Form options
        document.querySelectorAll('.form-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const field = opt.dataset.field;
                const value = opt.dataset.value;
                this.selectFormOption(field, value, opt);
            });
        });

        // Duration options
        document.querySelectorAll('.duration-option').forEach(opt => {
            opt.addEventListener('click', () => this.startTimer(parseInt(opt.dataset.duration)));
        });

        // Review options
        document.querySelectorAll('.review-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const field = opt.dataset.field;
                const value = opt.dataset.value;
                this.selectReviewOption(field, value, opt);
            });
        });

        // Buttons
        document.getElementById('btn-next-timer')?.addEventListener('click', () => this.goToStep('b'));
        document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btn-complete')?.addEventListener('click', () => this.completeTimer());
        document.getElementById('btn-submit-review')?.addEventListener('click', () => this.submitReview());
    },

    reset() {
        this.currentStep = 'a';
        this.formData = { period: null, location: null, light: null, temperature: null, sound: null, duration: null, continuity: null, completion: null };
        this.stopTimer();

        document.querySelectorAll('.task-step').forEach(step => {
            step.classList.toggle('active', step.id === 'task-step-a');
        });
        document.querySelectorAll('.form-option, .review-option').forEach(opt => opt.classList.remove('selected'));
        document.getElementById('btn-next-timer').disabled = true;
        document.getElementById('btn-submit-review').disabled = true;
    },

    selectFormOption(field, value, element) {
        this.formData[field] = value;

        // Toggle selection in same group
        element.parentElement.querySelectorAll('.form-option').forEach(opt => {
            opt.classList.toggle('selected', opt === element);
        });

        this.checkFormComplete();
    },

    selectReviewOption(field, value, element) {
        this.formData[field] = parseInt(value);

        element.parentElement.querySelectorAll('.review-option').forEach(opt => {
            opt.classList.toggle('selected', opt === element);
        });

        this.checkReviewComplete();
    },

    checkFormComplete() {
        const required = ['period', 'location', 'light', 'temperature', 'sound'];
        const complete = required.every(f => this.formData[f] !== null);
        document.getElementById('btn-next-timer').disabled = !complete;
    },

    checkReviewComplete() {
        const complete = this.formData.continuity !== null && this.formData.completion !== null;
        document.getElementById('btn-submit-review').disabled = !complete;
    },

    goToStep(step) {
        this.currentStep = step;
        document.querySelectorAll('.task-step').forEach(s => {
            s.classList.toggle('active', s.id === `task-step-${step}`);
        });
    },

    startTimer(minutes) {
        this.totalDuration = minutes;
        this.timeRemaining = minutes * 60;
        this.formData.duration = minutes;
        this.isPaused = false;

        // Hide setup, show timer
        document.querySelector('.timer-setup').classList.add('hidden');
        document.querySelector('.timer-display').classList.remove('hidden');

        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.timeRemaining--;
                this.updateTimerDisplay();

                if (this.timeRemaining <= 0) {
                    this.completeTimer();
                }
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const mins = Math.floor(this.timeRemaining / 60);
        const secs = this.timeRemaining % 60;

        document.getElementById('timer-minutes').textContent = mins.toString().padStart(2, '0');
        document.getElementById('timer-seconds').textContent = secs.toString().padStart(2, '0');

        // Update progress circle
        const progress = document.getElementById('timer-progress');
        const circumference = 565.48; // 2 * PI * 90
        const offset = circumference * (1 - this.timeRemaining / (this.totalDuration * 60));
        progress.style.strokeDashoffset = offset;
    },

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('btn-pause').textContent = this.isPaused ? '繼續' : '暫停';
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        document.querySelector('.timer-setup')?.classList.remove('hidden');
        document.querySelector('.timer-display')?.classList.add('hidden');
    },

    completeTimer() {
        this.stopTimer();
        this.goToStep('c');
    },

    async submitReview() {
        const user = await UserDB.getOrCreate();
        const actualDuration = (this.totalDuration * 60 - this.timeRemaining) / 60;

        // Save task session
        await TaskDB.add({
            userId: user.id,
            startTime: new Date(Date.now() - actualDuration * 60 * 1000).toISOString(),
            endTime: new Date().toISOString(),
            plannedDuration: this.totalDuration,
            actualDuration: Math.round(actualDuration),
            continuityScore: this.formData.continuity,
            completionScore: this.formData.completion
        });

        // Save environment log
        await EnvLogDB.add({
            userId: user.id,
            timePeriod: this.formData.period,
            locationType: this.formData.location,
            lightLevel: parseInt(this.formData.light),
            temperatureLevel: parseInt(this.formData.temperature),
            soundLevel: parseInt(this.formData.sound)
        });

        // Update user total time
        user.totalFocusTime = (user.totalFocusTime || 0) + Math.round(actualDuration);
        await UserDB.update(user);

        // Check for creature unlocks
        await checkCreatureUnlock(user.id, 'light');
        await checkCreatureUnlock(user.id, 'sound');
        await checkCreatureUnlock(user.id, 'temperature');
        await checkCompositeUnlock(user.id);

        // Navigate back and reset
        this.reset();
        Navigation.navigateTo('home');
    }
};
