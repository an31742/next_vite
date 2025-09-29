<template>
  <div class="accounting-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <h1 class="page-title">记账本概览</h1>
      <el-button type="primary" @click="showAddTransaction = true">
        <el-icon><Plus /></el-icon>
        快速记账
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <!-- 今日收支 -->
        <el-col :span="6">
          <el-card class="stats-card today">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="24"><Calendar /></el-icon>
              </div>
              <div class="card-info">
                <h3>今日收支</h3>
                <p class="amount" :class="{ positive: todayBalance >= 0, negative: todayBalance < 0 }">
                  ¥{{ formatAmount(todayBalance) }}
                </p>
                <span class="detail">收入 ¥{{ formatAmount(todayStats.income) }} | 支出 ¥{{ formatAmount(todayStats.expense) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 本月收支 -->
        <el-col :span="6">
          <el-card class="stats-card month">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="24"><Wallet /></el-icon>
              </div>
              <div class="card-info">
                <h3>本月收支</h3>
                <p class="amount" :class="{ positive: monthBalance >= 0, negative: monthBalance < 0 }">
                  ¥{{ formatAmount(monthBalance) }}
                </p>
                <span class="detail">收入 ¥{{ formatAmount(monthStats.income) }} | 支出 ¥{{ formatAmount(monthStats.expense) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 累计收入 -->
        <el-col :span="6">
          <el-card class="stats-card income">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="24"><TrendCharts /></el-icon>
              </div>
              <div class="card-info">
                <h3>累计收入</h3>
                <p class="amount positive">¥{{ formatAmount(monthStats.income) }}</p>
                <span class="detail">{{ monthStats.incomeCount }} 笔交易</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 累计支出 -->
        <el-col :span="6">
          <el-card class="stats-card expense">
            <div class="card-content">
              <div class="card-icon">
                <el-icon size="24"><Minus /></el-icon>
              </div>
              <div class="card-info">
                <h3>累计支出</h3>
                <p class="amount negative">¥{{ formatAmount(monthStats.expense) }}</p>
                <span class="detail">{{ monthStats.expenseCount }} 笔交易</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 收支趋势图 -->
        <el-col :span="16">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>本月收支趋势</h3>
                <el-button-group>
                  <el-button :type="chartType === 'line' ? 'primary' : ''" @click="chartType = 'line'">折线图</el-button>
                  <el-button :type="chartType === 'bar' ? 'primary' : ''" @click="chartType = 'bar'">柱状图</el-button>
                </el-button-group>
              </div>
            </template>
            <div id="trend-chart" style="height: 300px;"></div>
          </el-card>
        </el-col>

        <!-- 分类占比图 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>支出分类占比</h3>
                <el-switch v-model="showIncomeChart" active-text="收入" inactive-text="支出" />
              </div>
            </template>
            <div id="category-chart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近交易 -->
    <div class="recent-transactions">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>最近交易</h3>
            <el-button text @click="$router.push('/accounting/transactions')">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </template>

        <el-table :data="recentTransactions" style="width: 100%" stripe>
          <el-table-column prop="date" label="日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>

          <el-table-column prop="category.name" label="分类" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                {{ row.category?.icon }} {{ row.category?.name }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="note" label="备注" min-width="200" show-overflow-tooltip />

          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">
              <span :class="{ 'amount-income': row.type === 'income', 'amount-expense': row.type === 'expense' }">
                {{ row.type === 'income' ? '+' : '-' }}¥{{ formatAmount(row.amount) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" text @click="editTransaction(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 快速记账对话框 -->
    <QuickTransactionDialog
      v-model="showAddTransaction"
      @success="handleTransactionSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Calendar, Wallet, TrendCharts, Minus, ArrowRight } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMonthlyStatistics, getRecentTransactions, getDailyTransactions } from '@/service/accounting'
import QuickTransactionDialog from '@/components/accounting/QuickTransactionDialog.vue'

// 响应式数据
const showAddTransaction = ref(false)
const chartType = ref<'line' | 'bar'>('line')
const showIncomeChart = ref(false)
const loading = ref(false)

// 统计数据
const todayStats = reactive({
  income: 0,
  expense: 0,
  count: 0
})

const monthStats = reactive({
  income: 0,
  expense: 0,
  incomeCount: 0,
  expenseCount: 0,
  transactionCount: 0
})

const dailyTrend = ref<any[]>([])
const categoryStats = ref<any[]>([])
const recentTransactions = ref<any[]>([])

// 计算属性
const todayBalance = computed(() => todayStats.income - todayStats.expense)
const monthBalance = computed(() => monthStats.income - monthStats.expense)

// 图表实例
let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

const loadTodayData = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await getDailyTransactions(today)
    if (response.code === 200) {
      const { summary } = response.data
      todayStats.income = summary.totalIncome
      todayStats.expense = summary.totalExpense
      todayStats.count = summary.count
    }
  } catch (error) {
    console.error('加载今日数据失败:', error)
  }
}

const loadMonthlyData = async () => {
  try {
    const now = new Date()
    const response = await getMonthlyStatistics(now.getFullYear(), now.getMonth() + 1)
    if (response.code === 200) {
      const { summary, dailyTrend: trend, categoryStats: stats } = response.data

      // 更新月度统计
      monthStats.income = summary.income
      monthStats.expense = summary.expense
      monthStats.transactionCount = summary.transactionCount

      // 计算收入和支出笔数
      monthStats.incomeCount = stats.income.reduce((sum, item) => sum + item.count, 0)
      monthStats.expenseCount = stats.expense.reduce((sum, item) => sum + item.count, 0)

      // 更新图表数据
      dailyTrend.value = trend
      categoryStats.value = showIncomeChart.value ? stats.income : stats.expense

      // 渲染图表
      renderTrendChart()
      renderCategoryChart()
    }
  } catch (error) {
    console.error('加载月度数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

const loadRecentTransactions = async () => {
  try {
    const response = await getRecentTransactions({ page: 1, pageSize: 10 })
    if (response.code === 200) {
      recentTransactions.value = response.data.list
    }
  } catch (error) {
    console.error('加载最近交易失败:', error)
  }
}

const renderTrendChart = () => {
  if (!trendChart) {
    trendChart = echarts.init(document.getElementById('trend-chart'))
  }

  const dates = dailyTrend.value.map(item => item.date.slice(5)) // MM-DD
  const incomeData = dailyTrend.value.map(item => item.income)
  const expenseData = dailyTrend.value.map(item => item.expense)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          result += `${param.marker}${param.seriesName}: ¥${formatAmount(param.value)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['收入', '支出']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${value}`
      }
    },
    series: [
      {
        name: '收入',
        type: chartType.value,
        data: incomeData,
        itemStyle: { color: '#52C41A' },
        smooth: chartType.value === 'line'
      },
      {
        name: '支出',
        type: chartType.value,
        data: expenseData,
        itemStyle: { color: '#FF6B6B' },
        smooth: chartType.value === 'line'
      }
    ]
  }

  trendChart.setOption(option)
}

const renderCategoryChart = () => {
  if (!categoryChart) {
    categoryChart = echarts.init(document.getElementById('category-chart'))
  }

  const data = categoryStats.value.map(item => ({
    name: item.categoryName,
    value: item.amount
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    series: [
      {
        name: showIncomeChart.value ? '收入分类' : '支出分类',
        type: 'pie',
        radius: '80%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  categoryChart.setOption(option)
}

const editTransaction = (transaction: any) => {
  // 跳转到交易编辑页面
  $router.push(`/accounting/transactions/${transaction.id}`)
}

const handleTransactionSuccess = () => {
  // 刷新数据
  loadTodayData()
  loadMonthlyData()
  loadRecentTransactions()
  ElMessage.success('记账成功')
}

// 监听图表类型变化
watch(chartType, () => {
  renderTrendChart()
})

// 监听收入/支出切换
watch(showIncomeChart, () => {
  categoryStats.value = showIncomeChart.value
    ? monthStats.income
    : monthStats.expense
  renderCategoryChart()
})

// 页面加载
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadTodayData(),
      loadMonthlyData(),
      loadRecentTransactions()
    ])
  } finally {
    loading.value = false
  }

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    categoryChart?.resize()
  })
})

// 页面销毁时清理
onUnmounted(() => {
  trendChart?.dispose()
  categoryChart?.dispose()
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped lang="scss">
.accounting-dashboard {
  padding: 20px;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
    }
  }

  .stats-cards {
    margin-bottom: 24px;

    .stats-card {
      height: 120px;

      .card-content {
        display: flex;
        align-items: center;
        height: 100%;

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;

          .today & {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .month & {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }

          .income & {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
          }

          .expense & {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            color: white;
          }
        }

        .card-info {
          flex: 1;

          h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #666;
            font-weight: 500;
          }

          .amount {
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 600;

            &.positive {
              color: #52C41A;
            }

            &.negative {
              color: #FF6B6B;
            }
          }

          .detail {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
  }

  .charts-section {
    margin-bottom: 24px;

    .chart-card {
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
    }
  }

  .recent-transactions {
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

    .amount-income {
      color: #52C41A;
      font-weight: 600;
    }

    .amount-expense {
      color: #FF6B6B;
      font-weight: 600;
    }
  }
}
</style>