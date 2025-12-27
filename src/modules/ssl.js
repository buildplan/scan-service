const tls = require('tls');
const logger = require('../utils/logger');

function checkSSL(domain) {
    return new Promise((resolve) => {
        const socket = tls.connect({
            host: domain,
            port: 443,
            servername: domain, // SNI (Server Name Indication) is required for most modern sites
            rejectUnauthorized: false, // Don't crash on bad certs, just inspect them
            timeout: 4000 // 4s timeout (internal)
        }, () => {
            const cert = socket.getPeerCertificate();

            if (!cert || Object.keys(cert).length === 0) {
                socket.end();
                return resolve({ valid: false, error: 'No certificate presented' });
            }

            const validTo = new Date(cert.valid_to);
            const daysRemaining = Math.floor((validTo - new Date()) / (1000 * 60 * 60 * 24));
            const valid = daysRemaining > 0;

            socket.end();

            resolve({
                valid: valid,
                daysRemaining: daysRemaining,
                issuer: cert.issuer.O || cert.issuer.CN || 'Unknown',
                validFrom: cert.valid_from,
                validTo: cert.valid_to
            });
        });

        socket.on('error', (err) => {
            // logger.warn(`SSL Check Error: ${err.message}`);
            resolve({ valid: false, error: 'Connection failed' });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ valid: false, error: 'Connection timed out' });
        });
    });
}

module.exports = { checkSSL };
