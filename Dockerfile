FROM php:8.2-fpm

# Optional: install extensions (e.g., mysqli for MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

WORKDIR /var/www/html
