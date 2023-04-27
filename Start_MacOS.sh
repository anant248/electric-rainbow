#!/bin/bash
cd "${0%/*}"
npm start &
sleep 1 
pipenv run python3 main.py 
echo "All Done!"