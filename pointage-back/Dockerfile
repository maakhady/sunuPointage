FROM php:8.3-fpm

ENV PORT=10000

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    pkg-config \
    libssl-dev \
    nginx \
    gettext-base

# Installation de l'extension MongoDB
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

# Installation des extensions PHP
RUN docker-php-ext-install pdo mbstring exif pcntl bcmath gd zip

# Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copier TOUT le code d'abord
COPY . .

# Copier la configuration nginx template
COPY docker/nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf.template

# Création du fichier .env pour la production
RUN cp .env.example .env

# Installation des dépendances
RUN composer install --no-dev --optimize-autoloader

# Permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chmod +x artisan

# Générer la clé d'application
RUN php artisan key:generate --force

# Configuration du script de démarrage
COPY start.sh /var/www/start.sh
RUN chmod +x /var/www/start.sh

CMD ["/var/www/start.sh"]
