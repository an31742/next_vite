<template>
  <el-dialog
    v-model="visible"
    :title="transaction ? '编辑交易记录' : '新增交易记录'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio label="income">收入</el-radio>
          <el-radio label="expense">支出</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :precision="2"
          :step="1"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="分类" prop="categoryId">
        <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
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
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="请输入备注"
        />
      </el-form-item>

      <el-form-item label="日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineEmits, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import { createTransaction, updateTransaction } from '@/service/accounting'

// 简化的类型定义
interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  note?: string
  date: string
}

interface Category {
  id: string
  name: string
  icon?: string
  type: 'income' | 'expense'
}

// 定义 props
const props = defineProps<{
  modelValue: boolean
  transaction: Transaction | null
  categories: Category[]
}>()

// 定义 emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  categoryId: '',
  note: '',
  date: ''
})

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// 计算属性
const filteredCategories = computed(() => {
  return props.categories.filter(cat => cat.type === form.type)
})

// 监听 transaction 变化
watch(
  () => props.transaction,
  (newTransaction) => {
    if (newTransaction) {
      Object.assign(form, {
        type: newTransaction.type,
        amount: newTransaction.amount,
        categoryId: newTransaction.categoryId,
        note: newTransaction.note || '',
        date: newTransaction.date
      })
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 方法
const resetForm = () => {
  Object.assign(form, {
    type: 'expense',
    amount: 0,
    categoryId: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  })
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    loading.value = true

    // 调用实际的API
    if (props.transaction) {
      // 编辑交易记录
      const updateData = {
        type: form.type,
        amount: form.amount,
        categoryId: form.categoryId,
        note: form.note,
        date: form.date
      }

      const response = await updateTransaction(props.transaction.id, updateData)
      if (response.code === 200) {
        ElMessage.success('编辑成功')
        emit('success')
        handleClose()
      } else {
        ElMessage.error(response.msg || '编辑失败')
      }
    } else {
      // 新增交易记录
      const createData = {
        type: form.type,
        amount: form.amount,
        categoryId: form.categoryId,
        note: form.note,
        date: form.date
      }

      const response = await createTransaction(createData)
      if (response.code === 200) {
        ElMessage.success('新增成功')
        emit('success')
        handleClose()
      } else {
        ElMessage.error(response.msg || '新增失败')
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}
</script>