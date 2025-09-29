<template>
  <div class="categories-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">分类管理</h1>
        <p class="page-description">管理您的收支分类</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
      </div>
    </div>

    <!-- 分类列表 -->
    <el-row :gutter="20">
      <!-- 收入分类 -->
      <el-col :span="12">
        <el-card class="categories-card">
          <template #header>
            <div class="card-header">
              <h3>收入分类</h3>
              <span class="count">({{ incomeCategories.length }})</span>
            </div>
          </template>

          <div class="categories-list">
            <draggable
              v-model="incomeCategories"
              item-key="id"
              @end="handleDragEnd('income')"
            >
              <template #item="{ element }">
                <div class="category-item">
                  <div class="drag-handle">
                    <el-icon><Rank /></el-icon>
                  </div>
                  <div class="category-info">
                    <span class="category-icon">{{ element.icon }}</span>
                    <span class="category-name">{{ element.name }}</span>
                  </div>
                  <div class="category-actions">
                    <el-tag v-if="element.isSystem" size="small" type="info">系统</el-tag>
                    <el-button
                      v-else
                      size="small"
                      text
                      type="primary"
                      @click="editCategory(element)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      v-if="!element.isSystem"
                      size="small"
                      text
                      type="danger"
                      @click="deleteCategory(element)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-card>
      </el-col>

      <!-- 支出分类 -->
      <el-col :span="12">
        <el-card class="categories-card">
          <template #header>
            <div class="card-header">
              <h3>支出分类</h3>
              <span class="count">({{ expenseCategories.length }})</span>
            </div>
          </template>

          <div class="categories-list">
            <draggable
              v-model="expenseCategories"
              item-key="id"
              @end="handleDragEnd('expense')"
            >
              <template #item="{ element }">
                <div class="category-item">
                  <div class="drag-handle">
                    <el-icon><Rank /></el-icon>
                  </div>
                  <div class="category-info">
                    <span class="category-icon">{{ element.icon }}</span>
                    <span class="category-name">{{ element.name }}</span>
                  </div>
                  <div class="category-actions">
                    <el-tag v-if="element.isSystem" size="small" type="info">系统</el-tag>
                    <el-button
                      v-else
                      size="small"
                      text
                      type="primary"
                      @click="editCategory(element)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      v-if="!element.isSystem"
                      size="small"
                      text
                      type="danger"
                      @click="deleteCategory(element)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="currentCategory ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="80px"
      >
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="categoryForm.type">
            <el-radio label="income">收入</el-radio>
            <el-radio label="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-input v-model="categoryForm.icon" placeholder="请输入图标字符（如💰）" />
        </el-form-item>

        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="categoryForm.color" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategories as getCategoriesApi, createCategory as createCategoryApi, updateCategory as updateCategoryApi, deleteCategory as deleteCategoryApiService } from '@/service/accounting'
import { Plus, Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

// 简化的类型定义
interface Category {
  id: string
  type: 'income' | 'expense'
  name: string
  icon?: string
  color?: string
  sort: number
  isSystem: boolean
}

// // 模拟API函数
// const getCategories = async () => {
//   return {
//     code: 200,
//     data: {
//       income: [],
//       expense: []
//     }
//   }
// }

// const createCategory = async (data: any) => {
//   return { code: 200, data: { id: Date.now().toString(), ...data } }
// }

// const updateCategory = async (_id: string, _data: any) => {
//   return { code: 200 }
// }

// const deleteCategoryApi = async (_id: string) => {
//   return { code: 200 }
// }

// const updateCategorySort = async (_categories: any[]) => {
//   return { code: 200 }
// }

// 响应式数据
const showAddDialog = ref(false)
const currentCategory = ref<Category | null>(null)

// 表单引用
const categoryFormRef = ref()

// 分类数据
const incomeCategories = ref<Category[]>([])
const expenseCategories = ref<Category[]>([])

// 表单数据
const categoryForm = reactive({
  type: 'income' as 'income' | 'expense',
  name: '',
  icon: '',
  color: ''
})

// 表单验证规则
const categoryRules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  icon: [{ required: false, message: '', trigger: 'blur' }],
  color: [{ required: false, message: '', trigger: 'change' }]
}

// 方法
const loadCategories = async () => {
  try {
    const response = await getCategoriesApi()
    if (response.code === 200) {
      incomeCategories.value = response.data?.income || []
      expenseCategories.value = response.data?.expense || []
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  }
}

const editCategory = (category: Category) => {
  currentCategory.value = category
  Object.assign(categoryForm, {
    type: category.type,
    name: category.name,
    icon: category.icon || '',
    color: category.color || ''
  })
  showAddDialog.value = true
}

const deleteCategory = async (category: Category) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类 "${category.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    const response = await deleteCategoryApiService(category.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadCategories()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveCategory = async () => {
  if (!categoryFormRef.value) return

  try {
    await categoryFormRef.value.validate()

    const formData = {
      ...categoryForm,
      sort: 99, // 新分类默认排序
      isSystem: false // 自定义分类
    }

    let response
    if (currentCategory.value) {
      // 编辑分类
      response = await updateCategoryApi(currentCategory.value.id, formData)
    } else {
      // 新增分类
      response = await createCategoryApi(formData)
    }

    if (response.code === 200) {
      ElMessage.success(currentCategory.value ? '编辑成功' : '新增成功')
      showAddDialog.value = false
      loadCategories()
      resetForm()
    }
  } catch (error) {
    console.error('保存分类失败:', error)
    ElMessage.error('保存失败')
  }
}

const resetForm = () => {
  currentCategory.value = null
  Object.assign(categoryForm, {
    type: 'income',
    name: '',
    icon: '',
    color: ''
  })
}

const handleDragEnd = async (type: 'income' | 'expense') => {
  try {
    const categories = type === 'income' ? incomeCategories.value : expenseCategories.value
    const sortedCategories = categories.map((category, index) => ({
      id: category.id,
      sort: index + 1
    }))

    // 由于后端没有提供更新分类排序的API，我们暂时禁用此功能
    ElMessage.info('分类排序功能暂未实现')
    // const response = await updateCategorySort(sortedCategories)
    // if (response.code === 200) {
    //   ElMessage.success('排序已更新')
    // }
  } catch (error) {
    console.error('更新排序失败:', error)
    ElMessage.error('更新排序失败')
    // 重新加载以恢复原排序
    loadCategories()
  }
}

// 页面加载
onMounted(() => {
  loadCategories()
})
</script>

<style scoped lang="scss">
.categories-page {
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

  .categories-card {
    .card-header {
      display: flex;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .count {
        margin-left: 8px;
        color: #999;
        font-size: 14px;
      }
    }

    .categories-list {
      min-height: 400px;

      .category-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 4px;
        margin-bottom: 8px;
        background: #fafafa;
        transition: all 0.3s;

        &:hover {
          background: #f0f0f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .drag-handle {
          cursor: move;
          margin-right: 12px;
          color: #999;

          &:hover {
            color: #666;
          }
        }

        .category-info {
          flex: 1;
          display: flex;
          align-items: center;

          .category-icon {
            font-size: 18px;
            margin-right: 8px;
          }

          .category-name {
            font-size: 14px;
            color: #333;
          }
        }

        .category-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
  }
}
</style>