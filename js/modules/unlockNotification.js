// Focus Creature - Unlock Notification Module

// Show unlock notification
function showUnlockNotification(creature, isComposite = false) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'unlock-notification show';

    const title = isComposite ? '🎉 稀有精靈解鎖！' : '✨ 新精靈解鎖！';
    const subtitle = isComposite ? '你已收集全部基礎精靈，解鎖合成精靈！' : '紀錄你的專注偏好';

    notification.innerHTML = `
        <div class="unlock-card">
            <div class="unlock-header">
                <h3>${title}</h3>
                <p>${subtitle}</p>
            </div>
            <div class="unlock-creature">
                <div class="creature-emoji" style="background: ${creature.color}">
                    ${creature.emoji}
                </div>
                <div class="creature-info">
                    <h4 class="creature-name">${creature.name}</h4>
                    <p class="creature-type">${getTypeName(creature.creatureType)}</p>
                    <p class="creature-personality">${creature.personality}</p>
                </div>
            </div>
            <button class="pixel-btn primary" onclick="closeUnlockNotification()">查看圖鑑</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-scroll notification into view
    setTimeout(() => {
        notification.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Close unlock notification
function closeUnlockNotification() {
    const notification = document.querySelector('.unlock-notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);

        // Navigate to collection page
        if (typeof Navigation !== 'undefined') {
            Navigation.navigateTo('collection');
        }
    }
}
