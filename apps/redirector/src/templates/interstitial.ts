interface OgPreview {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

interface InterstitialParams {
  destination: string;
  countdownSeconds: number;
  ogPreview?: OgPreview | null;
  slug: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');
}

export function renderInterstitial(params: InterstitialParams): string {
  const { destination, countdownSeconds, ogPreview, slug } = params;

  const safeUrl = escapeHtml(destination);
  const jsUrl = escapeJs(destination);
  let safeHost = "";
  try {
    safeHost = escapeHtml(new URL(destination).hostname);
  } catch {
    safeHost = escapeHtml(destination);
  }

  const refreshDelay = countdownSeconds + 2;

  let ogCard = "";
  if (ogPreview && (ogPreview.title || ogPreview.image || ogPreview.description)) {
    const faviconHtml = ogPreview.favicon
      ? `<img src="${escapeHtml(ogPreview.favicon)}" width="16" height="16" alt="" style="border-radius:2px;flex-shrink:0;">`
      : `<div style="width:16px;height:16px;background:#e2e8f0;border-radius:2px;flex-shrink:0;"></div>`;

    const imageHtml = ogPreview.image
      ? `<img src="${escapeHtml(ogPreview.image)}" width="120" height="90" alt="" style="width:120px;height:90px;object-fit:cover;border-radius:6px;flex-shrink:0;">`
      : "";

    const titleHtml = ogPreview.title
      ? `<div style="font-size:13px;font-weight:600;color:#1e293b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3;">${escapeHtml(ogPreview.title)}</div>`
      : "";

    const descHtml = ogPreview.description
      ? `<div style="font-size:12px;color:#64748b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3;margin-top:2px;">${escapeHtml(ogPreview.description)}</div>`
      : "";

    ogCard = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
        ${faviconHtml}
        <span style="font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeHost}</span>
      </div>
      <div style="display:flex;gap:10px;">
        ${imageHtml}
        <div style="flex:1;min-width:0;">
          ${titleHtml}
          ${descHtml}
        </div>
      </div>`;
  } else {
    ogCard = `
      <div style="display:flex;align-items:center;gap:6px;">
        <div style="width:16px;height:16px;background:#e2e8f0;border-radius:2px;flex-shrink:0;"></div>
        <span style="font-size:13px;color:#1e293b;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeHost}</span>
      </div>`;
  }

  const countdownSize = 56;
  const strokeWidth = 4;
  const radius = (countdownSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="${refreshDelay};URL='${safeUrl}'">
<title>Redirecting to ${safeHost}...</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1),0 1px 2px rgba(0,0,0,.06);max-width:480px;width:100%;padding:20px}
.og-preview{padding:14px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px}
.countdown-wrap{display:flex;align-items:center;justify-content:center;gap:14px;margin:16px 0}
.countdown-text{font-size:14px;color:#64748b;text-align:center}
.countdown-num{font-size:20px;font-weight:700;color:#3b82f6}
svg{transform:rotate(-90deg)}
svg circle{fill:none;stroke-width:${strokeWidth};stroke-linecap:round}
.track{stroke:#e2e8f0}
.progress{stroke:#3b82f6;transition:stroke-dashoffset 1s linear}
.ad-slot{min-height:90px;text-align:center;margin:16px 0}
.skip-btn{display:block;width:100%;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s}
.skip-btn.disabled{background:#cbd5e1;color:#94a3b8;cursor:not-allowed}
.skip-btn.enabled{background:#3b82f6;color:#fff;cursor:pointer}
.skip-btn.enabled:hover{background:#2563eb}
.footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:12px}
</style>
</head>
<body>
<div class="card">
  <div class="og-preview">${ogCard}</div>
  <div class="countdown-wrap">
    <svg width="${countdownSize}" height="${countdownSize}" viewBox="0 0 ${countdownSize} ${countdownSize}">
      <circle class="track" cx="${countdownSize / 2}" cy="${countdownSize / 2}" r="${radius}"/>
      <circle class="progress" id="prog" cx="${countdownSize / 2}" cy="${countdownSize / 2}" r="${radius}"
        stroke-dasharray="${circumference}" stroke-dashoffset="0"/>
    </svg>
    <div>
      <div class="countdown-text">Redirecting in</div>
      <div class="countdown-num" id="timer">${countdownSeconds}</div>
      <div class="countdown-text">seconds...</div>
    </div>
  </div>
  <div class="ad-slot" id="ad-slot"></div>
  <button class="skip-btn disabled" id="skipBtn" disabled>Skip Ad &rarr;</button>
  <div class="footer">Powered by PingTO.Me</div>
</div>
<script>
(function(){
  var total=${countdownSeconds},
      remaining=total,
      dest='${jsUrl}',
      circ=${circumference},
      timerEl=document.getElementById('timer'),
      progEl=document.getElementById('prog'),
      btn=document.getElementById('skipBtn');

  function tick(){
    remaining--;
    if(remaining<0)remaining=0;
    timerEl.textContent=remaining;
    var offset=circ*((total-remaining)/total);
    progEl.style.strokeDashoffset=circ-offset;

    if(remaining<=0){
      clearInterval(iv);
      btn.disabled=false;
      btn.className='skip-btn enabled';
      setTimeout(function(){window.location.href=dest},2000);
    }
  }

  btn.addEventListener('click',function(){if(!btn.disabled)window.location.href=dest});

  if(total<=0){
    timerEl.textContent='0';
    btn.disabled=false;
    btn.className='skip-btn enabled';
    setTimeout(function(){window.location.href=dest},2000);
    return;
  }

  var iv=setInterval(tick,1000);
})();
</script>
</body>
</html>`;
}
