<template>
  <el-dialog
    v-model="visible"
    title="快速记账"
    width="400px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="0px"
    >
      <div class="quick-form">
        <!-- 金额输入 -->
        <div class="amount-input">
          <div class="amount-label">金额</div>
          <el-input
            v-model="form.amount"
            placeholder="0.00"
            input-style="font-size: 32px; text-align: center; padding: 20px 0;"
          >
            <template #prefix>
              <span style="font-size: 24px; line-height: 62px;">¥</span>
            </template>
          </el-input>
        </div>

        <!-- 类型选择 -->
        <div class="type-selector">
          <el-button
            :type="form.type === 'expense' ? 'danger' : 'default'"
            @click="form.type = 'expense'"
            class="type-btn"
          >
            <el-icon><Minus /></el-icon>
            支出
          </el-button>
          <el-button
            :type="form.type === 'income' ? 'success' : 'default'"
            @click="form.type = 'income'"
            class="type-btn"
          >
            <el-icon><Plus /></el-icon>
            收入
          </el-button>
        </div>

        <!-- 分类选择 -->
        <el-form-item prop="categoryId">
          <div class="category-selector">
            <div class="category-label">分类</div>
            <div class="category-grid">
              <div
                v-for="category in filteredCategories"
                :key="category.id"
                class="category-item"
                :class="{ active: form.categoryId === category.id }"
                @click="form.categoryId = category.id"
              >
                <div class="category-icon">{{ category.icon }}</div>
                <div class="category-name">{{ category.name }}</div>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 备注 -->
        <el-form-item prop="note">
          <el-input
            v-model="form.note"
            placeholder="添加备注（可选）"
            clearable
          />
        </el-form-item>

        <!-- 日期 -->
        <el-form-item prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            format="MM月DD日"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineEmits, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Minus } from '@element-plus/icons-vue'
import { createTransaction } from '@/service/accounting'

// 简化的类型定义
interface Category {
  id: string
  name: string
  icon?: string
  type: 'income' | 'expense'
}

// 定义 props
const props = defineProps<{
  modelValue: boolean
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
  amount: '',
  categoryId: '',
  note: '',
  date: new Date().toISOString().split('T')[0]
})

// 表单验证规则
const rules = {
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入有效的金额', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// 计算属性
const filteredCategories = computed(() => {
  return props.categories.filter(cat => cat.type === form.type)
})

// 方法
const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    type: 'expense',
    amount: '',
    categoryId: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    loading.value = true

    // 调用实际的API
    const transactionData = {
      type: form.type,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      note: form.note,
      date: form.date
    }

    const response = await createTransaction(transactionData)
    if (response.code === 200) {
      ElMessage.success(`${form.type === 'income' ? '收入' : '支出'}记录添加成功`)
      emit('success')
      handleClose()
    } else {
      ElMessage.error(response.msg || '记账失败')
    }
  } catch (error) {
    console.error('记账失败:', error)
    ElMessage.error('记账失败')
  } finally {
    loading.value = false
  }
}

// 监听类型变化，自动选择第一个分类
watch(
  () => form.type,
  () => {
    const firstCategory = filteredCategories.value[0]
    if (firstCategory) {
      form.categoryId = firstCategory.id
    } else {
      form.categoryId = ''
    }
  }
)
</script>

<style scoped lang="scss">
.quick-form {
  .amount-input {
    margin-bottom: 20px;
    text-align: center;

    .amount-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    :deep(.el-input__wrapper) {
      box-shadow: none;
      border-bottom: 1px solid #dcdfe6;
      border-radius: 0;

      &:hover, &:focus {
        box-shadow: none;
        border-color: #409eff;
      }
    }
  }

  .type-selector {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;

    .type-btn {
      flex: 1;
      height: 40px;

      .el-icon {
        margin-right: 4px;
      }
    }
  }

  .category-selector {
    .category-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .category-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 4px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        background: #f5f5f5;

        &:hover {
          background: #e6f7ff;
        }

        &.active {
          background: #409eff;
          color: white;
        }

        .category-icon {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .category-name {
          font-size: 12px;
          text-align: center;
        }
      }
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}
</style>