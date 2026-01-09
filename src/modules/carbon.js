const { co2, hosting } = require('@tgwf/co2');
const axios = require('axios');

async function estimateCarbon(domain) {
    try {
        // 1. Get raw bytes (approximate via HEAD request)
        // A real lighthouse scan gives exact bytes, but for Tier 1 we estimate
        const res = await axios.get(`https://${domain}`, { timeout: 4000 });
        const bytes = parseInt(res.headers['content-length'] || 0) + (res.data ? res.data.length : 0);

        if (bytes === 0) return { co2: 0, green: false };

        // 2. Calculate
        const swd = new co2({ model: 'swd' });
        const emissions = swd.perByte(bytes);

        // 3. Check Green Hosting
        const greenCheck = await hosting.check(domain);

        return {
            co2: emissions.toFixed(3),
            green: greenCheck,
            bytes: bytes
        };
    } catch (e) {
        return { error: 'Could not estimate' };
    }
}

module.exports = { estimateCarbon };
