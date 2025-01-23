#!/bin/bash

# Remplacer la variable PORT dans la configuration nginx
envsubst '${PORT}' < /etc/nginx/conf.d/app.conf > /etc/nginx/conf.d/default.conf

# Créer les répertoires nécessaires
mkdir -p /var/log/nginx
touch /var/log/nginx/error.log
touch /var/log/nginx/access.log

# Nettoyer les configurations par défaut de nginx
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

# S'assurer des bonnes permissions
chown -R www-data:www-data /var/log/nginx
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Démarrer Nginx
nginx -g 'daemon off;' &

# Démarrer PHP-FPM
php-fpm
