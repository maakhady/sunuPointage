FROM php:8.3-fpm

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
    nginx

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

# Copier la configuration nginx
COPY docker/nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf

# Installation des dépendances
RUN composer install --no-dev --optimize-autoloader

# Permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chmod +x artisan

# Générer la clé d'application si nécessaire
RUN php artisan key:generate --force

# Script de démarrage
RUN chmod +x start.sh

EXPOSE 80

CMD ["/start.sh"]
