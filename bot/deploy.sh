#!/bin/bash

main() {
    # Update repos
    apt update
    
    # Install nodejs LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - &&\
    sudo apt-get install -y nodejs

    # Update npm
    npm i -g npm

    # Install pm2
    npm i -g pm2

    # Set up pm2
    pm2
    pm2 startup

    # Deploy
    read -p "Enter bot token: " token
    echo "BOT_TOKEN=$token" > .env
    npm i
    pm2 start bot.js --name rj-dl
    pm2 save
}

main
