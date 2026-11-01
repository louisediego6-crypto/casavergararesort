<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SameOriginFraming
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'self'");

        if ($request->is('pages/*') && is_string($content = $response->getContent())) {
            $script = '<script src="/js/url-shell.js" defer></script>';
            $bodyEnd = strripos($content, '</body>');
            $content = $bodyEnd === false
                ? $content . $script
                : substr_replace($content, $script, $bodyEnd, 0);
            $response->setContent($content);
        }

        return $response;
    }
}
