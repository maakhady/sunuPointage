#!/bin/bash

# Démarrer Nginx
service nginx start

# Démarrer PHP-FPM en premier plan
php-fpm
