#!/bin/bash

process_name="rj-dl"

git pull
pm2 restart $process_name
