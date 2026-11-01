<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Casa Vergara Resort</title>
    <style>
        html,
        body {
            width: 100%;
            height: 100%;
            margin: 0;
            overflow: hidden;
        }

        iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
            background: #f8fafc;
        }

        .site-loading {
            position: fixed;
            inset: 0;
            z-index: 1;
            display: grid;
            place-items: center;
            background: #f0f2f5;
            color: #355d4c;
            opacity: 0;
            visibility: hidden;
            transition: opacity 160ms ease, visibility 160ms ease;
        }

        .site-loading.is-visible {
            opacity: 1;
            visibility: visible;
        }

        .site-loading[hidden] {
            display: none;
        }

        .site-loading-brand {
            display: grid;
            justify-items: center;
            gap: 1rem;
            text-align: center;
            animation: site-brand-arrive 220ms ease-out both;
        }

        .site-loading-logo {
            width: 5rem;
            height: 5rem;
            padding: .5rem;
            border-radius: 1.25rem;
            background: #fff;
            object-fit: contain;
            box-shadow: 0 8px 24px rgba(27, 62, 53, .12);
            animation: site-logo-breathe 1.4s ease-in-out infinite;
        }

        .site-loading-name {
            margin: 0;
            color: #355d4c;
            font: 600 1.05rem/1.4 system-ui, sans-serif;
            letter-spacing: .01em;
        }

        .site-loading-dots::after {
            content: "...";
            display: inline-block;
            width: 0;
            overflow: hidden;
            vertical-align: bottom;
            animation: site-loading-dots 1.1s steps(4, end) infinite;
        }

        @keyframes site-brand-arrive {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes site-logo-breathe {
            50% { transform: scale(.96); }
        }

        @keyframes site-loading-dots {
            to { width: 1.25em; }
        }

        @media (prefers-reduced-motion: reduce) {
            .site-loading,
            .site-loading-brand,
            .site-loading-logo,
            .site-loading-dots::after {
                animation: none;
                transition: none;
            }
        }
    </style>
</head>
<body>
    <iframe id="site-content" src="/pages/landing.html" title="Casa Vergara Resort"></iframe>
    <div id="site-loading" class="site-loading is-visible" role="status" aria-live="polite">
        <div class="site-loading-brand">
            <img class="site-loading-logo" src="/images/logo-email.png" alt="">
            <p class="site-loading-name">Casa Vergara Resort<span class="site-loading-dots" aria-hidden="true"></span></p>
        </div>
    </div>
    <script src="/js/url-shell.js" defer></script>
</body>
</html>
