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
        this.displayTimeout = null;
        this.timerInterval = null;
        this.onComplete = null;
        this.hasClickedCurrent = false;

        // 新參數：固定數字序列
        this.numberSequence = [];
        this.currentIndex = 0;
        this.TOTAL_NUMBERS = 50;      // 總共50個數字
        this.COUNT_OF_3 = 10;         // 10個數字3 (20%)
        this.ISI = 600;               // 出現間隔 0.6秒 (600ms)
        this.DISPLAY_TIME = 400;      // 顯示時間 0.4秒 (400ms)
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

    // 生成隨機數字序列（確保3不連續出現）
    generateSequence() {
        let sequence = [];

        // 加入10個數字3
        for (let i = 0; i < this.COUNT_OF_3; i++) {
            sequence.push(3);
        }

        // 加入40個非3數字 (1,2,4,5,6,7,8,9)
        const nonThrees = [1, 2, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < this.TOTAL_NUMBERS - this.COUNT_OF_3; i++) {
            sequence.push(nonThrees[Math.floor(Math.random() * nonThrees.length)]);
        }

        // 洗牌算法
        for (let i = sequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }

        // 確保3不連續出現
        let maxAttempts = 100;
        while (this.hasConsecutiveThrees(sequence) && maxAttempts > 0) {
            sequence = this.fixConsecutiveThrees(sequence);
            maxAttempts--;
        }

        return sequence;
    }

    // 檢查是否有連續的3
    hasConsecutiveThrees(sequence) {
        for (let i = 0; i < sequence.length - 1; i++) {
            if (sequence[i] === 3 && sequence[i + 1] === 3) {
                return true;
            }
        }
        return false;
    }

    // 修復連續的3
    fixConsecutiveThrees(sequence) {
        for (let i = 0; i < sequence.length - 1; i++) {
            if (sequence[i] === 3 && sequence[i + 1] === 3) {
                // 找一個非3的位置來交換
                for (let j = i + 2; j < sequence.length; j++) {
                    if (sequence[j] !== 3) {
                        // 確保交換後不會造成新的連續3
                        const canSwap = (j === 0 || sequence[j - 1] !== 3) &&
                            (j === sequence.length - 1 || sequence[j + 1] !== 3);
                        if (canSwap) {
                            [sequence[i + 1], sequence[j]] = [sequence[j], sequence[i + 1]];
                            break;
                        }
                    }
                }
            }
        }
        return sequence;
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
        this.numberSequence = [];
        this.currentIndex = 0;

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

        // 生成數字序列
        this.numberSequence = this.generateSequence();

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
        // Timer
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.gameTime.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.end();
            }
        }, 1000);

        // 開始顯示數字序列
        this.showNextNumber();
    }

    scheduleNextNumber() {
        // 固定間隔 0.6 秒
        this.numberInterval = setTimeout(() => {
            if (this.isRunning && this.currentIndex < this.TOTAL_NUMBERS) {
                // 如果是非3數字且沒有點擊，計為 miss
                if (!this.hasClickedCurrent && this.currentNumber !== null && this.currentNumber !== 3) {
                    this.missCount++;
                }
                this.showNextNumber();
            } else if (this.currentIndex >= this.TOTAL_NUMBERS) {
                // 所有數字已顯示完畢
                this.end();
            }
        }, this.ISI);
    }

    showNextNumber() {
        if (this.currentIndex >= this.TOTAL_NUMBERS) {
            this.end();
            return;
        }

        // 從預生成序列取數字
        this.currentNumber = this.numberSequence[this.currentIndex];
        this.currentIndex++;

        this.gameNumber.textContent = this.currentNumber;
        this.lastNumberTime = Date.now();
        this.hasClickedCurrent = false;
        this.gameArea.classList.remove('correct', 'error');

        // 追蹤出現的數字類型
        if (this.currentNumber === 3) {
            this.total3Numbers++;
        } else {
            this.totalNon3Numbers++;
        }

        // Set all numbers to black for better visibility
        this.gameNumber.style.color = '#000000';

        // 0.4秒後隱藏數字，開始下一個間隔
        this.displayTimeout = setTimeout(() => {
            if (this.isRunning) {
                this.gameNumber.textContent = '';
                this.scheduleNextNumber();
            }
        }, this.DISPLAY_TIME);
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

        // 視覺反饋後清除（不跳轉，保持固定時序）
        setTimeout(() => {
            this.gameArea.classList.remove('correct', 'error');
        }, 150);
    }

    end() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        clearTimeout(this.numberInterval);
        clearTimeout(this.displayTimeout);

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

