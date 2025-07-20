<template>
  <el-form ref="ruleFormRef" :model="ruleForm" label-width="120px" class="demo-ruleForm">
    <el-form-item label="Confirm">
      <el-input v-model="ruleForm.name" />
    </el-form-item>
    <el-form-item label="Password">
      <el-input v-model="ruleForm.password" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">Submit</el-button>
      <!-- <el-button @click="resetForm(ruleFormRef)">Reset</el-button> -->
    </el-form-item>
  </el-form>
</template>
<script lang="ts">
import { useRouter } from "vue-router"
import { reactive } from "vue"
import { useCounter } from "@/store/index.ts"
import { jwtDecode } from "jwt-decode"
import loginApi from "@/service/model/login.ts"

export default {
  setup() {
    const store = useCounter()
    const router = useRouter()
    const ruleForm = reactive({
      name: "admin",
      password: 12345,
    })

    const submitForm = async () => {
      // 调用后端登录接口
      const res = await loginApi.login(ruleForm)
      if (res.code === 200) {
        const token = res.token
        window.localStorage.setItem("token", token)
        // 解析 JWT，提取角色
        try {
          const decoded = jwtDecode(token)
          const roles = decoded.roles || []
          store.roles = roles
          store.userInfo = decoded
          window.localStorage.setItem("userInfo", JSON.stringify(decoded))
        } catch (e) {
          store.roles = []
        }
        store.getAuthButtonList() //在登录的时候获取按钮级别权限
        router.push({
          path: "/",
        })
      } else {
        // 登录失败处理
        alert(res.msg || "登录失败")
      }
    }
    console.log("🚀 ~ submitForm ~ store.getAuthButtonList():", store.getAuthButtonList())

    const resetForm = () => {}
    return {
      ruleForm,
      submitForm,
      resetForm,
    }
  },
}
</script>
<style scope lang="less">
.demo-ruleForm {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
body {
  background: url("@/assets/bgLogin.webp") no-repeat;
}
</style>
