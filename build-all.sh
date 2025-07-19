#!/bin/bash

# 打包 next-api
echo "正在打包 next-api..."
cd next-api
npm install
npm run build

# 打包 vite-app
echo "正在打包 vite-app..."
cd ../vite-app
npm install
npm run build

echo "两个项目打包完成！" 