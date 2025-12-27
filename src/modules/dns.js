const axios = require('axios');

async function checkDNS(domain) {
    try {
        // This assumes your DNS container is named 'wiredalter-dns' in Docker network
        // Or you can use the public URL: https://dns.wiredalter.com/api/lookup/...
        const res = await axios.get(`https://dns.wiredalter.com/api/lookup/${domain}`);
        return res.data;
    } catch (e) {
        return { error: 'DNS Lookup Failed' };
    }
}

module.exports = { checkDNS };
