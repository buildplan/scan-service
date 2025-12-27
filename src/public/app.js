async function startScan() {
    const domainInput = document.getElementById('domain');
    const domain = domainInput.value.trim();
    if(!domain) return;

    // UI Reset
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('error-msg').classList.add('hidden');
    document.getElementById('scanBtn').setAttribute('disabled', 'true');

    // Reset Tier 2 Visuals
    document.getElementById('status-badge').className = 'badge-pending';
    document.getElementById('status-badge').innerText = 'SCANNING...';
    document.getElementById('score-perf').className = 'score-circle';
    document.getElementById('score-perf').innerText = '--';
    document.getElementById('score-seo').className = 'score-circle';
    document.getElementById('score-seo').innerText = '--';

    try {
        // 1. Start Scan
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ domain })
        });

        const data = await res.json();

        if(data.error) throw new Error(data.error);

        // 2. Render Instant Results
        renderTier1(data.tier1);

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('results').classList.remove('hidden');

        // 3. Poll for Deep Scan
        pollJob(data.id);

    } catch (err) {
        document.getElementById('loading').classList.add('hidden');
        const errDiv = document.getElementById('error-msg');
        errDiv.innerText = err.message || "Scan failed to initialize.";
        errDiv.classList.remove('hidden');
        document.getElementById('scanBtn').removeAttribute('disabled');
    }
}

function renderTier1(data) {
    // SSL
    const ssl = data.ssl;
    const sslHtml = ssl.valid
        ? `<span style="color:#10b981">● Valid</span><br><small>Expires in ${ssl.daysRemaining} days<br>${ssl.issuer}</small>`
        : `<span style="color:#ef4444">● Invalid/Expired</span>`;
    document.getElementById('res-ssl').innerHTML = sslHtml;

    // Headers
    const h = data.headers;
    const gradeColor = h.grade === 'A' ? '#10b981' : (h.grade === 'B' ? '#f59e0b' : '#ef4444');
    document.getElementById('res-headers').innerHTML = `
        <span style="font-size:2rem; font-weight:bold; color:${gradeColor}">${h.grade}</span>
        <small style="display:block; margin-top:5px">Server: ${h.server}</small>
    `;

    // Ports
    const p = data.ports;
    if(p.open && p.open.length > 0) {
        document.getElementById('res-ports').innerHTML = `<span style="color:#f59e0b">${p.open.join(', ')}</span> <small>Detected</small>`;
    } else {
        document.getElementById('res-ports').innerHTML = `<span style="color:#10b981">All Common Ports Closed</span>`;
    }

    // Carbon
    const c = data.carbon;
    const co2 = c.co2 ? `${c.co2}g` : 'Unknown';
    const green = c.green ? '🌱 Green Hosting' : '🛢️ Grey Hosting';
    document.getElementById('res-carbon').innerHTML = `<strong>${co2}</strong> <small>CO2/view</small><br><small>${green}</small>`;
}

async function pollJob(id) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`/api/scan/${id}`);
            const data = await res.json();

            if (data.state === 'completed') {
                clearInterval(interval);
                renderTier2(data.result);
                document.getElementById('scanBtn').removeAttribute('disabled');
            } else if (data.state === 'failed') {
                clearInterval(interval);
                document.getElementById('status-badge').innerText = 'FAILED';
                document.getElementById('status-badge').style.background = '#ef4444';
                document.getElementById('scanBtn').removeAttribute('disabled');
            }
        } catch (e) {
            clearInterval(interval);
        }
    }, 2000);
}

function renderTier2(data) {
    document.getElementById('status-badge').className = 'badge-done';
    document.getElementById('status-badge').innerText = 'COMPLETE';

    updateScore('score-perf', data.performance);
    updateScore('score-seo', data.seo);

    document.getElementById('screenshot').src = data.screenshot;

    // Tech Stack
    const stackList = document.getElementById('res-stack');
    if (data.tech && data.tech.length > 0) {
        stackList.innerHTML = data.tech.map(t => `<li>${t.name}</li>`).join('');
    } else {
        stackList.innerHTML = '<li>No specific technologies detected</li>';
    }
}

function updateScore(id, score) {
    const el = document.getElementById(id);
    el.innerText = Math.round(score);
    el.className = 'score-circle'; // reset
    if (score >= 90) el.classList.add('score-good');
    else if (score >= 50) el.classList.add('score-average');
    else el.classList.add('score-poor');
}
