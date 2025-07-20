import React from 'react'
const currentDate = new Date().toISOString()
.replace('T', ' ')
.replace(/\.\d+Z$/, '')
const apiList = [
  {
    name: '登录',
    url: '/api/login',
    method: 'POST',
    params: [
      { name: 'name', type: 'string', required: true, desc: '用户名' },
      { name: 'password', type: 'string', required: true, desc: '密码' },
    ],
    desc: '登录，返回 token 和角色',
    example: `axios.post('/api/login', { name: 'admin', password: '12345' })\n  .then(res => console.log(res.data))`
  },
  {
    name: '用户信息',
    url: '/api/userinfo',
    method: 'GET',
    headers: [
      { name: 'Authorization', type: 'string', required: true, desc: 'Bearer <token>' },
    ],
    params: [],
    desc: '获取当前用户信息和角色',
    example: `axios.get('/api/userinfo', { headers: { Authorization: 'Bearer <token>' } })\n  .then(res => console.log(res.data))`
  },
  {
    name: '按钮权限',
    url: '/api/auth-buttons',
    method: 'GET',
    params: [],
    desc: '获取不同角色的按钮权限',
    example: `axios.get('/api/auth-buttons')\n  .then(res => console.log(res.data))`
  },
  {
    name: '刷新 Token',
    url: '/api/refresh-token',
    method: 'POST',
    params: [
      { name: 'token', type: 'string', required: true, desc: '旧 token' },
    ],
    desc: '刷新 token，返回新 token',
    example: `axios.post('/api/refresh-token', { token: '<旧token>' })\n  .then(res => console.log(res.data))`
  },
  {
    name: '动态路由',
    url: '/api/routes',
    method: 'GET',
    headers: [
      { name: 'Authorization', type: 'string', required: true, desc: 'Bearer <token>' },
    ],
    params: [],
    desc: '获取当前用户可访问的路由结构',
    example: `axios.get('/api/routes', { headers: { Authorization: 'Bearer <token>' } })\n  .then(res => console.log(res.data))`
  },
  {
    name: '接口列表',
    url: '/api/route',
    method: 'GET',
    params: [],
    desc: '返回所有可用 API 路径',
    example: `axios.get('/api/route')\n  .then(res => console.log(res.data))`
  },
]

export default function ApiDoc() {
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Inter, sans-serif', background: '#f8f9fb', borderRadius: 16, boxShadow: '0 4px 24px #0001', padding: 32 }}>
      <h1 style={{ textAlign: 'center', color: '#2d3748', fontWeight: 800, letterSpacing: 2, fontSize: 36, marginBottom: 32 }}>API 接口文档</h1>
      <main className="p-4">
      <h1>Next.js API Server</h1>
      <div className="mt-4">
        <p>Current Date and Time (UTC): {currentDate}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>API Base URL: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>
        <p>Frontend URL: {process.env.NEXT_PUBLIC_FRONTEND_URL}</p>
      </div>
    </main>
      {apiList.map((api) => (
        <div key={api.url} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, margin: '32px 0', padding: 28, boxShadow: '0 2px 8px #0001' }}>
          <h2 style={{ margin: 0, color: '#2563eb', fontWeight: 700 }}>{api.name}</h2>
          <div style={{ margin: '8px 0 4px 0' }}><b>地址：</b><code style={{ color: '#b91c1c', fontSize: 16 }}>{api.url}</code></div>
          <div style={{ margin: '4px 0' }}><b>请求方式：</b><span style={{ color: '#059669', fontWeight: 600 }}>{api.method}</span></div>
          {api.headers && api.headers.length > 0 && (
            <div style={{ margin: '4px 0' }}><b>请求头：</b>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {api.headers.map((h) => (
                  <li key={h.name}><code>{h.name}</code> ({h.type}) {h.required ? '必填' : ''} - {h.desc}</li>
                ))}
              </ul>
            </div>
          )}
          {api.params && api.params.length > 0 && (
            <div style={{ margin: '4px 0' }}><b>请求参数：</b>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {api.params.map((p) => (
                  <li key={p.name}><code>{p.name}</code> ({p.type}) {p.required ? '必填' : ''} - {p.desc}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ margin: '4px 0 12px 0' }}><b>说明：</b>{api.desc}</div>
          <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 16, fontSize: 15, fontFamily: 'Fira Mono, monospace', color: '#334155', marginTop: 8 }}>
            <b>axios 示例：</b>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{api.example}</pre>
          </div>
        </div>
      ))}
    </div>
  )
} 