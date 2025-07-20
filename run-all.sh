#!/bin/bash

# 后端 9527
cd next-api
yarn dev -p 9527 &
NEXT_API_PID=$!
cd ..

# 前端 5173
cd vite-app
yarn dev --port 5173 &
VITE_APP_PID=$!
cd ..

wait $NEXT_API_PID $VITE_APP_PID 