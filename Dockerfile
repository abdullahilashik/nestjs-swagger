FROM ubuntu:latest

WORKDIR /app

# Install prerequisites and nginx
RUN apt-get update && apt-get install -y nginx

COPY index.html /var/www/html/index.html
# Note: Nginx's default public folder on Ubuntu is /var/www/html/

EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]