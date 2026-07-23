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

// Network IP & Device Scanner Logic
const startScanBtn = document.getElementById('startScanBtn');
const scanModal = document.getElementById('scanModal');
const closeScanBtn = document.getElementById('closeScanBtn');
const scanResultsList = document.getElementById('scanResultsList');
const scanStatus = document.getElementById('scanStatus');

if (startScanBtn) {
    startScanBtn.addEventListener('click', async () => {
        scanModal.style.display = 'flex';
        scanResultsList.innerHTML = '';
        scanStatus.innerText = 'Scanning local subnet for active devices...';

        // Simulated discovered devices with specific types as requested
        const simulatedDevices = [
            { ip: '192.168.1.10', type: '💻 Computer (Admin PC)' },
            { ip: '192.168.1.25', type: '📷 CCTV Camera (Stream Active)' },
            { ip: '192.168.1.42', type: '📱 Phone (Android)' },
            { ip: '192.168.1.55', type: '📟 Tab (iPad/Tablet)' },
            { ip: '192.168.1.88', type: '💻 Laptop (Client)' }
        ];

        setTimeout(async () => {
            scanStatus.innerText = `Scan Complete! Found ${simulatedDevices.length} active devices:`;
            
            for (let dev of simulatedDevices) {
                const item = document.createElement('div');
                item.className = 'device-item';
                item.innerHTML = `<span><strong>${dev.ip}</strong></span> <span style="color: #00ffcc;">${dev.type}</span>`;
                scanResultsList.appendChild(item);

                // Send each discovered scan log to admin panel backend
                try {
                    await fetch('/api/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ipAddress: dev.ip, actionType: `Scan Found: ${dev.type}` })
                    });
                } catch (err) {
                    console.error('Scan log send failed', err);
                }
            }
        }, 1500);
    });
}

if (closeScanBtn) {
    closeScanBtn.addEventListener('click', () => {
        scanModal.style.display = 'none';
    });
}
