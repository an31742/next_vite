// 修改wasm导入方式
import * as RAPIER from "@dimforge/rapier3d"
let world: RAPIER.World
export async function initPhysicsWorld() {
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }) // 重力

  return world
}

export function getWorld() {
  return world
}
