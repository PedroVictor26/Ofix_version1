#!/bin/bash

echo "Starting OFIX Development Environment..."
echo

echo "Starting Backend..."
cd ofix-backend
npm run dev &
BACKEND_PID=$!
cd ..

echo
echo "Waiting 5 seconds for backend to start..."
sleep 5

echo "Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo
echo "Development environment started!"
echo "Backend: http://localhost:1000"
echo "Frontend: http://localhost:5174"
echo
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait