import http from "@/service/http.ts"
import * as T from "./types"
const getAuthButtonListData = {
  code: 200,
  data: {
    authButton: ["add", "batchAdd", "export", "batchDelete", "status"],
    useProTable: ["add", "batchAdd", "export", "batchDelete", "status"],
    authTable: ["delete", "edit"],
  },
  msg: "成功",
}

const loginApi: T.ILoginApi = {
  async login(params) {
    // 适配后端 /api/login
    return await http.post("/login", params)
  },
}
export default loginApi

// 获取按钮权限
export const getAuthButtonListApi = () => {
  return getAuthButtonListData
}
