const chromeLauncher = require('chrome-launcher');
const Wappalyzer = require('wappalyzer');
const logger = require('../utils/logger');

async function runDeepScan(domain) {
    const url = `https://${domain}`;
    let chrome;

    try {
        const lighthouse = (await import('lighthouse')).default;

        logger.debug(`Launching Chrome for ${domain}...`);
        chrome = await chromeLauncher.launch({
            chromeFlags: [
                '--headless',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox'
            ],
            chromePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });

        const options = {
            logLevel: logger.getLighthouseLevel ? logger.getLighthouseLevel() : 'error',
            output: 'json',
            onlyCategories: ['performance', 'seo', 'accessibility'],
            port: chrome.port
        };

        logger.debug(`Lighthouse starting for ${url} on port ${chrome.port}`);

        const runnerResult = await lighthouse(url, options);
        const report = runnerResult.lhr;

        logger.debug(`Wappalyzer analyzing ${url}...`);
        const wappalyzer = new Wappalyzer(options);
        await wappalyzer.init();
        const site = await wappalyzer.open(url);
        const techResults = await site.analyze();
        await wappalyzer.destroy();

        return {
            performance: report.categories.performance.score * 100,
            seo: report.categories.seo.score * 100,
            accessibility: report.categories.accessibility.score * 100,
            screenshot: report.audits['final-screenshot']?.details?.data,
            tech: techResults.technologies
        };

    } catch (error) {
        logger.error(`Deep Scan Failed for ${domain}:`, error.message);
        throw error;
    } finally {
        if (chrome) await chrome.kill();
    }
}

module.exports = { runDeepScan };
