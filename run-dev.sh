#!/bin/bash
(cd next-api && npm run dev &)   # 启动 next-api 服务
(cd vite && npm run dev &)       # 启动 vite 服务
wait                             # 等待所有后台任务