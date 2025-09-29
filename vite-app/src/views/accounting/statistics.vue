<template>
  <div class="statistics-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">统计分析</h1>
        <p class="page-description">查看您的收支统计和趋势分析</p>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="selectedDate"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          @change="loadStatistics"
        />
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card income">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="20"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <h3>总收入</h3>
                <p class="amount">¥{{ formatAmount(monthlyStats.summary?.income || 0) }}</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card expense">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="20"><Minus /></el-icon>
              </div>
              <div class="stat-info">
                <h3>总支出</h3>
                <p class="amount">¥{{ formatAmount(monthlyStats.summary?.expense || 0) }}</p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card balance">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="20"><Wallet /></el-icon>
              </div>
              <div class="stat-info">
                <h3>净收入</h3>
                <p class="amount" :class="{ positive: (monthlyStats.summary?.income || 0) - (monthlyStats.summary?.expense || 0) >= 0, negative: (monthlyStats.summary?.income || 0) - (monthlyStats.summary?.expense || 0) < 0 }">
                  ¥{{ formatAmount((monthlyStats.summary?.income || 0) - (monthlyStats.summary?.expense || 0)) }}
                </p>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card count">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="20"><Document /></el-icon>
              </div>
              <div class="stat-info">
                <h3>交易笔数</h3>
                <p class="amount">{{ monthlyStats.summary?.transactionCount || 0 }}</p>
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
          <el-card class="chart-card" v-loading="loading">
            <template #header>
              <div class="card-header">
                <h3>收支趋势</h3>
                <el-button-group>
                  <el-button :type="chartType === 'line' ? 'primary' : ''" @click="chartType = 'line'">折线图</el-button>
                  <el-button :type="chartType === 'bar' ? 'primary' : ''" @click="chartType = 'bar'">柱状图</el-button>
                </el-button-group>
              </div>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 分类占比图 -->
        <el-col :span="8">
          <el-card class="chart-card" v-loading="loading">
            <template #header>
              <div class="card-header">
                <h3>支出分类占比</h3>
                <el-switch v-model="showIncomeChart" active-text="收入" inactive-text="支出" @change="renderCategoryChart" />
              </div>
            </template>
            <div ref="categoryChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细统计 -->
    <div class="detailed-stats">
      <el-row :gutter="20">
        <!-- 收入分类排行 -->
        <el-col :span="12">
          <el-card class="stats-card">
            <template #header>
              <h3>收入分类排行</h3>
            </template>
            <el-table :data="incomeCategoryStats" style="width: 100%">
              <el-table-column prop="categoryName" label="分类">
                <template #default="{ row }">
                  <div class="category-cell">
                    <span class="category-icon">{{ row.category?.icon }}</span>
                    <span class="category-name">{{ row.categoryName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" align="right">
                <template #default="{ row }">
                  <span class="amount-income">¥{{ formatAmount(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="percentage" label="占比" align="right">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 支出分类排行 -->
        <el-col :span="12">
          <el-card class="stats-card">
            <template #header>
              <h3>支出分类排行</h3>
            </template>
            <el-table :data="expenseCategoryStats" style="width: 100%">
              <el-table-column prop="categoryName" label="分类">
                <template #default="{ row }">
                  <div class="category-cell">
                    <span class="category-icon">{{ row.category?.icon }}</span>
                    <span class="category-name">{{ row.categoryName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" align="right">
                <template #default="{ row }">
                  <span class="amount-expense">¥{{ formatAmount(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="percentage" label="占比" align="right">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, Minus, Wallet, Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// 简化的类型定义
interface StatisticsSummary {
  income: number
  expense: number
  balance: number
  transactionCount: number
}

interface CategoryStats {
  categoryId: string
  categoryName: string
  amount: number
  count: number
  percentage: number
  category?: any
}

interface DailyTrend {
  date: string
  income: number
  expense: number
  balance?: number
}

interface MonthlyStatistics {
  year: number
  month: number
  summary?: StatisticsSummary
  categoryStats?: {
    income: CategoryStats[]
    expense: CategoryStats[]
  }
  dailyTrend?: DailyTrend[]
}

// 模拟API函数
const getMonthlyStatistics = async (year: number, month: number) => {
  // 这里应该调用实际的API
  return {
    code: 200,
    data: {
      year,
      month,
      summary: {
        income: 0,
        expense: 0,
        balance: 0,
        transactionCount: 0
      },
      categoryStats: {
        income: [],
        expense: []
      },
      dailyTrend: []
    }
  }
}

// 响应式数据
const loading = ref(false)
const chartType = ref<'line' | 'bar'>('line')
const showIncomeChart = ref(false)
const selectedDate = ref('')

// 图表引用
const trendChartRef = ref<HTMLElement | null>(null)
const categoryChartRef = ref<HTMLElement | null>(null)

// 图表实例
let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

// 统计数据
const monthlyStats = reactive<MonthlyStatistics>({
  year: 0,
  month: 0,
  summary: {
    income: 0,
    expense: 0,
    balance: 0,
    transactionCount: 0
  },
  categoryStats: {
    income: [],
    expense: []
  },
  dailyTrend: []
})

// 计算属性
const incomeCategoryStats = ref<CategoryStats[]>([])
const expenseCategoryStats = ref<CategoryStats[]>([])

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const loadStatistics = async () => {
  loading.value = true
  try {
    const date = selectedDate.value ? new Date(selectedDate.value) : new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    const response = await getMonthlyStatistics(year, month)
    if (response.code === 200) {
      Object.assign(monthlyStats, response.data)

      // 更新分类统计
      incomeCategoryStats.value = response.data.categoryStats?.income || []
      expenseCategoryStats.value = response.data.categoryStats?.expense || []

      // 渲染图表
      await nextTick()
      renderTrendChart()
      renderCategoryChart()
    }
  } catch (error) {
    console.error('加载统计失败:', error)
    ElMessage.error('加载统计失败')
  } finally {
    loading.value = false
  }
}

const renderTrendChart = () => {
  if (!trendChartRef.value) return

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  const dates = monthlyStats.dailyTrend?.map(item => item.date.slice(5)) || []
  const incomeData = monthlyStats.dailyTrend?.map(item => item.income) || []
  const expenseData = monthlyStats.dailyTrend?.map(item => item.expense) || []

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
  if (!categoryChartRef.value) return

  if (!categoryChart) {
    categoryChart = echarts.init(categoryChartRef.value)
  }

  const stats = showIncomeChart.value
    ? monthlyStats.categoryStats?.income || []
    : monthlyStats.categoryStats?.expense || []

  const data = stats.map(item => ({
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
        radius: '70%',
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

// 监听图表类型变化
watch(chartType, () => {
  renderTrendChart()
})

// 监听收入/支出切换
watch(showIncomeChart, () => {
  renderCategoryChart()
})

// 页面加载
onMounted(() => {
  // 设置默认日期为当前月份
  const now = new Date()
  selectedDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  loadStatistics()

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    categoryChart?.resize()
  })
})

// 页面销毁时清理
// onUnmounted(() => {
//   trendChart?.dispose()
//   categoryChart?.dispose()
//   window.removeEventListener('resize', () => {})
// })
</script>

<style scoped lang="scss">
.statistics-page {
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

  .stats-overview {
    margin-bottom: 24px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 20px;

          .income & {
            background: #f6ffed;
            color: #52c41a;
          }

          .expense & {
            background: #fff2f0;
            color: #ff4d4f;
          }

          .balance & {
            background: #f0f9ff;
            color: #1890ff;
          }

          .count & {
            background: #fafafa;
            color: #666;
          }
        }

        .stat-info {
          h3 {
            margin: 0 0 4px 0;
            font-size: 12px;
            color: #666;
            font-weight: 500;
          }

          .amount {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;

            &.positive {
              color: #52c41a;
            }

            &.negative {
              color: #ff4d4f;
            }
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

      .chart-container {
        height: 300px;
      }
    }
  }

  .detailed-stats {
    .stats-card {
      :deep(.el-card__header) {
        padding: 12px 20px;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
      }

      .category-cell {
        display: flex;
        align-items: center;

        .category-icon {
          margin-right: 6px;
        }
      }

      .amount-income {
        color: #52c41a;
        font-weight: 600;
      }

      .amount-expense {
        color: #ff4d4f;
        font-weight: 600;
      }
    }
  }
}
</style>