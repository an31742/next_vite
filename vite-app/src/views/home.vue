<template>
  <div class="front-main">
    <div class="home-container">
      <div class="welcome-section">
        <h1>欢迎使用管理系统</h1>
        <p>请选择您要使用的功能模块</p>
      </div>

      <div class="modules-grid">
        <div class="module-card" @click="toDemo">
          <div class="module-icon" style="background-color: #409eff;">
            <el-icon size="32" color="white"><Document /></el-icon>
          </div>
          <h3>示例功能</h3>
          <p>查看系统演示功能</p>
        </div>

        <div class="module-card" @click="toVue3">
          <div class="module-icon" style="background-color: #67c23a;">
            <el-icon size="32" color="white"><Setting /></el-icon>
          </div>
          <h3>Vue3 示例</h3>
          <p>Vue3 相关功能演示</p>
        </div>

        <div class="module-card" @click="fe_interview">
          <div class="module-icon" style="background-color: #e6a23c;">
            <el-icon size="32" color="white"><Help /></el-icon>
          </div>
          <h3>前端面试</h3>
          <p>前端面试题库练习</p>
        </div>

        <div class="module-card" @click="toAccounting">
          <div class="module-icon" style="background-color: #f56c6c;">
            <el-icon size="32" color="white"><Wallet /></el-icon>
          </div>
          <h3>记账本</h3>
          <p>个人财务管理工具</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { Document, Setting, Help, Wallet } from '@element-plus/icons-vue'

export default defineComponent({
  components: {
    Document,
    Setting,
    Help,
    Wallet
  },
  setup() {
    const router = useRouter();

    const toVue3 = () => {
      router.push({
        path: "/vue3",
        query: {
          id: 1,
        },
      });
    };

    const fe_interview = () => {
      router.push({
        path: "/fe_interview3+1/01",
      });
    };

    const toDemo = () => {
      router.push({
        path: "/demo/toLocalStorage",
      });
    };

    const toAccounting = () => {
      router.push({
        path: "/accounting-home",
      });
    };

    return {
      toDemo,
      toVue3,
      fe_interview,
      toAccounting
    };
  },
});
</script>

<style scoped lang="less">
.front-main {
  width: 100%;
  height: 100%;
  background: url("../assets/bgLogin.webp") 100% 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-container {
  max-width: 1200px;
  padding: 40px;
  text-align: center;

  .welcome-section {
    margin-bottom: 60px;

    h1 {
      font-size: 36px;
      color: #333;
      margin-bottom: 16px;
    }

    p {
      font-size: 18px;
      color: #666;
    }
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 30px;

    .module-card {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      padding: 30px 20px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      .module-icon {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }

      h3 {
        font-size: 20px;
        color: #333;
        margin: 0 0 12px 0;
      }

      p {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }
  }
}
</style>