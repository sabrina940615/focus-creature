// Focus Creature - Inhibitory Control Game Module

class InhibitoryControlGame {
    constructor() {
        this.isRunning = false;
        this.timeLeft = 30;
        this.currentNumber = null;
        this.correctCount = 0;
        this.errorCount = 0;
        this.missCount = 0;
        this.totalNon3Numbers = 0; // 追蹤總共出現的非3數字數量
        this.total3Numbers = 0; // 追蹤總共出現的3數量
        this.reactionTimes = [];
        this.errorDistribution = { early: 0, mid: 0, late: 0 };
        this.lastNumberTime = 0;
        this.numberInterval = null;
        this.timerInterval = null;
        this.onComplete = null;
        this.hasClickedCurrent = false; // 追蹤當前數字是否已被點擊
    }

    init(onComplete) {
        this.onComplete = onComplete;
        this.gameArea = document.getElementById('game-area');
        this.gameNumber = document.getElementById('game-number');
        this.gameTime = document.getElementById('game-time');
        this.gameCorrect = document.getElementById('game-correct');
        this.gameError = document.getElementById('game-error');
        this.startBtn = document.getElementById('btn-start-game');

        this.startBtn.addEventListener('click', () => this.start());

        // 點擊事件 - 使用 pointerdown 替代 click，響應更快
        this.gameArea.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.handleClick();
        });

        // 備用觸控支援
        this.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick();
        }, { passive: false });
    }

    reset() {
        this.isRunning = false;
        this.timeLeft = 30;
        this.currentNumber = null;
        this.correctCount = 0;
        this.errorCount = 0;
        this.missCount = 0;
        this.totalNon3Numbers = 0;
        this.total3Numbers = 0;
        this.reactionTimes = [];
        this.errorDistribution = { early: 0, mid: 0, late: 0 };
        this.hasClickedCurrent = false;

        this.gameNumber.textContent = '準備';
        this.gameTime.textContent = '30';
        this.gameCorrect.textContent = '0';
        if (this.gameError) this.gameError.textContent = '0';
        this.startBtn.classList.remove('hidden');
        this.gameArea.classList.remove('correct', 'error');
    }

    start() {
        this.reset();
        this.isRunning = true;
        this.startBtn.classList.add('hidden');

        // Countdown with Chinese numbers
        const countdownNumbers = ['三', '二', '一'];
        let countdownIndex = 0;
        this.gameNumber.textContent = countdownNumbers[countdownIndex];

        const countdownInterval = setInterval(() => {
            countdownIndex++;
            if (countdownIndex < countdownNumbers.length) {
                this.gameNumber.textContent = countdownNumbers[countdownIndex];
            } else {
                clearInterval(countdownInterval);
                this.beginGame();
            }
        }, 1000);
    }

    beginGame() {
        this.showNextNumber();

        // Timer
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.gameTime.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.end();
            }
        }, 1000);

        // Show numbers at random intervals
        this.scheduleNextNumber();
    }

    scheduleNextNumber() {
        // 延長顯示時間：1200-2000ms，給用戶更多反應時間
        const delay = 1200 + Math.random() * 800;
        this.numberInterval = setTimeout(() => {
            if (this.isRunning) {
                // 如果是非3數字且沒有點擊，計為 miss
                if (!this.hasClickedCurrent && this.currentNumber !== null && this.currentNumber !== 3) {
                    this.missCount++;
                }
                this.showNextNumber();
                this.scheduleNextNumber();
            }
        }, delay);
    }

    showNextNumber() {
        // Generate random number 1-9
        this.currentNumber = Math.floor(Math.random() * 9) + 1;
        this.gameNumber.textContent = this.currentNumber;
        this.lastNumberTime = Date.now();
        this.hasClickedCurrent = false; // 重置點擊狀態
        this.gameArea.classList.remove('correct', 'error');

        // 追蹤出現的數字類型
        if (this.currentNumber === 3) {
            this.total3Numbers++;
        } else {
            this.totalNon3Numbers++;
        }

        // Set all numbers to black for better visibility
        this.gameNumber.style.color = '#000000';
    }

    handleClick() {
        if (!this.isRunning) return;

        // 如果已經點擊過當前數字，忽略重複點擊
        if (this.hasClickedCurrent || this.currentNumber === null) return;

        const reactionTime = Date.now() - this.lastNumberTime;
        this.hasClickedCurrent = true; // 標記已點擊

        if (this.currentNumber === 3) {
            // Error - clicked on 3
            this.errorCount++;
            if (this.gameError) this.gameError.textContent = this.errorCount;
            this.gameArea.classList.add('error');

            // Track error distribution (30 seconds total)
            const elapsed = 30 - this.timeLeft;
            if (elapsed < 10) this.errorDistribution.early++;
            else if (elapsed < 20) this.errorDistribution.mid++;
            else this.errorDistribution.late++;
        } else {
            // Correct - clicked on non-3
            this.correctCount++;
            this.reactionTimes.push(reactionTime);
            this.gameCorrect.textContent = this.correctCount;
            this.gameArea.classList.add('correct');
        }

        // 視覺反饋後清除並立即跳到下一個數字
        setTimeout(() => {
            this.gameArea.classList.remove('correct', 'error');
        }, 150);

        // 立即跳到下一個數字（清除當前計時器，立即顯示新數字）
        clearTimeout(this.numberInterval);
        setTimeout(() => {
            if (this.isRunning) {
                this.showNextNumber();
                this.scheduleNextNumber();
            }
        }, 50); // 極短延遲，幾乎立即切換
    }

    end() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        clearTimeout(this.numberInterval);

        const results = this.getResults();

        if (this.onComplete) {
            this.onComplete(results);
        }
    }

    getResults() {
        const avgReactionTime = this.reactionTimes.length > 0
            ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
            : 0;

        // 已完成判定的行為總數 = 正確點擊 + 誤點 + 漏點
        const completedBehaviors = this.correctCount + this.errorCount + this.missCount;

        // 全部數字出現的次數（包含未完成判定的）
        const totalNumbers = this.totalNon3Numbers + this.total3Numbers;

        // 使用已完成判定的數字作為分母
        const actualTotal = completedBehaviors;

        // 正確行為：
        // 1. 點擊非3數字（correctCount）
        // 2. 不點擊數字3（已完成判定的3數字中，沒誤點的部分）
        const correctNon3Clicks = this.correctCount;

        // 已判定的3數字 = 誤點的3數字 + 成功避開的3數字
        // 成功避開的3數字需要從已判定行為中推算
        // 已判定的總數 = correctCount + errorCount + missCount
        // 其中包含：正確點擊非3、漏點非3、誤點3、成功避開3
        // 成功避開3 = 已判定總數 - correctCount - errorCount - missCount + errorCount
        // 簡化：只計算顯式記錄的行為

        // 為了確保準確，我們從另一個角度計算：
        // 正確行為 = correctCount（正確點擊非3）+ 已判定的3中沒誤點的
        // 但由於判定機制，成功避開3的數量 = 在已判定範圍內的3 - 誤點的3

        // 更簡單的方法：
        // 錯誤行為 = missCount + errorCount
        // 正確行為 = actualTotal - 錯誤行為
        const totalErrorBehaviors = this.missCount + this.errorCount;
        const totalCorrectBehaviors = actualTotal - totalErrorBehaviors;

        // 正確率 = 正確行為次數 / 已完成判定的數字次數
        const accuracy = actualTotal > 0
            ? ((totalCorrectBehaviors / actualTotal) * 100).toFixed(1)
            : 0;

        // 錯誤率 = 錯誤行為次數 / 已完成判定的數字次數
        const errorRate = actualTotal > 0
            ? ((totalErrorBehaviors / actualTotal) * 100).toFixed(1)
            : 0;

        return {
            totalCorrect: this.correctCount,
            totalErrors: this.errorCount,
            totalMisses: this.missCount,
            totalNon3Numbers: this.totalNon3Numbers,
            total3Numbers: this.total3Numbers,
            totalNumbers: totalNumbers,
            avgReactionTime,
            errorRate,
            accuracy,
            errorDistribution: this.errorDistribution,
            reactionTimes: this.reactionTimes
        };
    }
}

// Global game instance
const focusGame = new InhibitoryControlGame();

