<!-- 此模板部分定义了一个 canvas 元素，用于渲染 3D 场景。使用 ref 属性绑定到 canvas 变量，方便后续在脚本中访问。class 属性设置 canvas 的宽度和高度为 100%。 -->
<template>
  <canvas ref="canvas" class="w-full h-full"></canvas>
</template>

<script setup lang="ts">
// 引入 Rapier 3D 物理引擎库，用于实现物理模拟
import * as RAPIER from "@dimforge/rapier3d"
// 引入 Three.js 库，用于创建和渲染 3D 场景
import * as THREE from "three"
// 从 Vue 中引入 onMounted 和 ref 函数，onMounted 用于在组件挂载后执行代码，ref 用于创建响应式引用
import { onMounted, ref } from "vue"
// 从本地文件引入物理世界初始化和获取物理世界的函数
import { initPhysicsWorld, getWorld } from "./rapier"

// 创建一个响应式引用，用于存储 canvas 元素，初始值为 null
const canvas = ref<HTMLCanvasElement | null>(null)

// 组件挂载后执行的异步函数
onMounted(async () => {
  // 创建一个 Three.js 的场景对象，用于容纳所有 3D 对象
  const scene = new THREE.Scene()
  // 创建一个透视相机，设置视野角度为 75 度，宽高比为窗口的宽高比，近裁剪面为 0.1，远裁剪面为 1000
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  // 设置相机的位置，使其位于 (0, 5, 10) 的位置
  camera.position.set(0, 5, 10)

  // 创建一个 WebGL 渲染器，将其绑定到 canvas 元素上
  const renderer = new THREE.WebGLRenderer({ canvas: canvas.value! })
  // 设置渲染器的尺寸为窗口的宽高
  renderer.setSize(window.innerWidth, window.innerHeight)

  // 创建一个立方体的几何体，尺寸为 1x1x1
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
  // 创建一个标准材质，颜色为绿色
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  // 将几何体和材质组合成一个网格对象
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
  // 将立方体网格添加到场景中
  scene.add(cubeMesh)

  // 创建一个平行光，颜色为白色，强度为 1
  const light = new THREE.DirectionalLight(0xffffff, 1)
  // 设置平行光的位置
  light.position.set(10, 10, 10)
  // 将平行光添加到场景中
  scene.add(light)

  // 初始化物理世界，等待初始化完成
  await initPhysicsWorld()
  // 获取物理世界对象
  const world = getWorld()

  // 创建一个动态刚体的描述对象，并设置其初始位置为 (0, 5, 0)
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0)
  // 在物理世界中创建一个刚体
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  // 创建一个长方体碰撞体的描述对象，尺寸为 0.5x0.5x0.5
  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
  // 在物理世界中为刚体创建碰撞体
  world.createCollider(colliderDesc, rigidBody)

  // 创建一个固定刚体的描述对象，用于表示地面
  const groundDesc = RAPIER.RigidBodyDesc.fixed()
  // 在物理世界中创建地面刚体
  const groundBody = world.createRigidBody(groundDesc)
  // 创建一个长方体碰撞体的描述对象，用于表示地面的碰撞体，尺寸为 5x0.1x5
  const groundCollider = RAPIER.ColliderDesc.cuboid(5, 0.1, 5)
  // 在物理世界中为地面刚体创建碰撞体
  world.createCollider(groundCollider, groundBody)

  // 创建一个 Three.js 的网格对象，用于表示地面的可视化部分，尺寸为 10x0.2x10，颜色为灰色
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0x999999 }))
  // 设置地面的位置，使其位于 y 轴 -0.1 的位置
  floor.position.y = -0.1
  // 将地面网格添加到场景中
  scene.add(floor)

  // 定义动画循环函数
  function animate() {
    // 请求浏览器在下一次重绘前调用 animate 函数，实现动画循环
    requestAnimationFrame(animate)

    // 让物理世界进行一次模拟步骤
    world.step()

    // 同步物理刚体的位置和旋转到 Three.js 的网格对象上
    const position = rigidBody.translation()
    const rotation = rigidBody.rotation()
    cubeMesh.position.set(position.x, position.y, position.z)
    cubeMesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)

    // 使用渲染器渲染场景和相机视图
    renderer.render(scene, camera)
  }

  // 启动动画循环
  animate()
})
</script>

<style scoped>
/* 设置 canvas 元素的显示方式为块级元素 */
canvas {
  display: block;
}
</style>
