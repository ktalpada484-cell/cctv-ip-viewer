// CCTV Stream Connect Logic
document.getElementById('connectBtn').addEventListener('click', async () => {
    const ipUrl = document.getElementById('ipInput').value.trim();
    const viewerContainer = document.getElementById('viewerContainer');
    const downloadBtn = document.getElementById('downloadBtn');

    if (!ipUrl) {
        alert('Please enter a valid IP address or URL');
        return;
    }

    try {
        await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ipAddress: ipUrl, actionType: 'STREAM_VIEW' })
        });
    } catch (err) {
        console.error('Logging failed', err);
    }

    viewerContainer.innerHTML = `<img id="streamImage" src="${ipUrl}" alt="Live Stream" onerror="handleStreamError()">`;
    downloadBtn.style.display = 'inline-block';
});

function handleStreamError() {
    const viewerContainer = document.getElementById('viewerContainer');
    viewerContainer.innerHTML = `<span class="placeholder-text" style="color: #ff4444;">⚠️ Connection Failed or Invalid Stream URL</span>`;
    document.getElementById('downloadBtn').style.display = 'none';
}

// Snapshot Download Logic
document.getElementById('downloadBtn').addEventListener('click', () => {
    const streamImage = document.getElementById('streamImage');
    if (!streamImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = streamImage.naturalWidth || 640;
    canvas.height = streamImage.naturalHeight || 480;
    const ctx = canvas.getContext('2d');
    
    try {
        ctx.drawImage(streamImage, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.download = `cctv-snapshot-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        alert('CORS restriction prevents direct image downloading from this external IP stream.');
    }
});

// Real-Time Network IP & Device Scanner Logic
const startScanBtn = document.getElementById('startScanBtn');
const scanModal = document.getElementById('scanModal');
const closeScanBtn = document.getElementById('closeScanBtn');
const scanResultsList = document.getElementById('scanResultsList');
const scanStatus = document.getElementById('scanStatus');

if (startScanBtn) {
    startScanBtn.addEventListener('click', async () => {
        scanModal.style.display = 'flex';
        scanResultsList.innerHTML = '';
        scanStatus.innerText = 'Fetching real-time subnet configuration and scanning IPs...';

        try {
            const response = await fetch('/api/scan-network');
            const data = await response.json();

            if (data.success) {
                scanStatus.innerText = `Scan Complete! Subnet: ${data.subnet} (Found ${data.devices.length} IPs)`;
                
                for (let dev of data.devices) {
                    const item = document.createElement('div');
                    item.className = 'device-item';
                    item.innerHTML = `<span><strong>${dev.ip}</strong></span> <span style="color: #00ffcc;">${dev.type}</span>`;
                    scanResultsList.appendChild(item);
                }

                // Log the scan execution to admin backend
                await fetch('/api/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ipAddress: data.subnet, actionType: 'REALTIME_IP_SCAN_PERFORMED' })
                });
            } else {
                scanStatus.innerText = 'Network scan failed on server.';
            }
        } catch (err) {
            console.error('Scan request failed', err);
            scanStatus.innerText = 'Error connecting to server for real-time scan.';
        }
    });
}

if (closeScanBtn) {
    closeScanBtn.addEventListener('click', () => {
        scanModal.style.display = 'none';
    });
}
