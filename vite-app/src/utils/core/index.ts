export class MicroSandbox {
  //定义变量type
  appName: string
  fakeWindow: Record<string, any>
  proxy: WindowProxy

  constructor(appName: string) {
    //接收appName名称
    this.appName = appName
    //接收一个空对象
    this.fakeWindow = Object.create(null)
    // 初始化模拟API
    this.initSimulatedAPIs()
    // 设置代理
    this.proxy = new Proxy(window, {
      // 定义 get 方法，用于获取属性值
      get: (target: Window, prop: string | symbol) => {
        // 检查属性名是否为字符串，且是否存在于 fakeWindow 中
        if (typeof prop === "string" && prop in this.fakeWindow) return this.fakeWindow[prop]
        // 增强隔离：关键API需要显式允许访问
        const allowedGlobals = ["document", "console", "setTimeout", "clearTimeout"]
        if (typeof prop === "string" && !allowedGlobals.includes(prop)) {
          console.warn(`[${this.appName}] 尝试访问受限全局变量: ${prop}`)
          return undefined
        }
        // 否则，从 target 中获取属性值
        return target[prop as keyof Window]
      },
      // 定义 set 方法，用于设置属性值
      set: (_target: Window, prop: string | symbol, value: any): boolean => {
        // 检查属性名是否为字符串
        if (typeof prop === "string") {
          // 将属性值设置到 fakeWindow 中
          this.fakeWindow[prop] = value
        }
        // 返回 true 表示设置成功
        return true
      },
    })
  }
  // 定义 execScript 方法，用于执行代码
  execScript(code: string, container: HTMLElement): void {
    try {
      // 创建一个新的 Function 实例
      const scopedFunc = new Function("window", "globalThis", code)
      // 调用 scopedFunc 函数
      scopedFunc(this.proxy, this.proxy)
      // 处理样式
      this.processStyles(container)
    } catch (error) {
      console.error(`[${this.appName}] 脚本执行错误:`, error)
      // 可以添加错误边界逻辑，防止影响主应用
    }
  }

  private processStyles(container: HTMLElement): void {
    const styleTags = container.querySelectorAll("style")
    styleTags.forEach((style: HTMLStyleElement) => {
      style.innerHTML = this.scopeCSS(style.textContent || "")
    })
  }

  scopeCSS(css: string): string {
    return (
      css
        .replace(/([^{}]+){/g, (_match, selector) => {
          // 使用下划线忽略未使用参数
          if (selector.includes(`#micro-${this.appName}`)) return _match
          return `#micro-${this.appName} ${selector.trim()} {`
        })
        // 处理媒体查询
        .replace(/@media([^{]+){/g, (_match, media) => {
          return `@media${media}{#micro-${this.appName}{`
        })
        // 闭合媒体查询添加的额外括号
        .replace(/@media([^}]+})/g, "$1}")
    )
  }

  private initSimulatedAPIs(): void {
    // 模拟localStorage隔离
    this.fakeWindow.localStorage = {
      getItem: (key: string) => {
        const prefixedKey = `${this.appName}_${key}`
        return window.localStorage.getItem(prefixedKey)
      },
      setItem: (key: string, value: string) => {
        const prefixedKey = `${this.appName}_${key}`
        return window.localStorage.setItem(prefixedKey, value)
      },
      removeItem: (key: string) => {
        const prefixedKey = `${this.appName}_${key}`
        return window.localStorage.removeItem(prefixedKey)
      },
      clear: () => {
        // 只清除当前应用的存储
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith(`${this.appName}_`))
          .forEach((key) => window.localStorage.removeItem(key))
      },
    }

    // 模拟fetch请求拦截
    this.fakeWindow.fetch = async (input: RequestInfo, init?: RequestInit) => {
      console.log(`[${this.appName}] 拦截请求:`, input)
      // 添加应用标识头
      const headers = { ...init?.headers, "X-Micro-App": this.appName }
      return window.fetch(input, { ...init, headers })
    }
  }
}
