<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;

class ValidateHttpStatusCode
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $statusCode = $response->getStatusCode();
            if (!$this->isValidHttpStatusCode($statusCode)) {
                // Si le code n'est pas valide, on retourne 500
                $content = $response->getContent();
                return new JsonResponse(
                    json_decode($content, true),
                    500
                );
            }
        }

        return $response;
    }

    private function isValidHttpStatusCode($code)
    {
        return is_int($code) && $code >= 100 && $code < 600;
    }
}
