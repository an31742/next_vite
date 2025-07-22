# Next.js 缓存策略大白话对比: unstable_cache vs revalidate

## 实验目的
用最简单的话对比 Next.js 两种缓存方法有啥不一样，帮你搞懂什么时候该用哪个。

## 实验环境
- Next.js 版本: 14.x (就用这个版本测试的)
- Node.js 版本: 18.x (运行代码的环境)
- 测试工具: 命令行、浏览器开发者工具、Vercel数据分析

## 缓存机制像什么?
### 1. unstable_cache: 你的专属储物柜 🗄️
- 就像超市的储物柜，你存东西时拿个号码牌(缓存键)，取的时候凭号码牌
- 专门用来存函数计算出来的结果，下次要用直接拿，不用重新算
- 可以自己设定多久过期(比如1小时后自动清空)
- 适合存零散的小数据，比如单个商品信息、用户资料

举个栗子:
```javascript
import { unstable_cache } from 'next/cache'

// 给获取商品数据的函数配个储物柜
const getProductData = unstable_cache(async (productId) => {
  // 这里是从API获取数据的代码
  const res = await fetch(`https://api.example.com/products/${productId}`)
  return res.json()
}, ['product-data'], { revalidate: 3600 }) // 存1小时(3600秒)
```

### 2. revalidate: 定时刷新的黑板报 📢
- 像教室后面的黑板报，老师设定每天早上更新一次(定时刷新)
- 整个页面或路由共用一个缓存，要么全刷新要么全不刷新
- 适合整个页面的缓存，比如商品列表页、博客首页

两种用法:
```javascript
// 方法1: 定时刷新 - 每60秒擦黑板重写
export const revalidate = 60 // 60秒后自动刷新

// 方法2: 手动刷新 - 有新内容时立即更新
import { revalidatePath } from 'next/cache'

export async function action() {
  // 比如发布了新文章后
  revalidatePath('/blog') // 立即刷新博客页面
}
```

## 实验设计: 我们怎么测试?
### 测试哪些情况?
1. **基本操作**: 第一次加载(现做现卖) vs 缓存命中(直接拿现成的)
2. **过期方式**: 时间到了自动过期 vs 手动刷新
3. **速度对比**: 哪个加载更快? 服务器更轻松?
4. **多人同时访问**: 很多人一起用的时候会不会出问题?

### 具体怎么做的?
1. 建了两个测试接口:
   - `/api/cache-unstable`: 用储物柜(unstable_cache)方案
   - `/api/cache-revalidate`: 用黑板报(revalidate)方案

2. 代码长这样(不用全看懂，知道大概意思就行):

**储物柜方案代码** (app/api/cache-unstable/route.js):
```javascript
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'

// 模拟从数据库取数据(故意等1秒模拟网络延迟)
async function fetchData() {
  console.log('正在从数据库取新数据...')
  await new Promise(resolve => setTimeout(resolve, 1000)) // 等1秒
  return {
    timestamp: Date.now(), // 当前时间戳(用来判断是不是新数据)
    data: '这是动态生成的数据'
  }
}

// 给上面的函数配个储物柜，存30秒
const getCachedData = unstable_cache(
  async () => fetchData(),
  ['test-data'], // 储物柜编号
  { revalidate: 30 } // 30秒后自动清空
)

export async function GET() {
  const data = await getCachedData() // 先看储物柜里有没有
  return NextResponse.json(data) // 返回数据给用户
}
```

**黑板报方案代码** (app/api/cache-revalidate/route.js):
```javascript
import { NextResponse } from 'next/server'

// 整个接口30秒刷新一次
export const revalidate = 30 // 30秒后自动刷新

// 模拟从数据库取数据(故意等1秒)
async function fetchData() {
  console.log('正在从数据库取新数据...')
  await new Promise(resolve => setTimeout(resolve, 1000)) // 等1秒
  return {
    timestamp: Date.now(), // 当前时间戳
    data: '这是动态生成的数据'
  }
}

export async function GET() {
  const data = await fetchData() // 每次调用都执行这个函数
  return NextResponse.json(data) // 返回数据给用户
}
```

## 怎么测试这两个方案?
1. 先启动开发服务器:
```bash
npm run dev
```

2. 测试缓存效果:
```bash
# 第一次请求(会等1秒，因为要去数据库取数据)
curl http://localhost:3000/api/cache-unstable
curl http://localhost:3000/api/cache-revalidate

# 马上再请求一次(应该很快，因为用了缓存)****
curl http://localhost:3000/api/cache-unstable
curl http://localhost:3000/api/cache-revalidate
```

3. 测试缓存过期:
- 等30秒后再请求，应该会看到新的时间戳(缓存过期了)
- 黑板报方案还可以手动刷新(不用等30秒):
```bash
curl -X POST http://localhost:3000/api/cache-revalidate/revalidate
```

4. 看看哪个更快:
- 用浏览器按F12打开开发者工具，在Network标签看加载时间
- 看服务器控制台，数数"正在从数据库取新数据..."出现了几次(越少说明缓存效果越好)

## 测试结果怎么样?
| 特性 | unstable_cache(储物柜) | revalidate(黑板报) |
|------|----------------------|-------------------|
| 缓存粒度 | 可以存很小的数据块(单个函数结果) | 只能存整个页面/接口 |
| 过期方式 | 定时过期/按编号删除 | 定时过期/按页面路径刷新 |
| 适合场景 | 零散数据(商品详情、用户信息) | 整个页面(博客列表、商品列表) |
| 灵活度 | 很高(可以有多个不同储物柜) | 一般(整个页面一起刷新) |
| 稳定性 | 实验性(未来可能会变) | 稳定(官方推荐用这个) |
| 服务器压力 | 小(只刷新需要的小数据) | 中(整个页面都要重新生成) |

## 该怎么选? 给小白的建议
1. **用储物柜(unstable_cache)如果**: 
   - 你要缓存单个数据(比如一个用户资料)
   - 需要很灵活的缓存控制
   - 不介意它以后可能会变

2. **用黑板报(revalidate)如果**: 
   - 缓存整个页面或接口
   - 需要稳定可靠的方案
   - 不想操心太多细节

3. **注意**: unstable_cache有"unstable"(不稳定)字样，生产项目用之前最好确认下官方文档

4. **小技巧**: 可以混合用! 数据层用储物柜存零散数据，页面层用黑板报整体控制

## 想深入研究? 可以试试这些
1. 试试不同的缓存时间(10秒vs5分钟)有什么区别
2. 模拟很多人同时访问，看看缓存会不会出问题
3. 比较本地开发环境和Vercel生产环境的缓存表现
4. 结合静态页面生成(ISR)搞更复杂的缓存策略