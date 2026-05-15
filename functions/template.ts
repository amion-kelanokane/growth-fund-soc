import { escapeHtml } from './utils';

export function getTemplate({
  redirectPath,
  withError,
  waitSeconds,
}: {
  redirectPath: string;
  withError: boolean;
  /** When defined (≥ 0), the user is rate-limited. 0 means "wait over, may retry". */
  waitSeconds?: number;
}): string {
  const isRateLimited = waitSeconds !== undefined;
  const safePath = escapeHtml(redirectPath);

  const errorBanner = withError
    ? `<p class="banner banner--error">Incorrect password. Please try again.</p>`
    : '';

  const rateBanner = isRateLimited
    ? `<p class="banner banner--rate" id="rate-msg">
        Too many attempts.${waitSeconds > 0 ? ` Please wait <span id="secs">${waitSeconds}</span>s before retrying.` : ' You may now retry.'}
       </p>`
    : '';

  const countdownScript =
    isRateLimited && waitSeconds > 0
      ? `<script>
(function () {
  var s = ${waitSeconds};
  var secsEl = document.getElementById('secs');
  var msgEl  = document.getElementById('rate-msg');
  var pwd    = document.querySelector('input[type="password"]');
  var btn    = document.querySelector('button[type="submit"]');
  var t = setInterval(function () {
    s--;
    if (s <= 0) {
      clearInterval(t);
      msgEl.textContent = 'You may now retry.';
      msgEl.className = 'banner banner--rate';
      pwd.disabled = false;
      btn.disabled = false;
      pwd.focus();
    } else {
      secsEl.textContent = s;
    }
  }, 1000);
})();
</script>`
      : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AMION Consulting — Secure Access</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/webp" href="data:image/webp;base64,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">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:                 #141414;
      --card-bg:            #1e1e1e;
      --card-border:        #2a2a2a;
      --text:               #ffffff;
      --text-muted:         #888888;
      --input-bg:           #141414;
      --input-border:       #2a2a2a;
      --input-text:         #ffffff;
      --btn-disabled-bg:    #3a1a22;
      --btn-disabled-color: #666666;
      --shadow:             rgba(0,0,0,0.55);
      --toggle-bg:          #2a2a2a;
      --toggle-color:       #cfa75e;
      --toggle-hover:       #333333;
      --banner-error-color: #ff8099;
      --banner-rate-color:  #cfa75e;
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg:                 #f2f2f2;
        --card-bg:            #ffffff;
        --card-border:        #d8d8d8;
        --text:               #1a1a1a;
        --text-muted:         #777777;
        --input-bg:           #f8f8f8;
        --input-border:       #cccccc;
        --input-text:         #1a1a1a;
        --btn-disabled-bg:    #f0ccd5;
        --btn-disabled-color: #999999;
        --shadow:             rgba(0,0,0,0.12);
        --toggle-bg:          #e8e8e8;
        --toggle-color:       #555555;
        --toggle-hover:       #dcdcdc;
        --banner-error-color: #cc0044;
        --banner-rate-color:  #a07830;
      }
    }

    :root[data-theme="dark"] {
      --bg:                 #141414;
      --card-bg:            #1e1e1e;
      --card-border:        #2a2a2a;
      --text:               #ffffff;
      --text-muted:         #888888;
      --input-bg:           #141414;
      --input-border:       #2a2a2a;
      --input-text:         #ffffff;
      --btn-disabled-bg:    #3a1a22;
      --btn-disabled-color: #666666;
      --shadow:             rgba(0,0,0,0.55);
      --toggle-bg:          #2a2a2a;
      --toggle-color:       #cfa75e;
      --toggle-hover:       #333333;
      --banner-error-color: #ff8099;
      --banner-rate-color:  #cfa75e;
    }

    :root[data-theme="light"] {
      --bg:                 #f2f2f2;
      --card-bg:            #ffffff;
      --card-border:        #d8d8d8;
      --text:               #1a1a1a;
      --text-muted:         #777777;
      --input-bg:           #f8f8f8;
      --input-border:       #cccccc;
      --input-text:         #1a1a1a;
      --btn-disabled-bg:    #f0ccd5;
      --btn-disabled-color: #999999;
      --shadow:             rgba(0,0,0,0.12);
      --toggle-bg:          #e8e8e8;
      --toggle-color:       #555555;
      --toggle-hover:       #dcdcdc;
      --banner-error-color: #cc0044;
      --banner-rate-color:  #a07830;
    }

    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-top: 3px solid #990033;
      border-radius: 10px;
      padding: 2.5rem 2.75rem;
      width: 100%;
      max-width: 400px;
      margin: 1rem;
      box-shadow: 0 8px 32px var(--shadow);
      transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
    }

    .logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .logo-wrap img {
      max-width: 180px;
      max-height: 56px;
      width: auto;
      height: auto;
      display: block;
    }

    .logo-divider {
      border: none;
      border-top: 1px solid #cfa75e;
      margin: 0 auto 1.5rem;
      width: 60%;
      opacity: 0.6;
    }

    .subtitle {
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .banner {
      border-radius: 6px;
      padding: 0.55rem 0.85rem;
      font-size: 0.85rem;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    .banner--error {
      background: rgba(153, 0, 51, 0.12);
      border: 1px solid rgba(153, 0, 51, 0.4);
      color: var(--banner-error-color);
    }

    .banner--rate {
      background: rgba(207, 167, 94, 0.12);
      border: 1px solid rgba(207, 167, 94, 0.35);
      color: var(--banner-rate-color);
    }

    input[type="password"] {
      display: block;
      width: 100%;
      padding: 0.65rem 0.85rem;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 6px;
      color: var(--input-text);
      font-family: inherit;
      font-size: 1rem;
      outline: none;
      margin-bottom: 0.85rem;
      transition: border-color 0.15s, background 0.2s, color 0.2s;
      -webkit-appearance: none;
    }

    input[type="password"]::placeholder {
      color: var(--text-muted);
    }

    input[type="password"]:focus {
      border-color: #cfa75e;
    }

    input[type="password"]:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    button[type="submit"] {
      display: block;
      width: 100%;
      padding: 0.65rem;
      background: #990033;
      border: none;
      border-radius: 6px;
      color: #ffffff;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: background 0.15s;
    }

    button[type="submit"]:hover:not(:disabled) { background: #b3003c; }

    button[type="submit"]:disabled {
      background: var(--btn-disabled-bg);
      color: var(--btn-disabled-color);
      cursor: not-allowed;
    }

    .theme-toggle {
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: var(--toggle-bg);
      border: 1px solid var(--card-border);
      color: var(--toggle-color);
      font-size: 1.05rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s, border-color 0.2s;
      box-shadow: 0 2px 8px var(--shadow);
    }

    .theme-toggle:hover {
      background: var(--toggle-hover);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-wrap">
      <img src="data:image/webp;base64,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" alt="AMION Consulting">
    </div>
    <hr class="logo-divider">
    <p class="subtitle">Secure Access</p>
    ${errorBanner}
    ${rateBanner}
    <form method="post" action="/cfp_login">
      <input type="hidden" name="redirect" value="${safePath}">
      <input
        type="password"
        name="password"
        placeholder="Password"
        aria-label="Password"
        autocomplete="current-password"
        required
        ${isRateLimited && waitSeconds > 0 ? 'disabled' : 'autofocus'}
      >
      <button type="submit"${isRateLimited && waitSeconds > 0 ? ' disabled' : ''}>Login</button>
    </form>
  </div>

  <button class="theme-toggle" id="theme-toggle" aria-label="Toggle colour theme" title="Toggle light/dark mode"><span aria-hidden="true">🌙</span></button>

  <script>
(function () {
  var root = document.documentElement;
  var btn  = document.getElementById('theme-toggle');
  var icon = btn.querySelector('span');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  }

  var stored = null;
  try { stored = localStorage.getItem('amion-theme'); } catch (e) {}

  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var initial = stored || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('amion-theme', next); } catch (e) {}
  });
})();
  </script>
  ${countdownScript}
</body>
</html>`;
}
