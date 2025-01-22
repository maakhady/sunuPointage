#!/bin/bash
# Remplacer la variable PORT dans la configuration nginx
envsubst '${PORT}' < /etc/nginx/conf.d/app.conf > /etc/nginx/conf.d/default.conf

# Démarrer Nginx
service nginx start

# Démarrer PHP-FPM en premier plan
php-fpm
