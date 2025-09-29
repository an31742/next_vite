<template>
  <div class="transactions-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">交易记录</h1>
        <p class="page-description">管理您的收支记录</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          新增记录
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="filterForm.categoryId" placeholder="全部分类" clearable style="width: 150px">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="`${category.icon} ${category.name}`"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleDateRangeChange"
          />
        </el-form-item>

        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索备注内容"
            style="width: 200px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadTransactions">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card income">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <h3>总收入</h3>
              <p class="amount">¥{{ formatAmount(totalStats.income) }}</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card expense">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Minus /></el-icon>
            </div>
            <div class="stat-info">
              <h3>总支出</h3>
              <p class="amount">¥{{ formatAmount(totalStats.expense) }}</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card balance">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <h3>净收入</h3>
              <p class="amount" :class="{ positive: totalStats.balance >= 0, negative: totalStats.balance < 0 }">
                ¥{{ formatAmount(totalStats.balance) }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card count">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <h3>交易笔数</h3>
              <p class="amount">{{ totalStats.transactionCount }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 交易记录表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>交易记录 ({{ pagination.total }} 条)</span>
          <div class="table-actions">
            <el-button size="small" @click="exportData">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button size="small" @click="batchDelete" :disabled="selectedRows.length === 0">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="transactions"
        style="width: 100%"
        stripe
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="date" label="日期" width="120" sortable="custom">
          <template #default="{ row }">
            <div class="date-cell">
              <span class="date">{{ formatDisplayDate(row.date) }}</span>
              <span class="weekday">{{ getWeekday(row.date) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="category.name" label="分类" width="120">
          <template #default="{ row }">
            <div class="category-cell">
              <span class="category-icon">{{ row.category?.icon }}</span>
              <span class="category-name">{{ row.category?.name || '未知分类' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="amount" label="金额" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            <span :class="`amount-${row.type}`" class="amount-text">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ formatAmount(row.amount) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="note" label="备注" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="note-text">{{ row.note || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="160" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="editTransaction(row)">
              编辑
            </el-button>
            <el-button size="small" text type="primary" @click="duplicateTransaction(row)">
              复制
            </el-button>
            <el-button size="small" text type="danger" @click="deleteTransaction(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <TransactionDialog
      v-model="showAddDialog"
      :transaction="currentTransaction"
      :categories="categories"
      @success="handleTransactionSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, TrendCharts, Minus, Wallet, Document, Download, Delete } from '@element-plus/icons-vue'
import { getTransactions, deleteTransaction as deleteTransactionApi, getCategories, type Transaction, type Category, type TransactionListQuery } from '@/service/accounting'
import TransactionDialog from '@/components/accounting/TransactionDialog.vue'

// 响应式数据
const loading = ref(false)
const showAddDialog = ref(false)
const currentTransaction = ref<Transaction | null>(null)
const selectedRows = ref<Transaction[]>([])
const dateRange = ref<string[]>([])

// 筛选表单
const filterForm = reactive({
  type: '',
  categoryId: '',
  keyword: '',
  startDate: '',
  endDate: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 排序信息
const sortInfo = reactive({
  prop: '',
  order: ''
})

// 数据
const transactions = ref<Transaction[]>([])
const categories = ref<Category[]>([])
const totalStats = reactive({
  income: 0,
  expense: 0,
  balance: 0,
  transactionCount: 0
})

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDisplayDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const getWeekday = (dateStr: string) => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const date = new Date(dateStr)
  return `周${weekdays[date.getDay()]}`
}

const handleDateRangeChange = (range: string[]) => {
  if (range && range.length === 2) {
    filterForm.startDate = range[0]
    filterForm.endDate = range[1]
  } else {
    filterForm.startDate = ''
    filterForm.endDate = ''
  }
}

const resetFilter = () => {
  Object.assign(filterForm, {
    type: '',
    categoryId: '',
    keyword: '',
    startDate: '',
    endDate: ''
  })
  dateRange.value = []
  pagination.page = 1
  loadTransactions()
}

const loadCategories = async () => {
  try {
    const response = await getCategories()
    if (response.code === 200) {
      categories.value = [...(response.data?.income || []), ...(response.data?.expense || [])]
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadTransactions = async () => {
  loading.value = true
  try {
    const params: TransactionListQuery = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      type: filterForm.type as 'income' | 'expense' | undefined,
      categoryId: filterForm.categoryId,
      keyword: filterForm.keyword,
      startDate: filterForm.startDate,
      endDate: filterForm.endDate
    }

    // 添加排序参数
    if (sortInfo.prop) {
      params.sortBy = sortInfo.prop
      params.sortOrder = sortInfo.order === 'ascending' ? 'asc' : 'desc'
    }

    const response = await getTransactions(params)
    if (response.code === 200) {
      transactions.value = response.data?.list || []
      pagination.total = response.data?.pagination?.total || 0

      // 计算统计信息
      calculateStats()
    }
  } catch (error) {
    console.error('加载交易记录失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  const stats = transactions.value.reduce((acc, transaction) => {
    acc.transactionCount++
    if (transaction.type === 'income') {
      acc.income += transaction.amount
    } else {
      acc.expense += transaction.amount
    }
    return acc
  }, { income: 0, expense: 0, transactionCount: 0 })

  Object.assign(totalStats, {
    ...stats,
    balance: stats.income - stats.expense
  })
}

const handleSelectionChange = (selection: Transaction[]) => {
  selectedRows.value = selection
}

const handleSortChange = ({ prop, order }: any) => {
  sortInfo.prop = prop
  sortInfo.order = order
  loadTransactions()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadTransactions()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadTransactions()
}

const editTransaction = (transaction: Transaction) => {
  currentTransaction.value = { ...transaction }
  showAddDialog.value = true
}

const duplicateTransaction = (transaction: Transaction) => {
  const newTransaction = { ...transaction } as any
  delete newTransaction.id
  delete newTransaction.createdAt
  delete newTransaction.updatedAt
  currentTransaction.value = newTransaction
  showAddDialog.value = true
}

const deleteTransaction = async (transaction: Transaction) => {
  try {
    await ElMessageBox.confirm(`确定要删除这条${transaction.type === 'income' ? '收入' : '支出'}记录吗？`, '确认删除', {
      type: 'warning'
    })

    const response = await deleteTransactionApi(transaction.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadTransactions()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除交易记录失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '批量删除', {
      type: 'warning'
    })

    const deletePromises = selectedRows.value.map(row => deleteTransactionApi(row.id))
    await Promise.all(deletePromises)

    ElMessage.success('批量删除成功')
    loadTransactions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

const exportData = () => {
  // 导出功能实现
  ElMessage.info('导出功能开发中...')
}

const handleTransactionSuccess = () => {
  showAddDialog.value = false
  currentTransaction.value = null
  loadTransactions()
  ElMessage.success('操作成功')
}

// 页面加载
onMounted(() => {
  loadCategories()
  loadTransactions()
})
</script>

<style scoped lang="scss">
.transactions-page {
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

  .filter-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }
  }

  .stats-row {
    margin-bottom: 16px;

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

  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .table-actions {
        display: flex;
        gap: 8px;
      }
    }

    .date-cell {
      .date {
        display: block;
        font-weight: 500;
      }

      .weekday {
        font-size: 12px;
        color: #999;
      }
    }

    .category-cell {
      display: flex;
      align-items: center;

      .category-icon {
        margin-right: 4px;
      }
    }

    .amount-text {
      font-weight: 600;

      &.amount-income {
        color: #52c41a;
      }

      &.amount-expense {
        color: #ff4d4f;
      }
    }

    .note-text {
      color: #666;
    }

    .pagination-container {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
  }
}
</style>