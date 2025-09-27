#!/bin/bash

# 设置 Vercel 环境变量的脚本

echo "正在设置 Vercel 环境变量..."

# 设置 MONGODB_URI
echo "设置 MONGODB_URI..."
echo "mongodb+srv://an31742:212314@cluster0.2xk4dyf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" | vercel env add MONGODB_URI

# 等待用户选择环境
echo "请选择环境：按 'a' 全选，然后按回车"
read -p "按回车继续下一个环境变量..."

# 设置 DB_NAME
echo "设置 DB_NAME..."
echo "accounting_app" | vercel env add DB_NAME

echo "环境变量设置完成！"
echo "请重新部署项目: vercel --prod"