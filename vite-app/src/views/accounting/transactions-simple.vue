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

    <!-- 交易记录表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>交易记录</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="transactions"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            <div class="date-cell">
              <span class="date">{{ formatDisplayDate(row.date) }}</span>
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

        <el-table-column prop="amount" label="金额" width="120" align="right">
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

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="editTransaction(row)">
              编辑
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
    <TransactionFormDialog
      v-model="showAddDialog"
      :transaction="currentTransaction"
      :categories="categories"
      @success="handleTransactionSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

// 简化的类型定义
interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  note?: string
  date: string
  category?: Category
}

interface Category {
  id: string
  name: string
  icon?: string
  type: 'income' | 'expense'
}

// 模拟API函数
const getTransactions = async (_params: any) => {
  // 这里应该调用实际的API
  return {
    code: 200,
    data: {
      list: [],
      pagination: { total: 0 }
    }
  }
}

const getCategories = async () => {
  return {
    code: 200,
    data: {
      income: [],
      expense: []
    }
  }
}

const deleteTransactionApi = async (_id: string) => {
  return { code: 200 }
}

// 组件引入
const TransactionFormDialog = {
  template: '<div></div>'
}

// 响应式数据
const loading = ref(false)
const showAddDialog = ref(false)
const currentTransaction = ref<Transaction | null>(null)

// 筛选表单
const filterForm = reactive({
  type: '',
  categoryId: '',
  keyword: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 数据
const transactions = ref<Transaction[]>([])
const categories = ref<Category[]>([])

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDisplayDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const resetFilter = () => {
  Object.assign(filterForm, {
    type: '',
    categoryId: '',
    keyword: ''
  })
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
    const response = await getTransactions({
      page: pagination.page,
      pageSize: pagination.pageSize,
      type: filterForm.type as 'income' | 'expense' | undefined,
      categoryId: filterForm.categoryId,
      keyword: filterForm.keyword
    })
    if (response.code === 200) {
      transactions.value = response.data?.list || []
      pagination.total = response.data?.pagination?.total || 0
    }
  } catch (error) {
    console.error('加载交易记录失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
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

  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .date-cell {
      .date {
        display: block;
        font-weight: 500;
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