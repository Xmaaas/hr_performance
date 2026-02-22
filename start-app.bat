@echo off
cd hr-performance-backend
start cmd /k "node server.js"

cd ../hr-frontend
start cmd /k "npm start"

