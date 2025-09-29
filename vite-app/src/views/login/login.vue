<template>
  <el-form ref="ruleFormRef" :model="ruleForm" label-width="120px" class="demo-ruleForm">
    <el-form-item label="Confirm">
      <el-input v-model="ruleForm.name" />
    </el-form-item>
    <el-form-item label="password">
      <el-input v-model="ruleForm.password" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">Submit</el-button>
      <!-- <el-button @click="resetForm(ruleFormRef)">Reset</el-button> -->
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import { reactive } from "vue"
import { useRouter } from "vue-router"
import { useCounter } from "../../store/index"
import { decodeJWTToken } from "../../utils/auth/index"
import { JWTOptions } from "../../utils/auth/types/jwt.d"
import loginApi from "../../service/model/login"
import { LoginParams, LoginResponse } from "./types/api"
const store = useCounter()
const router = useRouter()
const ruleForm = reactive({
  name: "admin",
  password: "12345",
})

const submitForm = async () => {
  try {
    const params = { name: ruleForm.name, password: ruleForm.password }
    // 调用后端登录接口
    const res = await loginApi.login(params)

    if (res?.code === 200 && res.data.token) {
      const token = res.data.token
      window.localStorage.setItem("token", token)
      // 解析 JWT，提取角色
      const decoded = decodeJWTToken(token)
      // 兼容后端返回的 role 字段
      let roles: string[] = []
      if (decoded && typeof decoded === "object") {
        if (Array.isArray((decoded as any).role)) {
          roles = (decoded as any).role
        } else if (Array.isArray((decoded as any).roles)) {
          roles = (decoded as any).roles
        }
      }
      store.roles = roles
      store.userInfo = decoded
      window.localStorage.setItem("userInfo", JSON.stringify(decoded))
      store.getAuthButtonList() //在登录的时候获取按钮级别权限

      // 根据用户角色跳转到不同页面
      if ((decoded as any).isAdmin) {
        // 管理员跳转到用户管理页面
        router.push({ path: "/accounting/admin" })
      } else {
        // 普通用户跳转到首页
        router.push({ path: "/" })
      }
    } else {
      // 登录失败处理
      alert(res?.msg || "登录失败")
    }
  } catch (e) {
    console.error("登录错误:", e)
    alert("登录失败: 网络错误或服务器异常")
  }
}

const resetForm = () => {}
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
