#!/bin/bash

# 检查 Node.js 版本
NODE_VERSION=$(node --version)
echo "当前 Node.js 版本: $NODE_VERSION"

# 检查是否满足最低要求 (Node.js 18+)
if [[ $NODE_VERSION == v16* ]]; then
    echo "警告: 当前 Node.js 版本 ($NODE_VERSION) 可能不兼容项目要求"
    echo "建议升级到 Node.js 18 或更高版本"
fi

# 安装依赖
echo "正在安装依赖..."
npm install

# 启动开发服务器
echo "正在启动开发服务器..."
npm run dev