/*
 * @Author: maxiangan
 * @Date: 2023-08-27 21:46:32
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-10-26 14:25:30
 * @Description: 请填写简介
 */ import { defineStore } from "pinia"
import { getAuthButtonListApi } from "@/service/model/login"
import http from "@/service/http.ts"

interface UserStore {
  userInfo: any
  isCollapse: boolean
  userResourceTree: any
  routes: any
  roles: any
  authButtonList: any
  routerName: string
}

export const useCounter = defineStore("user", {
  state: (): UserStore => ({
    // 初始化 state 属性的值
    userInfo: {},
    roles: [],
    isCollapse: false,
    userResourceTree: null,
    routes: [],
    authButtonList: {}, //按钮级别的权限
    routerName: "", //按钮级别的权限就要先获取当前点击的路由
  }),
  getters: {
    // 按钮权限列表
    authButtonListGet: (state) => state.authButtonList,
    routerNameGet: (state) => state.routerName,
  },
  actions: {
    // Get AuthButtonList
    async getAuthButtonList() {
      const { data } = await getAuthButtonListApi()
      this.authButtonList = data
    },
    // 定义 actions 的方法
    async getUserInfo() {
      // 从后端获取用户信息
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await http.get("/userinfo", {})
      if (res.code === 200) {
        this.userInfo = res.data
        this.roles = (res.data as any).roles || []
        localStorage.setItem("userInfo", JSON.stringify(res.data))
      }
    },
    setUserResourceTree(payload: any) {
      this.userResourceTree = payload
    },
    getRoutes(payload: any) {
      this.routes = payload || ""
    },
    getCollapse(payload: boolean) {
      this.isCollapse = payload
    },
    // Set RouteName
    async setRouterName(name: string) {
      this.routerName = name
    },
    logout() {
      this.userInfo = {}
      this.roles = []
      this.authButtonList = {}
      this.routerName = ""
      localStorage.removeItem("token")
      localStorage.removeItem("userInfo")
      localStorage.clear()
    },
  },
  //增加本地持久化
  persist: {
    key: "user",
    storage: localStorage,
  },
})
