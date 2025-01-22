# Première étape : PHP et dépendances
FROM php:8.3-fpm

# Installation Nginx et autres dépendances
RUN apt-get update && apt-get install -y \
   nginx \
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
   gettext-base

# Installation de l'extension MongoDB
RUN pecl install mongodb \
   && docker-php-ext-enable mongodb

# Installation des extensions PHP
RUN docker-php-ext-install pdo mbstring exif pcntl bcmath gd zip

# Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . /var/www/

# Créer les répertoires nécessaires pour nginx
RUN mkdir -p /var/log/nginx && \
   touch /var/log/nginx/error.log && \
   touch /var/log/nginx/access.log

# Copier la configuration Nginx
COPY docker/nginx/conf.d/app.conf /etc/nginx/conf.d/app.conf

RUN composer install

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Nettoyer la configuration nginx par défaut
RUN rm -rf /etc/nginx/sites-available/default
RUN rm -rf /etc/nginx/sites-enabled/default

# Script de démarrage
COPY docker/start.sh /usr/local/bin/start
RUN chmod +x /usr/local/bin/start

CMD ["/usr/local/bin/start"]
