//http.ts
import axios, { AxiosRequestConfig } from "axios"
import NProgress from "nprogress"
import { jwtDecode } from 'jwt-decode'
axios.defaults.baseURL = "/api"
axios.defaults.timeout = 10000
axios.defaults.headers.post["Content-Type"] = "application/json;charset=UTF-8"
axios.interceptors.request.use(
  (config): AxiosRequestConfig<any> => {
    const token = window.sessionStorage.getItem("token")
    if (token) {
      //@ts-ignore
      config.headers.token = token
    }
    return config
  },
  (error) => {
    return error
  }
)

async function refreshToken() {
  const oldToken = window.localStorage.getItem('token')
  if (!oldToken) return null
  try {
    const res = await axios.post('/api/refresh-token', { token: oldToken })
    if (res.data.code === 200) {
      window.localStorage.setItem('token', res.data.token)
      return res.data.token
    }
  } catch (e) {}
  return null
}

axios.interceptors.response.use(
  async (res) => {
    if (res.data.code === 111) {
      // token过期操作，自动刷新
      const newToken = await refreshToken()
      if (newToken) {
        // 可选择重试原请求
        res.config.headers.token = newToken
        return axios(res.config)
      } else {
        window.localStorage.setItem('token', '')
        // 跳转登录页
        window.location.href = '/login'
      }
    }
    return res
  },
  (error) => {
    return Promise.reject(error)
  }
)
interface ResType<T> {
  code: number
  data?: T
  msg: string
  err?: string
}
interface Http {
  get<T>(url: string, params?: unknown): Promise<ResType<T>>
  post<T>(url: string, params?: unknown): Promise<ResType<T>>
  upload<T>(url: string, params: unknown): Promise<ResType<T>>
  download(url: string): void
}
const http: Http = {
  get(url, params) {
    return new Promise((resolve, reject) => {
      NProgress.start()
      axios
        .get(url, { params })
        .then((res) => {
          NProgress.done()
          resolve(res.data)
        })
        .catch((err) => {
          NProgress.done()
          reject(err.data)
        })
    })
  },
  post(url, params) {
    return new Promise((resolve, reject) => {
      NProgress.start()
      axios
        .post(url, JSON.stringify(params))
        .then((res) => {
          NProgress.done()
          resolve(res.data)
        })
        .catch((err) => {
          NProgress.done()
          reject(err.data)
        })
    })
  },
  upload(url, file) {
    return new Promise((resolve, reject) => {
      NProgress.start()
      axios
        .post(url, file, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          NProgress.done()
          resolve(res.data)
        })
        .catch((err) => {
          NProgress.done()
          reject(err.data)
        })
    })
  },
  download(url) {
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.src = url
    iframe.onload = function () {
      document.body.removeChild(iframe)
    }
    document.body.appendChild(iframe)
  },
}
export default http
