const net = require('net');

function checkPort(domain, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        // Hard timeout: 2000ms (2 seconds) per port
        // Since we run in parallel, total time is ~2 seconds.
        socket.setTimeout(2000);

        socket.on('connect', () => {
            socket.destroy(); // Close immediately, we just wanted to see if it's open
            resolve(true);    // Port is OPEN
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);   // Port is TIMED OUT (Closed/Filtered)
        });

        socket.on('error', (err) => {
            socket.destroy();
            resolve(false);   // Port is ERROR (Closed)
        });

        socket.connect(port, domain);
    });
}

async function checkPorts(domain) {
    const PORTS = [21, 22, 80, 443, 8080];

    try {
        // Run all 5 checks simultaneously
        const checks = PORTS.map(port =>
            checkPort(domain, port).then(isOpen => ({ port, isOpen }))
        );

        const results = await Promise.all(checks);

        const openPorts = results
            .filter(result => result.isOpen)
            .map(result => result.port);

        return { open: openPorts };

    } catch (error) {
        return { error: 'Port scan failed' };
    }
}

module.exports = { checkPorts };
