<template>
  <div class="calendar-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">日历视图</h1>
        <p class="page-description">按日查看您的收支记录</p>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="currentDate"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          @change="loadMonthData"
        />
      </div>
    </div>

    <!-- 日历组件 -->
    <el-card class="calendar-card">
      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div class="calendar-day" @click="selectDate(data.day)">
            <div class="day-header">
              <span class="day-number">{{ data.day.split('-')[2] }}</span>
              <span v-if="isToday(data.day)" class="today-tag">今天</span>
            </div>

            <div class="day-summary" v-if="dailyStats[data.day]">
              <div class="summary-item income" v-if="dailyStats[data.day].income > 0">
                <el-icon size="12"><TrendCharts /></el-icon>
                <span>{{ formatAmount(dailyStats[data.day].income) }}</span>
              </div>
              <div class="summary-item expense" v-if="dailyStats[data.day].expense > 0">
                <el-icon size="12"><Minus /></el-icon>
                <span>{{ formatAmount(dailyStats[data.day].expense) }}</span>
              </div>
            </div>

            <div class="day-indicator" v-else>
              <span class="no-data">-</span>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <!-- 选中日期详情 -->
    <div class="date-details" v-if="selectedDate">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>{{ formatDate(selectedDate) }} 的交易记录</h3>
            <el-button type="primary" @click="showAddTransaction = true">
              <el-icon><Plus /></el-icon>
              新增记录
            </el-button>
          </div>
        </template>

        <div v-if="dailyTransactions.length > 0">
          <el-table :data="dailyTransactions" style="width: 100%">
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
                  <span class="category-name">{{ row.category?.name }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="`amount-${row.type}`">
                  {{ row.type === 'income' ? '+' : '-' }}¥{{ formatAmount(row.amount) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="note" label="备注" min-width="200" show-overflow-tooltip />

            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" text @click="editTransaction(row)">编辑</el-button>
                <el-button size="small" text type="danger" @click="deleteTransaction(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="date-summary">
            <div class="summary-item">
              <span class="label">总收入:</span>
              <span class="value amount-income">¥{{ formatAmount(selectedDateStats.income) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">总支出:</span>
              <span class="value amount-expense">¥{{ formatAmount(selectedDateStats.expense) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">净收入:</span>
              <span class="value" :class="{ 'amount-income': selectedDateStats.balance >= 0, 'amount-expense': selectedDateStats.balance < 0 }">
                ¥{{ formatAmount(selectedDateStats.balance) }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="no-transactions">
          <el-empty description="暂无交易记录" />
          <el-button type="primary" @click="showAddTransaction = true">
            <el-icon><Plus /></el-icon>
            新增第一条记录
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑交易对话框 -->
    <el-dialog
      v-model="showAddTransaction"
      :title="currentTransaction ? '编辑交易记录' : '新增交易记录'"
      width="500px"
    >
      <el-form
        ref="transactionFormRef"
        :model="transactionForm"
        :rules="transactionRules"
        label-width="80px"
      >
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="transactionForm.type">
            <el-radio label="income">收入</el-radio>
            <el-radio label="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="transactionForm.amount"
            :min="0.01"
            :precision="2"
            :step="1"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="transactionForm.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="category in filteredCategories"
              :key="category.id"
              :label="`${category.icon} ${category.name}`"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="note">
          <el-input
            v-model="transactionForm.note"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>

        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="transactionForm.date"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddTransaction = false">取消</el-button>
        <el-button type="primary" @click="saveTransaction">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, TrendCharts, Minus } from '@element-plus/icons-vue'
import { getDailyTransactions as getDailyTransactionsApi, getTransactions as getTransactionsApi, getCategories as getCategoriesApi, createTransaction as createTransactionApi, updateTransaction as updateTransactionApi, deleteTransaction as deleteTransactionApiService } from '@/service/accounting'

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

interface DailyStats {
  income: number
  expense: number
  count: number
}

// 响应式数据
const currentDate = ref('')
const selectedDate = ref('')
const showAddTransaction = ref(false)
const currentTransaction = ref<Transaction | null>(null)

// 表单引用
const transactionFormRef = ref()

// 数据
const dailyStats = ref<Record<string, DailyStats>>({})
const dailyTransactions = ref<Transaction[]>([])
const categories = ref<Category[]>([])

// 表单数据
const transactionForm = reactive({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  categoryId: '',
  note: '',
  date: ''
})

// 表单验证规则
const transactionRules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// 计算属性
const filteredCategories = computed(() => {
  return categories.value.filter(cat => cat.type === transactionForm.type)
})

const selectedDateStats = computed(() => {
  const stats = dailyTransactions.value.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.income += transaction.amount
    } else {
      acc.expense += transaction.amount
    }
    return acc
  }, { income: 0, expense: 0, balance: 0 })

  stats.balance = stats.income - stats.expense
  return stats
})

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const isToday = (dateStr: string) => {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

const loadMonthData = async () => {
  try {
    const date = currentDate.value ? new Date(currentDate.value) : new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    // 构造月份的开始和结束日期
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

    // 使用 getTransactions API 获取指定日期范围的交易记录
    const response = await getTransactionsApi({
      startDate,
      endDate
    })
    
    if (response.code === 200) {
      // 计算每日统计
      const stats: Record<string, DailyStats> = {}
      ;(response.data?.list || []).forEach((transaction: Transaction) => {
        if (!stats[transaction.date]) {
          stats[transaction.date] = { income: 0, expense: 0, count: 0 }
        }

        if (transaction.type === 'income') {
          stats[transaction.date].income += transaction.amount
        } else {
          stats[transaction.date].expense += transaction.amount
        }
        stats[transaction.date].count++
      })

      dailyStats.value = stats
    }
  } catch (error) {
    console.error('加载月度数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

const selectDate = async (date: string) => {
  selectedDate.value = date
  loadDailyTransactions(date)
}

const loadDailyTransactions = async (date: string) => {
  try {
    const response = await getDailyTransactionsApi(date)
    if (response.code === 200) {
      dailyTransactions.value = response.data?.transactions || []
    }
  } catch (error) {
    console.error('加载日期数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

const loadCategories = async () => {
  try {
    const response = await getCategoriesApi()
    if (response.code === 200) {
      categories.value = [...(response.data?.income || []), ...(response.data?.expense || [])]
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const editTransaction = (transaction: Transaction) => {
  currentTransaction.value = transaction
  Object.assign(transactionForm, {
    type: transaction.type,
    amount: transaction.amount,
    categoryId: transaction.categoryId,
    note: transaction.note || '',
    date: transaction.date
  })
  showAddTransaction.value = true
}

const deleteTransaction = async (transaction: Transaction) => {
  try {
    await ElMessageBox.confirm(`确定要删除这条${transaction.type === 'income' ? '收入' : '支出'}记录吗？`, '确认删除', {
      type: 'warning'
    })

    const response = await deleteTransactionApiService(transaction.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadDailyTransactions(selectedDate.value)
      loadMonthData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除交易记录失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveTransaction = async () => {
  if (!transactionFormRef.value) return

  try {
    await transactionFormRef.value.validate()

    let response
    if (currentTransaction.value) {
      // 编辑交易
      response = await updateTransactionApi(currentTransaction.value.id, transactionForm)
    } else {
      // 新增交易
      response = await createTransactionApi(transactionForm)
    }

    if (response.code === 200) {
      ElMessage.success(currentTransaction.value ? '编辑成功' : '新增成功')
      showAddTransaction.value = false
      loadDailyTransactions(selectedDate.value)
      loadMonthData()
      resetForm()
    }
  } catch (error) {
    console.error('保存交易记录失败:', error)
    ElMessage.error('保存失败')
  }
}

const resetForm = () => {
  currentTransaction.value = null
  Object.assign(transactionForm, {
    type: 'expense',
    amount: 0,
    categoryId: '',
    note: '',
    date: selectedDate.value || new Date().toISOString().split('T')[0]
  })
}

// 页面加载
onMounted(() => {
  // 设置默认日期为当前月份
  const now = new Date()
  currentDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  loadMonthData()
  loadCategories()
})
</script>
