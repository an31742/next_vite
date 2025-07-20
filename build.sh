#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 时间戳函数（YYYY-MM-DD HH:MM:SS 格式）
timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# 错误处理函数
handle_error() {
    echo -e "${RED}[$(timestamp)] 错误: $1${NC}"
    echo -e "${RED}构建失败，请检查日志文件: logs/error.log${NC}"
    exit 1
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        handle_error "$1 未安装"
    fi
}

# 验证构建文件
verify_build() {
    local dir=$1
    local files=("index.html" "assets/")
    
    echo -e "${BLUE}[$(timestamp)] 验证 $dir 构建文件...${NC}"
    for file in "${files[@]}"; do
        if [ ! -e "$dir/$file" ]; then
            echo -e "${RED}错误: $dir 中未找到 $file${NC}"
            return 1
        fi
    done
    echo -e "${GREEN}$dir 文件验证通过${NC}"
    return 0
}

# 清理函数
cleanup() {
    echo -e "${BLUE}[$(timestamp)] 开始清理...${NC}"
    
    if [ "$1" == "--clean" ]; then
        echo -e "${YELLOW}执行完整清理...${NC}"
        rm -rf next-api/.next next-api/node_modules next-api/.npm next-api/package-lock.json
        rm -rf vite-app/dist vite-app/node_modules vite-app/.npm vite-app/package-lock.json
    else
        echo -e "${YELLOW}清理构建文件...${NC}"
        rm -rf next-api/.next vite-app/dist
    fi
    
    rm -rf logs/*
    echo -e "${GREEN}清理完成${NC}"
}

# 构建 Next.js API
build_next() {
    echo -e "${BLUE}[$(timestamp)] 开始构建 next-api...${NC}"
    cd next-api || handle_error "无法进入 next-api 目录"
    
    npm install --no-audit || handle_error "next-api 依赖安装失败"
    npm run build || handle_error "next-api 构建失败"
    
    echo -e "${GREEN}[$(timestamp)] next-api 构建成功！${NC}"
    cd ..
}

# 构建 Vite 前端
build_vite() {
    echo -e "${BLUE}[$(timestamp)] 开始构建 vite-app...${NC}"
    cd vite-app || handle_error "无法进入 vite-app 目录"
    
    npm install --no-audit || handle_error "vite-app 依赖安装失败"
    npm run build || handle_error "vite-app 构建失败"
    
    echo -e "${GREEN}[$(timestamp)] vite-app 构建成功！${NC}"
    cd ..
}

# 生成构建报告
generate_report() {
    local duration=$1
    local report_file="logs/build-report.txt"
    local current_time=$(date "+%Y-%m-%d %H:%M:%S")
    local current_user=$(whoami)
    
    cat > "$report_file" << EOF
构建报告
=================
构建时间: $current_time
当前用户: $current_user
环境: $BUILD_ENV
构建用时: ${duration}秒

构建结果
-----------------
Next.js API 大小: $(du -sh next-api/.next | cut -f1)
Vite 前端大小: $(du -sh vite-app/dist | cut -f1)

系统信息
-----------------
Node.js: $(node -v)
NPM: $(npm -v)
操作系统: $(uname -s)
EOF

    echo -e "${BLUE}构建报告已生成: ${report_file}${NC}"
}

# 主函数
main() {
    # 记录开始时间
    local start_time=$(date +%s)
    
    echo -e "${BLUE}=== 开始全栈项目构建 [$(timestamp)] ===${NC}"
    
    # 获取参数
    BUILD_ENV="${1:-production}"
    CLEAN_FLAG="${2:-}"
    
    # 显示构建信息
    echo -e "${BLUE}构建环境: ${BUILD_ENV}${NC}"
    echo -e "${BLUE}清理模式: ${CLEAN_FLAG:-标准清理}${NC}"
    echo -e "${BLUE}当前用户: $(whoami)${NC}"
    echo -e "${BLUE}当前时间: $(timestamp)${NC}"
    
    # 环境检查
    check_command "node"
    check_command "npm"
    
    # 版本信息
    echo -e "${BLUE}Node.js: $(node -v)${NC}"
    echo -e "${BLUE}NPM: $(npm -v)${NC}"
    
    # 创建日志目录
    mkdir -p logs
    
    # 清理
    cleanup "$CLEAN_FLAG"
    
    # 并行构建
    build_next > logs/next-build.log 2>&1 &
    next_pid=$!
    
    build_vite > logs/vite-build.log 2>&1 &
    vite_pid=$!
    
    # 等待构建完成
    wait $next_pid $vite_pid
    
    # 验证构建结果
    if verify_build "vite-app/dist"; then
        # 计算构建时间
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        echo -e "${GREEN}[$(timestamp)] 构建成功！${NC}"
        
        # 显示构建信息
        echo -e "\n${BLUE}构建结果：${NC}"
        echo -e "Next.js API: $(du -sh next-api/.next | cut -f1)"
        echo -e "Vite 前端: $(du -sh vite-app/dist | cut -f1)"
        echo -e "构建用时: ${duration}秒"
        
        # 生成报告
        generate_report $duration
        
        echo -e "\n${GREEN}构建完成时间: $(timestamp)${NC}"
    else
        handle_error "构建验证失败"
    fi
}

# 捕获中断信号
trap "echo -e '\n${RED}构建被用户中断${NC}'; exit 1" INT TERM

# 运行主函数
main "$@"