// Focus Creature - Onboarding Module

const OnboardingModule = {
    init() {
        const startBtn = document.getElementById('btn-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.completeOnboarding());
        }
    },

    async completeOnboarding() {
        const user = await UserDB.getOrCreate();

        // Ensure settings object exists
        if (!user.settings) {
            user.settings = {};
        }

        user.settings.onboardingComplete = true;
        await UserDB.update(user);

        Navigation.showNav();
        Navigation.navigateTo('home');
    },

    async checkOnboardingStatus() {
        const user = await UserDB.getOrCreate();

        // Return false if settings don't exist or onboarding not complete
        return user.settings && user.settings.onboardingComplete === true;
    }
};
