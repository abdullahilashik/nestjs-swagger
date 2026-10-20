#~/bin/bash
echo 'Updating apt package list...'
sudo apt update

# Install required mysql packages

sudo apt install mysql-server -y

# Start mysql service
sudo systemctl start mysql

# Create a new mysql user and database
echo 'Creating a new mysql user and database....'

sudo mysql -e "CREATE DATABASE ecomdb"
sudo mysql -e "CREATE USER 'ecomuser'@'localhost' identified by 'ecompassword'"
sudo mysql -e "GRANT ALL PRIVILEGES ecomdb.* TO 'ecomuser'@'localhost'"
sudo mysql -e "FLUSH PRIVILEGES"

# insert data into the database
echo 'Inserting data into the database....'
sudo mysql -e "USE ecomdb; CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2));"
sudo mysql -e "USE ecomdb; INSERT INTO products (name, price) VALUES ('Product 1', 10.99), ('Product 2', 19.99), ('Product 3', 5.99);"

# Install required apache and php packages
echo 'Installing apache and php packages...'
sudo apt install apache2 php libapache2-mod-php php-mysql -y

echo 'Apache and PHP packages installed successfully.'
echo '<h1>Welcome to the E-commerce Application</h1>' | sudo tee /var/www/html/index.html