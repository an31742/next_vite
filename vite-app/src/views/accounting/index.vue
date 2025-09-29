<template>
  <div class="accounting-entry">
    <el-card class="entry-card">
      <template #header>
        <div class="card-header">
          <h2>记账本管理系统</h2>
        </div>
      </template>

      <div class="entry-content">
        <div class="welcome-banner">
          <div class="icon-wrapper">
            <el-icon size="48" color="#409eff" class="bounce-animation"><Wallet /></el-icon>
          </div>
          <h1 class="fade-in">欢迎使用记账本</h1>
          <p class="description fade-in-delay">
            轻松管理您的个人或家庭财务，记录每一笔收支，掌握资金流向
          </p>
        </div>

        <div class="features-grid">
          <div
            v-for="(feature, index) in features"
            :key="feature.path"
            class="feature-item"
            @click="goTo(feature.path)"
            :class="`fade-in-up fade-in-delay-${index + 1}`"
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

        <div class="quick-actions fade-in-up fade-in-delay-7">
          <el-button type="primary" @click="goTo('/accounting/dashboard')" size="large">
            <el-icon><House /></el-icon>
            进入记账本
          </el-button>
          <el-button @click="goTo('/accounting/transactions')" size="large">
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
  Plus,
  Wallet
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  .entry-card {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    height: calc(100vh - 40px);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

    .card-header {
      text-align: center;
      padding: 20px 0;

      h2 {
        margin: 0;
        color: #1a1a1a;
        font-size: 28px;
        font-weight: 600;
      }
    }

    .entry-content {
      .welcome-banner {
        text-align: center;
        padding: 30px 0;
        background: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
        border-radius: 8px;
        margin-bottom: 40px;

        .icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        h1 {
          margin: 20px 0 10px;
          color: #1a1a1a;
          font-size: 32px;
          font-weight: 600;
        }

        .description {
          text-align: center;
          font-size: 18px;
          color: #666;
          margin: 0;
          line-height: 1.6;
        }
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
          border: 1px solid #ebeef5;

          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.15);
            border-color: #409eff;
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
        padding: 20px 0;

        .el-button {
          margin: 0 15px;
          padding: 16px 32px;
          font-size: 16px;
          border-radius: 8px;

          .el-icon {
            margin-right: 8px;
          }

          &:first-child {
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }
        }
      }
    }
  }
}

// 动画效果
.bounce-animation {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

// 淡入动画
.fade-in {
  animation: fadeIn 1s ease-in;
}

.fade-in-delay {
  animation: fadeIn 1s ease-in 0.3s both;
}

.fade-in-delay-1 { animation: fadeIn 0.5s ease-in 0.1s both; }
.fade-in-delay-2 { animation: fadeIn 0.5s ease-in 0.2s both; }
.fade-in-delay-3 { animation: fadeIn 0.5s ease-in 0.3s both; }
.fade-in-delay-4 { animation: fadeIn 0.5s ease-in 0.4s both; }
.fade-in-delay-5 { animation: fadeIn 0.5s ease-in 0.5s both; }
.fade-in-delay-6 { animation: fadeIn 0.5s ease-in 0.6s both; }
.fade-in-delay-7 { animation: fadeIn 0.5s ease-in 0.7s both; }

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.fade-in-up.fade-in-delay-1 { animation: fadeInUp 0.6s ease-out 0.1s both; }
.fade-in-up.fade-in-delay-2 { animation: fadeInUp 0.6s ease-out 0.2s both; }
.fade-in-up.fade-in-delay-3 { animation: fadeInUp 0.6s ease-out 0.3s both; }
.fade-in-up.fade-in-delay-4 { animation: fadeInUp 0.6s ease-out 0.4s both; }
.fade-in-up.fade-in-delay-5 { animation: fadeInUp 0.6s ease-out 0.5s both; }
.fade-in-up.fade-in-delay-6 { animation: fadeInUp 0.6s ease-out 0.6s both; }
.fade-in-up.fade-in-delay-7 { animation: fadeInUp 0.6s ease-out 0.7s both; }

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>