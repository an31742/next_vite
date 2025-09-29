<template>
  <div class="accounting-layout">
    <!-- 侧边栏导航 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>记账本</h2>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/accounting/dashboard">
          <el-icon><House /></el-icon>
          <span>概览</span>
        </el-menu-item>

        <el-menu-item index="/accounting/transactions">
          <el-icon><Document /></el-icon>
          <span>交易记录</span>
        </el-menu-item>

        <el-menu-item index="/accounting/statistics">
          <el-icon><PieChart /></el-icon>
          <span>统计分析</span>
        </el-menu-item>

        <el-menu-item index="/accounting/calendar">
          <el-icon><Calendar /></el-icon>
          <span>日历视图</span>
        </el-menu-item>

        <el-menu-item index="/accounting/categories">
          <el-icon><Collection /></el-icon>
          <span>分类管理</span>
        </el-menu-item>

        <el-menu-item index="/accounting/admin">
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区域 -->
    <el-main class="main-content">
      <router-view />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Document, PieChart, Calendar, Collection, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const activeMenu = ref(route.path)

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath
  }
)

const handleMenuSelect = (index: string) => {
  router.push(index)
}
</script>

<style scoped lang="scss">
.accounting-layout {
  display: flex;
  height: 100vh;
  background: #f5f5f5;

  .sidebar {
    background: #ffffff;
    border-right: 1px solid #ebeef5;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #ebeef5;

      h2 {
        margin: 0;
        color: #1a1a1a;
        font-size: 20px;
        font-weight: 600;
      }
    }

    .sidebar-menu {
      border: none;

      :deep(.el-menu-item) {
        height: 50px;
        line-height: 50px;

        &.is-active {
          background-color: #ecf5ff;
          color: #409eff;

          .el-icon {
            color: #409eff;
          }
        }

        .el-icon {
          margin-right: 8px;
          width: 24px;
          text-align: center;
          font-size: 18px;
        }
      }
    }
  }

  .main-content {
    flex: 1;
    padding: 0;
    overflow: auto;
  }
}
</style>