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

