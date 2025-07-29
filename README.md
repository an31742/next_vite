# 项目介绍
**个人博客 https://an31742.github.io** 
**语雀 https://www.yuque.com/an31742**

**懂的越多就知道的越少，每次面试每次相信大家都会经历一次蜕变，每次项目开发都能学习不一样的知识，记录每次面试的学习，记录每次项目难题，无论是博客还是语雀，总是有些无法表达的东西，我创建这个全栈项目就是为了更完善的表达 记录这些知识，分享这些经验，希望能帮助到大家**
本项目是一个全栈应用，包含两个主要部分：基于Next.js的后端API服务和基于Vite+Vue的前端应用。开发这个项目是自己在实践中遇见的一些问题，
## 项目结构

```
next_vite/
├── next-api/           # Next.js后端API服务
├── vite-app/           # Vite+Vue前端应用
├── start-dev.sh        # 开发环境启动脚本
├── test-api.sh         # API测试脚本
└── vercel.json         # Vercel部署配置
```

## 技术栈

### 后端 (next-api)
- Next.js 14
- TypeScript
- MongoDB + Mongoose
- JWT身份验证
- Sentry错误监控

### 前端 (vite-app)
- Vue 3 + TypeScript
- Vite
- Element Plus UI组件库
- Pinia状态管理
- Vue Router
- Three.js 3D图形
- 拖拽组件 (vuedraggable)

## 安装与启动

### 前提条件
- Node.js (v20.0.0+)
- npm (v9.0.0+)

### 安装依赖

```bash
# 安装后端依赖
cd next-api
npm install

# 安装前端依赖
cd ../vite-app
npm install
```

### 开发环境启动

使用根目录下的启动脚本同时启动前后端服务：

```bash
chmod +x start-dev.sh
./start-dev.sh
```

服务启动后，可通过以下地址访问：
- 前端应用: http://localhost:5173
- 后端API: http://localhost:9527
- API文档: http://localhost:9527

## 使用方法

### API测试

可以使用提供的测试脚本测试API：

```bash
chmod +x test-api.sh
./test-api.sh
```

### 构建生产版本

```bash
# 构建后端
cd next-api
npm run build

# 构建前端
cd ../vite-app
npm run build:pro
```

## Demo操作说明

### 前端演示页面

1. **前端面试题演示**
   - 访问: http://localhost:5173/#/fe_interview
   - 包含多个前端面试题的实现和演示
   - 通过路由`/fe_interview3+1/xx`访问具体题目

2. **3D图形演示**
   - 基于Three.js的3D图形展示
   - 包含物理引擎(Rapier3D)的演示

3. **拖拽组件演示**
   - 展示vuedraggable的使用示例
   - 可拖拽排序的组件展示

### API功能

1. **认证接口**
   - 登录: POST /api/login
   - 令牌刷新: POST /api/refresh-token

2. **数据流演示**
   - 提供多种数据流处理的API示例
   - 支持服务器端事件流

## 部署

项目包含Vercel部署配置文件(vercel.json)，可直接部署到Vercel平台：

```bash
vercel --prod
```

## 注意事项

1. 环境配置
   - 复制.env.local.example为.env.local并配置必要的环境变量

2. 权限管理
   - 部分演示页面需要特定角色权限
   - 登录后才能访问受保护的路由

3. 令牌刷新
   - 系统会自动刷新即将过期的JWT令牌
   - 令牌过期时会自动跳转至登录页
        

        # Project Introduction  
This project is a full-stack application comprising two main components: a Next.js-based backend API service and a Vite+Vue frontend application. Developed with TypeScript, it combines modern frontend frameworks and backend technologies to deliver rich functionality and demonstration examples.  

## Project Structure  

```
next_vite/
├── next-api/           # Next.js backend API service
├── vite-app/           # Vite+Vue frontend application
├── start-dev.sh        # Development environment startup script
├── test-api.sh         # API testing script
└── vercel.json         # Vercel deployment configuration
```  

## Technology Stack  

### Backend (next-api)  
- Next.js 14  
- TypeScript  
- MongoDB + Mongoose  
- JWT Authentication  
- Sentry Error Monitoring  

### Frontend (vite-app)  
- Vue 3 + TypeScript  
- Vite  
- Element Plus UI Components  
- Pinia State Management  
- Vue Router  
- Three.js 3D Graphics  
- Drag-and-Drop Components (vuedraggable)  

## Installation & Startup  

### Prerequisites  
- Node.js (v20.0.0+)  
- npm (v9.0.0+)  

### Install Dependencies  

```bash  
# Install backend dependencies  
cd next-api  
npm install  

# Install frontend dependencies  
cd ../vite-app  
npm install  
```  

### Start Development Environment  

Use the startup script to launch both services simultaneously:  

```bash  
chmod +x start-dev.sh  
./start-dev.sh  
```  

After services start, access them at:  
- Frontend App: http://localhost:5173  
- Backend API: http://localhost:9527  
- API Documentation: http://localhost:9527  

## Usage  

### API Testing  

Test APIs using the provided script:  

```bash  
chmod +x test-api.sh  
./test-api.sh  
```  

### Build Production Version  

```bash  
# Build backend  
cd next-api  
npm run build  

# Build frontend  
cd ../vite-app  
npm run build:pro  
```  

## Demo Instructions  

### Frontend Demo Pages  

1. **Frontend Interview Demos**  
   - Access: http://localhost:5173/#/fe_interview  
   - Implements multiple frontend interview questions  
   - Access specific demos via routes like `/fe_interview3+1/xx`  

2. **3D Graphics Demo**  
   - Three.js-powered 3D visualizations  
   - Physics engine demos (Rapier3D)  

3. **Drag-and-Drop Component Demo**  
   - vuedraggable usage examples  
   - Interactive sortable components  

### API Features  

1. **Authentication APIs**  
   - Login: POST /api/login  
   - Token Refresh: POST /api/refresh-token  

2. **Data Flow Demos**  
   - Multiple data streaming API examples  
   - Supports server-sent events (SSE)  

## Deployment  

Includes Vercel configuration (vercel.json) for direct deployment:  

```bash  
vercel --prod  
```  

## Important Notes  

1. Environment Configuration  
   - Copy `.env.local.example` to `.env.local` and configure required variables  

2. Permission Management  
   - Some demo pages require specific role permissions  
   - Protected routes require login  

3. Token Refresh  
   - System automatically refreshes near-expiry JWT tokens  
   - Redirects to login page upon token expiration