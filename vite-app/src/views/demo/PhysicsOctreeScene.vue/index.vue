<script setup lang="ts">
import * as THREE from "three"
import { onMounted, ref } from "vue"
import { OctreeNode } from "./octree"

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 10

  const renderer = new THREE.WebGLRenderer({ canvas: canvas.value! })
  renderer.setSize(window.innerWidth, window.innerHeight)

  // 地图边界用于 Octree
  const boundary = new THREE.Box3(new THREE.Vector3(-50, -50, -50), new THREE.Vector3(50, 50, 50))
  const octree = new OctreeNode(boundary)

  const cubes: THREE.Mesh[] = []

  for (let i = 0; i < 100; i++) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00 }))
    cube.position.set(THREE.MathUtils.randFloatSpread(100), THREE.MathUtils.randFloatSpread(100), THREE.MathUtils.randFloatSpread(100))
    scene.add(cube)
    cubes.push(cube)
    octree.insert(cube)
  }

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 10, 10)
  scene.add(light)

  function animate() {
    requestAnimationFrame(animate)

    const playerBox = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))
    const nearObjects = octree.query(playerBox)

    nearObjects.forEach((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.set(0xff0000)
      }
    })

    renderer.render(scene, camera)
  }

  animate()
})
</script>

<template>
  <canvas ref="canvas" class="w-full h-full"></canvas>
</template>
