# 记账本管理系统

## 功能概述

记账本管理系统是一个完整的个人财务管理解决方案，包含以下核心功能模块：

### 1. 概览页面 (Dashboard)
- 实时显示今日和本月的收支统计
- 收支趋势图表展示
- 分类占比饼图
- 最近交易记录列表
- 快速记账入口

### 2. 交易记录页面 (Transactions)
- 完整的交易记录列表管理
- 支持收入和支出类型筛选
- 按分类、日期范围和关键词搜索
- 新增、编辑、删除交易记录
- 批量操作功能
- 数据导出功能

### 3. 统计分析页面 (Statistics)
- 月度收支趋势分析（折线图/柱状图）
- 收入和支出分类占比分析（饼图）
- 分类排行榜
- 自定义时间范围统计
- 数据可视化展示

### 4. 日历视图页面 (Calendar)
- 日历形式展示每日收支情况
- 点击日期查看当日详细交易记录
- 直观的日历导航
- 快速记账功能

### 5. 分类管理页面 (Categories)
- 自定义收入和支出分类
- 拖拽排序功能
- 分类图标和颜色设置
- 系统默认分类管理

### 6. 系统管理页面 (Admin)
- 用户数据统计和管理
- 批量用户初始化
- 数据重置功能
- 系统状态监控

## 技术架构

### 前端技术栈
- Vue 3 + TypeScript
- Element Plus UI 组件库
- ECharts 数据可视化
- Vue Router 路由管理
- Pinia 状态管理

### 后端技术栈
- Next.js API Routes
- MongoDB 数据库
- JWT 认证授权

## 开发指南

### 项目结构
```
src/
├── views/accounting/          # 记账本页面组件
│   ├── dashboard.vue          # 概览页面
│   ├── transactions.vue       # 交易记录页面
│   ├── statistics.vue         # 统计分析页面
│   ├── calendar.vue           # 日历视图页面
│   ├── categories.vue         # 分类管理页面
│   ├── admin.vue             # 系统管理页面
│   ├── layout.vue            # 布局组件
│   └── index.vue             # 入口页面
├── components/accounting/     # 记账本专用组件
│   ├── TransactionFormDialog.vue  # 交易表单对话框
│   └── QuickTransactionDialog.vue # 快速记账对话框
├── router/modules/accounting.ts   # 路由配置
└── service/accounting.ts          # API 服务
```

### 启动项目
```bash
# 进入项目目录
cd vite-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问地址
- 记账本首页: http://localhost:5173/#/accounting-home
- 记账本概览: http://localhost:5173/#/accounting/dashboard
- 交易记录: http://localhost:5173/#/accounting/transactions
- 统计分析: http://localhost:5173/#/accounting/statistics
- 日历视图: http://localhost:5173/#/accounting/calendar
- 分类管理: http://localhost:5173/#/accounting/categories
- 系统管理: http://localhost:5173/#/accounting/admin

## 功能特点

### 用户体验
- 响应式设计，支持多设备访问
- 直观的图表展示，数据一目了然
- 流畅的操作体验，支持快捷键操作
- 丰富的数据筛选和搜索功能

### 数据安全
- JWT Token 认证授权
- 用户数据隔离
- 数据备份和恢复机制
- 操作日志记录

### 扩展性
- 模块化设计，易于功能扩展
- 统一的 API 接口规范
- 可配置的分类管理系统
- 支持多用户管理

## 开发计划

### 已完成
- [x] 基础页面框架搭建
- [x] 路由配置和导航菜单
- [x] 核心功能页面开发
- [x] 数据可视化集成
- [x] 表单验证和错误处理

### 待完善
- [ ] API 接口对接
- [ ] 权限控制系统
- [ ] 数据导出功能
- [ ] 移动端适配优化
- [ ] 性能优化和测试

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进记账本管理系统。

### 开发规范
1. 遵循项目现有的代码风格和结构
2. 新增功能需提供相应的单元测试
3. 提交前确保代码通过 ESLint 检查
4. 编写清晰的提交信息

### 提交流程
1. Fork 项目仓库
2. 创建功能分支
3. 编写代码和测试
4. 提交 Pull Request