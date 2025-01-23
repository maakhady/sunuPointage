#!/bin/bash

# Remplacer la variable PORT dans la configuration nginx
export PORT=${PORT:-80}
envsubst '$PORT' < /etc/nginx/conf.d/app.conf > /etc/nginx/conf.d/default.conf

# Démarrer PHP-FPM en arrière-plan
php-fpm -D

# Démarrer Nginx en premier plan
nginx -g 'daemon off;'
