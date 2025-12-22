// Focus Creature - IndexedDB Database Module

const DB_NAME = 'FocusCreatureDB';
const DB_VERSION = 1;

const STORES = {
    USERS: 'users',
    ENVIRONMENT_LOGS: 'environmentLogs',
    TASK_SESSIONS: 'taskSessions',
    GAME_RESULTS: 'gameResults',
    CREATURES: 'creatures'
};

let db = null;

// Initialize Database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Users Store
            if (!database.objectStoreNames.contains(STORES.USERS)) {
                const usersStore = database.createObjectStore(STORES.USERS, { keyPath: 'id' });
                usersStore.createIndex('username', 'username', { unique: true });
            }

            // Environment Logs Store
            if (!database.objectStoreNames.contains(STORES.ENVIRONMENT_LOGS)) {
                const envStore = database.createObjectStore(STORES.ENVIRONMENT_LOGS, { keyPath: 'id' });
                envStore.createIndex('userId', 'userId', { unique: false });
                envStore.createIndex('sessionId', 'sessionId', { unique: false });
                envStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Task Sessions Store
            if (!database.objectStoreNames.contains(STORES.TASK_SESSIONS)) {
                const taskStore = database.createObjectStore(STORES.TASK_SESSIONS, { keyPath: 'id' });
                taskStore.createIndex('userId', 'userId', { unique: false });
                taskStore.createIndex('startTime', 'startTime', { unique: false });
            }

            // Game Results Store
            if (!database.objectStoreNames.contains(STORES.GAME_RESULTS)) {
                const gameStore = database.createObjectStore(STORES.GAME_RESULTS, { keyPath: 'id' });
                gameStore.createIndex('userId', 'userId', { unique: false });
                gameStore.createIndex('playedAt', 'playedAt', { unique: false });
            }

            // Creatures Store
            if (!database.objectStoreNames.contains(STORES.CREATURES)) {
                const creaturesStore = database.createObjectStore(STORES.CREATURES, { keyPath: 'id' });
                creaturesStore.createIndex('userId', 'userId', { unique: false });
                creaturesStore.createIndex('creatureType', 'creatureType', { unique: false });
            }
        };
    });
}

// Generate UUID
function generateId() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

// Generic CRUD Operations
const Database = {
    // Add record
    add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            data.id = data.id || generateId();
            const request = store.add(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    },

    // Get by ID
    get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get all records
    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get by index
    getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Update record
    update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    },

    // Delete record
    delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Count records
    count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// User specific operations
const UserDB = {
    async getOrCreate() {
        const users = await Database.getAll(STORES.USERS);
        if (users.length > 0) {
            return users[0];
        }
        const newUser = {
            id: generateId(),
            username: 'Player',
            createdAt: new Date().toISOString(),
            totalFocusTime: 0,
            creatureCount: 0,
            settings: { onboardingComplete: false }
        };
        return Database.add(STORES.USERS, newUser);
    },

    async update(userData) {
        return Database.update(STORES.USERS, userData);
    }
};

// Environment Logs operations
const EnvLogDB = {
    async add(logData) {
        logData.timestamp = new Date().toISOString();
        return Database.add(STORES.ENVIRONMENT_LOGS, logData);
    },

    async getByUser(userId) {
        return Database.getByIndex(STORES.ENVIRONMENT_LOGS, 'userId', userId);
    },

    async countByType(userId) {
        const logs = await this.getByUser(userId);
        return {
            light: logs.length,
            sound: logs.length,
            temperature: logs.length
        };
    }
};

// Task Sessions operations
const TaskDB = {
    async add(taskData) {
        return Database.add(STORES.TASK_SESSIONS, taskData);
    },

    async getByUser(userId) {
        return Database.getByIndex(STORES.TASK_SESSIONS, 'userId', userId);
    },

    async getTotalTime(userId) {
        const sessions = await this.getByUser(userId);
        return sessions.reduce((total, s) => total + (s.actualDuration || 0), 0);
    }
};

// Game Results operations
const GameDB = {
    async add(gameData) {
        gameData.playedAt = new Date().toISOString();
        return Database.add(STORES.GAME_RESULTS, gameData);
    },

    async getByUser(userId) {
        return Database.getByIndex(STORES.GAME_RESULTS, 'userId', userId);
    }
};

// Creatures operations
const CreatureDB = {
    async add(creatureData) {
        creatureData.unlockedAt = new Date().toISOString();
        return Database.add(STORES.CREATURES, creatureData);
    },

    async getByUser(userId) {
        return Database.getByIndex(STORES.CREATURES, 'userId', userId);
    },

    async getByType(userId, type) {
        const creatures = await this.getByUser(userId);
        return creatures.filter(c => c.creatureType === type);
    },

    async count(userId) {
        const creatures = await this.getByUser(userId);
        return creatures.length;
    }
};
