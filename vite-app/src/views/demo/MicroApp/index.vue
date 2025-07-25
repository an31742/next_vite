<template>
  <div>
    <button @click="loadApp('app1')">加载子应用1</button>
    <button @click="loadApp('app2')">加载子应用2</button>
    <div :id="'micro-' + currentApp" ref="container"></div>
    <!-- 添加错误显示区域 -->
    <div v-if="errorMessage" class="error-message">
      <h3>加载错误</h3>
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import { MicroSandbox } from "@/utils/core/index.ts"

// 状态管理
const container = ref(null)
const currentApp = ref("")
const errorMessage = ref("")
const sandboxInstances = ref({}) // 存储沙箱实例，避免重复创建

// 清理函数
const cleanUpPreviousApp = () => {
  // 销毁上一个沙箱实例
  if (sandboxInstances.value[currentApp.value]) {
    sandboxInstances.value[currentApp.value].destroy?.()
    delete sandboxInstances.value[currentApp.value]
  }
  // 清空错误信息
  errorMessage.value = ""
  // 清空容器
  if (container.value) {
    container.value.innerHTML = ""
  }
}

// 核心加载函数
const loadApp = async (appName) => {
  try {
    // 1. 基本验证
    if (!appName || !['app1', 'app2'].includes(appName)) {
      throw new Error(`不支持的应用名称: ${appName}，仅支持app1/app2`)
    }

    // 2. 清理之前的应用
    cleanUpPreviousApp()
    currentApp.value = appName

    // 3. 验证容器
    if (!container.value) {
      throw new Error("容器元素未找到，请检查ref绑定")
    }

    // 4. 加载HTML内容 (使用项目中实际存在的public目录下的HTML文件)
    const htmlUrl = `/micro-${appName}.html`
    console.log(`开始加载微应用: ${htmlUrl}`)

    const response = await fetch(htmlUrl)
    if (!response.ok) {
      throw new Error(`加载失败: HTTP状态码 ${response.status}`)
    }
    const html = await response.text()
    if (!html) {
      throw new Error("获取到空的HTML内容")
    }

    // 5. 创建DOM结构
    const wrapper = document.createElement("div")
    wrapper.id = `micro-app-wrapper-${appName}`
    wrapper.innerHTML = html

    // 6. 清空并添加新内容
    container.value.appendChild(wrapper)

    // 7. 初始化沙箱
    const sandbox = new MicroSandbox(appName)
    sandboxInstances.value[appName] = sandbox

    // 8. 执行脚本
    const scripts = wrapper.querySelectorAll("script")
    if (scripts.length === 0) {
      console.warn("微应用中未找到脚本标签")
    }

    for (const script of scripts) {
      const code = script.innerHTML
      if (code.trim()) {
        sandbox.execScript(code, wrapper)
      }
    }

    console.log(`微应用 ${appName} 加载成功`)

  } catch (err) {
    // 集中错误处理
    const errorDetails = `[${new Date().toLocaleTimeString()}] ${err.message}`
    errorMessage.value = errorDetails
    console.error("微应用加载错误:", err)
    // 确保状态一致性
    currentApp.value = ""
  }
}

// 组件挂载时验证环境
onMounted(() => {
  if (!MicroSandbox) {
    errorMessage.value = "MicroSandbox未找到，请检查@/utils/core/index.ts"
  }
  // 验证public目录下的微应用文件是否存在
  ['app1', 'app2'].forEach(app => {
    fetch(`/micro-${app}.html`)
      .then(res => !res.ok && console.warn(`微应用文件可能不存在: /micro-${app}.html`))
      .catch(() => console.error(`无法访问微应用文件: /micro-${app}.html`))
  })
})
</script>
<style scoped>
.error-message {
  color: #ff4d4f;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  background-color: #fff2f0;
}
</style>
