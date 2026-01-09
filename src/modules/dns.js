const axios = require('axios');

async function checkDNS(domain) {
    try {
	// DNS Lookup Service
        const res = await axios.get(`https://dns.wiredalter.com/api/lookup/${domain}`, {
            timeout: 4000 // Give up before the 5s server limit
        });
        return res.data;
    } catch (e) {
        return { error: 'DNS Lookup Failed' };
    }
}

module.exports = { checkDNS };
