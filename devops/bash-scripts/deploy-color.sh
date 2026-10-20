#!/bin/bash

# ANSI Color Codes
NC='\033[0m'             # No Color
BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'

# Helper function for a spinning progress indicator with colors
spin() {
    local pid=$1
    local message="$2"
    local spinchars='-\|/'
    local i=0

    # Hide cursor
    tput civis

    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) % 4 ))
        printf "\r${YELLOW}[%c]${NC} %s" "${spinchars:$i:1}" "$message"
        sleep 0.1
    done

    # Show cursor again and clear line with a green checkmark
    tput cnorm
    printf "\r${GREEN}[✔]${NC} %s\n" "$message"
}

echo -e "${BLUE}==================================================${NC}"
echo -e "${BOLD}         Starting E-commerce Server Setup         ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Step 1: Update apt package list
echo -e "${CYAN}[-] Updating apt package list...${NC}"
sudo apt update -qq > /dev/null 2>&1 &
spin $! "Apt package list updated successfully"

# Step 2: Install MySQL Server
echo -e "${CYAN}[-] Installing MySQL server...${NC}"
sudo apt install mysql-server -y -qq > /dev/null 2>&1 &
spin $! "MySQL server installed successfully"

# Step 3: Start MySQL service
echo -e "${CYAN}[-] Starting MySQL service...${NC}"
sudo systemctl start mysql &
spin $! "MySQL service started successfully"

# Step 4: Create MySQL user and database
echo -e "${CYAN}[-] Configuring MySQL database and users...${NC}"
(
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS ecomdb;"
    sudo mysql -e "CREATE USER IF NOT EXISTS 'ecomuser'@'localhost' IDENTIFIED BY 'ecompassword';"
    sudo mysql -e "GRANT ALL PRIVILEGES ON ecomdb.* TO 'ecomuser'@'localhost';"
    sudo mysql -e "FLUSH PRIVILEGES;"
) > /dev/null 2>&1 &
spin $! "MySQL database and user configured successfully"

# Step 5: Insert data into the database
echo -e "${CYAN}[-] Inserting schema and sample data...${NC}"
(
    sudo mysql -e "USE ecomdb; CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2));"
    sudo mysql -e "USE ecomdb; INSERT INTO products (name, price) VALUES ('Product 1', 10.99), ('Product 2', 19.99), ('Product 3', 5.99);"
) > /dev/null 2>&1 &
spin $! "Database schema and data inserted successfully"

# Step 6: Install Apache and PHP packages
echo -e "${CYAN}[-] Installing Apache and PHP packages...${NC}"
sudo apt install apache2 php libapache2-mod-php php-mysql -y -qq > /dev/null 2>&1 &
spin $! "Apache and PHP packages installed successfully"

# Finalize
echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}${BOLD}Setup completed successfully!${NC}"
echo -e "${BLUE}==================================================${NC}"
echo '<h1>Welcome to the E-commerce Application</h1>' | sudo tee /var/www/html/index.html > /dev/null