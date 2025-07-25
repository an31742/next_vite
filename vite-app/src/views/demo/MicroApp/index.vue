<!-- src/views/Home.vue -->
<template>
  <div>
    <button @click="loadApp('app1')">加载子应用1</button>
    <button @click="loadApp('app2')">加载子应用2</button>
    <div :id="'micro-' + currentApp" ref="container"></div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { MicroSandbox } from "@/utils/core/index"

const container = ref(null)
const currentApp = ref("app1")

const loadApp = async (appName) => {
  currentApp.value = appName
  const html = await fetch(`/${appName === "app1" ? "micro-app1.html" : "micro-app2.html"}`).then((res) => res.text())

  const wrapper = document.createElement("div")
  wrapper.innerHTML = html

  // 清空容器
  const target = container.value
  target.innerHTML = ""
  target.appendChild(wrapper)

  // 沙箱执行脚本
  const scripts = wrapper.querySelectorAll("script")
  let code = ""
  scripts.forEach((script) => (code += script.innerHTML))

  const sandbox = new MicroSandbox(appName)
  sandbox.execScript(code, wrapper)
}
</script>
