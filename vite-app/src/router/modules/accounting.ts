// 记账本路由配置
import { RouteRecordRaw } from 'vue-router'

const accountingRoutes: RouteRecordRaw[] = [
  {
    path: '/accounting',
    component: () => import('@/views/accounting/layout.vue'),
    redirect: '/accounting/dashboard',
    meta: { title: '记账本' },
    children: [
      {
        path: 'dashboard',
        name: 'AccountingDashboard',
        component: () => import('@/views/accounting/dashboard.vue'),
        meta: { title: '概览', icon: 'House' }
      },
      {
        path: 'transactions',
        name: 'AccountingTransactions',
        component: () => import('@/views/accounting/transactions-simple.vue'),
        meta: { title: '交易记录', icon: 'Document' }
      },
      {
        path: 'statistics',
        name: 'AccountingStatistics',
        component: () => import('@/views/accounting/statistics.vue'),
        meta: { title: '统计分析', icon: 'PieChart' }
      },
      {
        path: 'categories',
        name: 'AccountingCategories',
        component: () => import('@/views/accounting/categories.vue'),
        meta: { title: '分类管理', icon: 'Collection' }
      },
      {
        path: 'calendar',
        name: 'AccountingCalendar',
        component: () => import('@/views/accounting/calendar.vue'),
        meta: { title: '日历视图', icon: 'Calendar' }
      },
      {
        path: 'admin',
        name: 'AccountingAdmin',
        component: () => import('@/views/accounting/admin.vue'),
        meta: { title: '系统管理', icon: 'Setting', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'user-transactions',
        name: 'UserTransactions',
        component: () => import('@/views/accounting/user-transactions.vue'),
        meta: { title: '用户交易记录', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'home',
        name: 'AccountingHome',
        component: () => import('@/views/accounting/index.vue'),
        meta: { title: '记账本首页' }
      }
    ]
  }
]

export default accountingRoutes