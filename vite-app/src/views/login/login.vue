<template>
  <el-form ref="ruleFormRef" :model="ruleForm" label-width="120px" class="demo-ruleForm">
    <el-form-item label="Confirm">
      <el-input v-model="ruleForm.userName" />
    </el-form-item>
    <el-form-item label="Password">
      <el-input v-model="ruleForm.passWord" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">Submit</el-button>
      <!-- <el-button @click="resetForm(ruleFormRef)">Reset</el-button> -->
    </el-form-item>
  </el-form>
</template>
<script lang="ts">
import { reactive } from "vue"
import { useRouter } from "vue-router"
import { useCounter } from "../../store/index"
import { jwtDecode } from "jwt-decode"
import type { JwtPayload } from "jwt-decode"
import loginApi from "../../service/model/login"

export interface AuthJwtPayload extends JwtPayload {
  roles?: string[]
}

// 使用@types/jwt-decode提供的类型定义



export default {
  setup() {
    const store = useCounter()
    const router = useRouter()
    const ruleForm = reactive({
      userName: "admin",
      passWord: "12345",
    })

    const submitForm = async () => {
      try {
        // 调用后端登录接口
        const res = await loginApi.login(ruleForm)
        if (res?.code === 200 && res.token) {
          const token = res.token
          window.localStorage.setItem("token", token)
          // 解析 JWT，提取角色
          const decoded = jwtDecode<JwtPayload>(token)
          const roles = decoded?.roles || []
          store.roles = roles
          store.userInfo = decoded
          window.localStorage.setItem("userInfo", JSON.stringify(decoded))
          store.getAuthButtonList() //在登录的时候获取按钮级别权限
          router.push({ path: "/" })
        } else {
          // 登录失败处理
          alert(res?.msg || "登录失败")
        }
      } catch (e) {
        console.error("Login error:", e)
        alert("登录失败: 网络错误或服务器异常")
      }
    }

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
