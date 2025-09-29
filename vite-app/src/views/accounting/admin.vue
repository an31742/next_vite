<template>
  <div class="admin-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">系统管理</h1>
        <p class="page-description">管理系统设置和用户数据</p>
      </div>
    </div>

    <!-- 管理面板 -->
    <el-row :gutter="20">
      <!-- 数据统计 -->
      <el-col :span="24">
        <el-card class="stats-card">
          <template #header>
            <h3>系统概览</h3>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-icon users">
                  <el-icon size="24"><User /></el-icon>
                </div>
                <div class="stat-info">
                  <h4>用户总数</h4>
                  <p class="stat-value">{{ systemStats.userCount }}</p>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-icon transactions">
                  <el-icon size="24"><Document /></el-icon>
                </div>
                <div class="stat-info">
                  <h4>交易记录</h4>
                  <p class="stat-value">{{ systemStats.transactionCount }}</p>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-icon income">
                  <el-icon size="24"><TrendCharts /></el-icon>
                </div>
                <div class="stat-info">
                  <h4>总收入</h4>
                  <p class="stat-value">¥{{ formatAmount(systemStats.totalIncome) }}</p>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-icon expense">
                  <el-icon size="24"><Minus /></el-icon>
                </div>
                <div class="stat-info">
                  <h4>总支出</h4>
                  <p class="stat-value">¥{{ formatAmount(systemStats.totalExpense) }}</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 用户管理 -->
      <el-col :span="16">
        <el-card class="users-card">
          <template #header>
            <div class="card-header">
              <h3>用户管理</h3>
              <el-button type="primary" @click="loadUsers">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <el-table :data="users" style="width: 100%" v-loading="loading">
            <el-table-column prop="user.nickname" label="用户昵称" min-width="150">
              <template #default="{ row }">
                <div class="user-info">
                  <el-avatar :size="32" :src="row.user.avatar || ''">{{ row.user.nickname?.slice(0, 2) }}</el-avatar>
                  <span class="nickname">{{ row.user.nickname }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="user.id" label="用户ID" min-width="120" show-overflow-tooltip />

            <el-table-column label="交易统计" min-width="200">
              <template #default="{ row }">
                <div class="user-stats">
                  <div class="stat-item">
                    <span class="label">收入:</span>
                    <span class="value amount-income">¥{{ formatAmount(row.summary.income) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">支出:</span>
                    <span class="value amount-expense">¥{{ formatAmount(row.summary.expense) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">余额:</span>
                    <span class="value" :class="{ 'amount-income': row.summary.balance >= 0, 'amount-expense': row.summary.balance < 0 }">
                      ¥{{ formatAmount(row.summary.balance) }}
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="summary.count" label="交易笔数" width="100" align="center" />

            <el-table-column prop="user.createdAt" label="注册时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.user.createdAt) }}
              </template>
            </el-table-column>

            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" text @click="resetUserTransactions(row.user.id)">
                  重置数据
                </el-button>
                <el-button size="small" text type="danger" @click="deleteUser(row.user.id)">
                  删除用户
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 系统操作 -->
      <el-col :span="8">
        <el-card class="actions-card">
          <template #header>
            <h3>系统操作</h3>
          </template>

          <div class="actions-list">
            <div class="action-item">
              <h4>数据重置</h4>
              <p class="description">重置所有用户的交易数据</p>
              <el-button type="danger" @click="resetAllUsers" :loading="resetLoading">
                重置所有用户数据
              </el-button>
            </div>

            <div class="action-item">
              <h4>批量初始化</h4>
              <p class="description">初始化指定用户或所有用户</p>
              <el-button @click="showBatchInit = true">
                批量初始化
              </el-button>
            </div>

            <div class="action-item">
              <h4>数据库清理</h4>
              <p class="description">清空所有数据（谨慎操作）</p>
              <el-button type="danger" @click="clearDatabase">
                清空数据库
              </el-button>
            </div>

            <div class="action-item">
              <h4>数据导出</h4>
              <p class="description">导出系统数据</p>
              <el-button>
                导出数据
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 批量初始化对话框 -->
    <el-dialog
      v-model="showBatchInit"
      title="批量用户初始化"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="目标用户">
          <el-radio-group v-model="batchInitForm.targetUsers">
            <el-radio label="all">所有用户</el-radio>
            <el-radio label="new_only">仅新用户</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="初始化类型">
          <el-radio-group v-model="batchInitForm.initializeType">
            <el-radio label="amount_only">金额清零</el-radio>
            <el-radio label="delete_all">删除记录</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="强制重置">
          <el-switch v-model="batchInitForm.forceReset" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchInit = false">取消</el-button>
        <el-button type="primary" @click="executeBatchInit" :loading="batchInitLoading">执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Document, TrendCharts, Minus, Refresh } from '@element-plus/icons-vue'

// 简化的类型定义
interface UserStat {
  user: {
    id: string
    nickname?: string
    avatar?: string
    createdAt?: string
  }
  summary: {
    income: number
    expense: number
    balance: number
    count: number
  }
}

interface SystemStats {
  userCount: number
  transactionCount: number
  totalIncome: number
  totalExpense: number
}

// 模拟API函数
const getUsersStats = async () => {
  return {
    code: 200,
    data: {
      userStats: []
    }
  }
}

const resetUserTransactionsApi = async (userId: string) => {
  return { code: 200 }
}

const batchInitializeUsers = async (data: any) => {
  return { code: 200 }
}

const clearDatabaseApi = async () => {
  return { code: 200 }
}

// 响应式数据
const loading = ref(false)
const resetLoading = ref(false)
const batchInitLoading = ref(false)
const showBatchInit = ref(false)

// 数据
const users = ref<UserStat[]>([])
const systemStats = reactive<SystemStats>({
  userCount: 0,
  transactionCount: 0,
  totalIncome: 0,
  totalExpense: 0
})

// 表单数据
const batchInitForm = reactive({
  targetUsers: 'all',
  initializeType: 'amount_only',
  forceReset: false
})

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await getUsersStats()
    if (response.code === 200) {
      users.value = response.data?.userStats || []

      // 计算系统统计
      systemStats.userCount = users.value.length
      systemStats.transactionCount = users.value.reduce((sum, user) => sum + user.summary.count, 0)
      systemStats.totalIncome = users.value.reduce((sum, user) => sum + user.summary.income, 0)
      systemStats.totalExpense = users.value.reduce((sum, user) => sum + user.summary.expense, 0)
    }
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const resetUserTransactions = async (userId: string) => {
  try {
    await ElMessageBox.confirm('确定要重置该用户的交易数据吗？此操作不可恢复。', '确认重置', {
      type: 'warning'
    })

    const response = await resetUserTransactionsApi(userId)
    if (response.code === 200) {
      ElMessage.success('重置成功')
      loadUsers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置用户数据失败:', error)
      ElMessage.error('重置失败')
    }
  }
}

const resetAllUsers = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有用户的交易数据吗？此操作不可恢复。', '确认重置', {
      type: 'warning'
    })

    resetLoading.value = true
    // 这里应该调用实际的API
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('所有用户数据已重置')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置所有用户数据失败:', error)
      ElMessage.error('重置失败')
    }
  } finally {
    resetLoading.value = false
  }
}

