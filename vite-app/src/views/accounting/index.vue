<template>
  <div class="accounting-entry">
    <el-card class="entry-card">
      <template #header>
        <div class="card-header">
          <h2>记账本管理系统</h2>
        </div>
      </template>

      <div class="entry-content">
        <p class="description">
          欢迎使用记账本管理系统！在这里您可以管理个人或家庭的收支记录，
          查看统计分析，设置分类标签等。
        </p>

        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.path"
            class="feature-item"
            @click="goTo(feature.path)"
          >
            <div class="feature-icon" :style="{ backgroundColor: feature.color }">
              <el-icon size="24" color="white">
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <div class="feature-info">
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <el-button type="primary" @click="goTo('/accounting/dashboard')">
            <el-icon><House /></el-icon>
            进入记账本
          </el-button>
          <el-button @click="goTo('/accounting/transactions')">
            <el-icon><Plus /></el-icon>
            快速记账
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  House,
  Document,
  PieChart,
  Calendar,
  Collection,
  Setting,
  Plus
} from '@element-plus/icons-vue'

const router = useRouter()

const features = [
  {
    path: '/accounting/dashboard',
    title: '概览',
    description: '查看收支总览和最近交易记录',
    icon: House,
    color: '#409eff'
  },
  {
    path: '/accounting/transactions',
    title: '交易记录',
    description: '管理所有收入和支出记录',
    icon: Document,
    color: '#67c23a'
  },
  {
    path: '/accounting/statistics',
    title: '统计分析',
    description: '查看收支统计图表和趋势分析',
    icon: PieChart,
    color: '#e6a23c'
  },
  {
    path: '/accounting/calendar',
    title: '日历视图',
    description: '按日查看交易记录',
    icon: Calendar,
    color: '#f56c6c'
  },
  {
    path: '/accounting/categories',
    title: '分类管理',
    description: '自定义收入和支出分类',
    icon: Collection,
    color: '#909399'
  },
  {
    path: '/accounting/admin',
    title: '系统管理',
    description: '系统设置和用户管理',
    icon: Setting,
    color: '#722ed1'
  }
]

const goTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.accounting-entry {
  padding: 20px;
  height: 100%;
  background: #f5f5f5;

  .entry-card {
    max-width: 1200px;
    margin: 0 auto;
    height: calc(100vh - 40px);

    .card-header {
      text-align: center;

      h2 {
        margin: 0;
        color: #1a1a1a;
        font-size: 28px;
        font-weight: 600;
      }
    }

    .entry-content {
      .description {
        text-align: center;
        font-size: 16px;
        color: #666;
        margin-bottom: 40px;
        line-height: 1.6;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 40px;

        .feature-item {
          display: flex;
          align-items: flex-start;
          padding: 20px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
          }

          .feature-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            flex-shrink: 0;
          }

          .feature-info {
            h3 {
              margin: 0 0 8px 0;
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
            }

            p {
              margin: 0;
              font-size: 14px;
              color: #666;
              line-height: 1.5;
            }
          }
        }
      }

      .quick-actions {
        text-align: center;

        .el-button {
          margin: 0 10px;
          padding: 12px 24px;
          font-size: 16px;

          .el-icon {
            margin-right: 8px;
          }
        }
      }
    }
  }
}
</style>