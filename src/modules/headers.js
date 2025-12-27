const axios = require('axios');

async function checkHeaders(domain) {
    try {
        const res = await axios.head(`https://${domain}`, {
            timeout: 5000,
            validateStatus: () => true // Don't throw on 404/500
        });

        const headers = res.headers;
        const missing = [];
        let score = 100;

        // Scoring Logic
        if (!headers['strict-transport-security']) { score -= 20; missing.push('HSTS'); }
        if (!headers['content-security-policy']) { score -= 20; missing.push('CSP'); }
        if (!headers['x-frame-options']) { score -= 10; missing.push('X-Frame-Options'); }
        if (!headers['x-content-type-options']) { score -= 10; missing.push('X-Content-Type-Options'); }
        if (headers['server']) { score -= 5; missing.push('Server Leak'); } // We shouldn't see 'nginx'

        // Determine Grade
        let grade = 'A';
        if (score < 90) grade = 'B';
        if (score < 70) grade = 'C';
        if (score < 50) grade = 'F';

        return {
            grade,
            score,
            missing,
            server: headers['server'] || 'Hidden'
        };
    } catch (error) {
        return { grade: 'F', error: 'Could not connect' };
    }
}

module.exports = { checkHeaders };
