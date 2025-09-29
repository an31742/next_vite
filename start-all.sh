#!/bin/bash

# 启动后端服务
echo "启动后端服务..."
cd /Users/maxiangan/Desktop/project/next_vite/next-api
npm run dev &

# 等待几秒钟让后端服务启动
sleep 5

# 启动前端服务
echo "启动前端服务..."
cd /Users/maxiangan/Desktop/project/next_vite/vite-app
npm run dev &

echo "所有服务已启动！"
echo "前端地址: http://localhost:3088"
echo "后端地址: http://localhost:3000"