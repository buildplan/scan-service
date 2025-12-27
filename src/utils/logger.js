// src/utils/logger.js
const levels = { debug: 0, info: 1, warn: 2, error: 3 };
const configLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
const currentLevel = levels[configLevel] !== undefined ? levels[configLevel] : levels.info;

const logger = {
    debug: (...args) => currentLevel <= levels.debug && console.log(new Date().toISOString(), '[DEBUG]', ...args),
    info: (...args) => currentLevel <= levels.info && console.log(new Date().toISOString(), '[INFO]', ...args),
    warn: (...args) => currentLevel <= levels.warn && console.warn(new Date().toISOString(), '[WARN]', ...args),
    error: (...args) => currentLevel <= levels.error && console.error(new Date().toISOString(), '[ERROR]', ...args),

    // Helper to map our log level to Lighthouse's expected format
    getLighthouseLevel: () => {
        if (configLevel === 'debug') return 'info'; // Lighthouse 'info' is very verbose
        if (configLevel === 'error') return 'error';
        return 'error'; // Default to quiet for Lighthouse
    }
};

module.exports = logger;
