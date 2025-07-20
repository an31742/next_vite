#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 清理已有的进程
cleanup() {
    echo -e "${GREEN}Cleaning up processes...${NC}"
    kill $NEXT_API_PID $VITE_APP_PID 2>/dev/null
    exit 0
}

# 设置清理钩子
trap cleanup SIGINT SIGTERM

# 启动后端 (Next.js API - 9527)
echo -e "${BLUE}Starting Next.js API server on port 9527...${NC}"
cd next-api
PORT=9527 npm run dev &
NEXT_API_PID=$!
cd ..

# 启动前端 (Vite - 5173)
echo -e "${BLUE}Starting Vite frontend on port 5173...${NC}"
cd vite-app
npm run dev -- --port 5173 &
VITE_APP_PID=$!
cd ..

# 显示服务信息
echo -e "${GREEN}Services started:${NC}"
echo -e "Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "Backend:  ${BLUE}http://localhost:9527${NC}"
echo -e "API:      ${BLUE}http://localhost:9527/api${NC}"

# 等待所有进程
wait $NEXT_API_PID $VITE_APP_PID