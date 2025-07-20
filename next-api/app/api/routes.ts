import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const SECRET = "your_jwt_secret"

const allRoutes = [
  {
    path: "/home",
    name: "home",
    meta: {
      title: "首页",
      anchors: "admin",
    },
    children: [],
  },
  {
    path: "/demo",
    name: "demo",
    meta: {
      title: "demo",
      anchors: "admin",
    },
    children: [
      {
        path: "/demo/toLocalStorage",
        name: "toLocalStorage",
        meta: { title: "toLocalStorage", anchors: "admin" },
        children: [],
      },
      {
        path: "/demo/demoLayOut",
        name: "demoLayOut",
        meta: { title: "demoLayOut", anchors: "admin" },
        children: [],
      },
      {
        path: "/demo/vue3",
        name: "vue3",
        meta: { title: "vue3", anchors: "admin" },
        children: [
          {
            path: "/demo/vue3/authTable",
            name: "authTable",
            meta: { title: "authTable", anchors: "admin" },
            children: [],
          },
        ],
      },
    ],
  },
]

function filterRoutesByRole(routes, roles) {
  return routes
    .filter((route) => !route.meta.anchors || roles.includes(route.meta.anchors))
    .map((route) => ({
      ...route,
      children: route.children ? filterRoutesByRole(route.children, roles) : [],
    }))
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.replace("Bearer ", "")
  try {
    const decoded = jwt.verify(token, SECRET)
    const roles = decoded.roles || []
    const userRoutes = filterRoutesByRole(allRoutes, roles)
    return NextResponse.json({ code: 200, data: userRoutes })
  } catch (e) {
    return NextResponse.json({ code: 401, msg: "无效token" }, { status: 401 })
  }
}
