<template>
  <div class="micro-app2">
    <h1>Hello from Micro App 2</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue"
const message = ref("这是Vue子应用2")
</script>

<style scoped>
.micro-app1 {
  padding: 20px;
  background-color: #f5f5f5;
}
</style>
