#!/bin/bash

echo "Testing API endpoint..."

# 测试 OPTIONS 请求
echo "Testing OPTIONS request..."
curl -X OPTIONS http://localhost:9527/api/login \
-H "Origin: http://localhost:5173" \
-H "Access-Control-Request-Method: POST" \
-H "Access-Control-Request-Headers: Content-Type" \
-v

echo -e "\nTesting POST request..."
# 测试 POST 请求
curl -X POST http://localhost:9527/api/login \
-H "Content-Type: application/json" \
-H "Origin: http://localhost:5173" \
-d '{"userName":"admin","passWord":"12345"}' \
-v