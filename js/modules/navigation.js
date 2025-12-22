// Focus Creature - Navigation Module

const Navigation = {
    currentPage: 'onboarding',

    init() {
        // Top nav button clicks
        document.querySelectorAll('.top-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
            });
        });

        // Action card clicks on home
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                if (action === 'history') {
                    // Show focus history modal
                    if (typeof HomeModule !== 'undefined') {
                        HomeModule.showFocusHistory();
                    }
                } else if (action === 'sound-history') {
                    // Show sound test history modal
                    if (typeof HomeModule !== 'undefined') {
                        HomeModule.showSoundTestHistory();
                    }
                } else {
                    this.navigateTo(action);
                }
            });
        });
    },

    navigateTo(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
        }

        // Trigger page-specific init
        this.onPageEnter(pageName);
    },

    onPageEnter(pageName) {
        switch (pageName) {
            case 'home':
                if (typeof HomeModule !== 'undefined') HomeModule.refresh();
                break;
            case 'collection':
                if (typeof CollectionModule !== 'undefined') CollectionModule.refresh();
                break;
            case 'stats':
                if (typeof StatsModule !== 'undefined') StatsModule.refresh();
                break;
        }
    },

    showNav() {
        document.getElementById('top-nav').classList.remove('hidden');
    },

    hideNav() {
        document.getElementById('top-nav').classList.add('hidden');
    }
};
