#!/bin/bash

# 启动 next-api
cd next-api
npm run dev &
NEXT_PID=$!

# 启动 vite-app
cd ../vite-app
npm run dev &
VITE_PID=$!

# 返回根目录
cd ..

# 等待两个进程结束
wait $NEXT_PID
wait $VITE_PID 