const executeBatchInit = async () => {
  try {
    batchInitLoading.value = true

    const response = await batchInitializeUsers(batchInitForm)
    if (response.code === 200) {
      ElMessage.success('批量初始化完成')
      showBatchInit.value = false
      loadUsers()
    }
  } catch (error) {
    console.error('批量初始化失败:', error)
    ElMessage.error('初始化失败')
  } finally {
    batchInitLoading.value = false
  }
}

const clearDatabase = async () => {
  try {
    await ElMessageBox.prompt('请输入"CONFIRM"以确认清空数据库', '危险操作', {
      inputPattern: /^CONFIRM$/,
      inputErrorMessage: '请输入"CONFIRM"确认操作',
      type: 'warning'
    })

    const response = await clearDatabaseApi()
    if (response.code === 200) {
      ElMessage.success('数据库已清空')
      loadUsers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空数据库失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

const deleteUser = async (userId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？此操作不可恢复。', '确认删除', {
      type: 'error'
    })

    ElMessage.info('删除用户功能开发中...')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
    }
  }
}

// 页面加载
onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
.admin-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .header-left {
      .page-title {
        margin: 0 0 4px 0;
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .page-description {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
    }
  }

  .stats-card {
    margin-bottom: 24px;

    .stat-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        color: white;

        &.users {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.transactions {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.income {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.expense {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }
      }

      .stat-info {
        h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .stat-value {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }
      }
    }
  }

  .users-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .user-info {
      display: flex;
      align-items: center;

      .nickname {
        margin-left: 8px;
        font-weight: 500;
      }
    }

    .user-stats {
      display: flex;
      gap: 16px;

      .stat-item {
        display: flex;
        flex-direction: column;

        .label {
          font-size: 12px;
          color: #999;
          margin-bottom: 2px;
        }

        .value {
          font-weight: 600;
        }
      }
    }

    .amount-income {
      color: #52c41a;
    }

    .amount-expense {
      color: #ff4d4f;
    }
  }

  .actions-card {
    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .actions-list {
      .action-item {
        padding: 16px 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }

        h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .description {
          margin: 0 0 12px 0;
          font-size: 12px;
          color: #999;
        }

        .el-button {
          width: 100%;
        }
      }
    }
  }
}
</style>