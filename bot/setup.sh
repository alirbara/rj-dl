#!/usr/bin/env bash

function main() {
    # Write bot token into .env
    read -p "Enter the bot token: " token
    echo "TOKEN=$token" > .env

    # Install dependencies
    npm i

    # Deploy using pm2
    pm2 start old.js --name "rj-dl"

}

main
