#!/bin/bash

# 测试管理员登录
echo "测试管理员登录..."
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"name": "admin", "password": "12345"}' \
  -i

echo -e "\n----------------------------------------\n"

# 测试普通用户登录（需要先有用户数据）
echo "测试普通用户登录..."
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"name": "testuser", "password": "12345"}' \
  -i

echo -e "\n----------------------------------------\n"

# 测试错误凭证
echo "测试错误凭证..."
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"name": "admin", "password": "wrongpassword"}' \
  -i