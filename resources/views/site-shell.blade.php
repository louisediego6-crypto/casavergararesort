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
            background: linear-gradient(145deg, #f8fafc, #eef5f1);
            color: #355d4c;
            font: 500 1rem/1.5 system-ui, sans-serif;
        }

        .site-loading[hidden] {
            display: none;
        }

        .site-loading-content {
            display: grid;
            justify-items: center;
            gap: 1rem;
        }

        .site-loading-spinner {
            width: 2.5rem;
            height: 2.5rem;
            border: 3px solid rgba(53, 93, 76, .2);
            border-top-color: #355d4c;
            border-radius: 50%;
            animation: site-loading-spin .8s linear infinite;
        }

        @keyframes site-loading-spin {
            to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
            .site-loading-spinner {
                animation-duration: 2s;
            }
        }
    </style>
</head>
<body>
    <iframe id="site-content" src="/pages/landing.html" title="Casa Vergara Resort"></iframe>
    <div id="site-loading" class="site-loading" role="status" aria-live="polite">
        <div class="site-loading-content">
            <span class="site-loading-spinner" aria-hidden="true"></span>
            <span>Loading Casa Vergara Resort...</span>
        </div>
    </div>
    <script src="/js/url-shell.js" defer></script>
</body>
</html>
