import * as THREE from "three"

export class OctreeNode {
  boundary: THREE.Box3
  objects: THREE.Object3D[] = []
  children: OctreeNode[] | null = null
  capacity = 4
  depth: number

  constructor(boundary: THREE.Box3, depth = 0) {
    this.boundary = boundary
    this.depth = depth
  }

  insert(object: THREE.Object3D) {
    if (!this.boundary.containsPoint(object.position)) return false

    if (this.objects.length < this.capacity || this.depth >= 5) {
      this.objects.push(object)
      return true
    }

    if (!this.children) this.subdivide()

    for (const child of this.children!) {
      if (child.insert(object)) return true
    }

    return false
  }

  query(range: THREE.Box3, found: THREE.Object3D[] = []) {
    if (!this.boundary.intersectsBox(range)) return found

    for (const obj of this.objects) {
      if (range.containsPoint(obj.position)) found.push(obj)
    }

    if (this.children) {
      for (const child of this.children) {
        child.query(range, found)
      }
    }

    return found
  }

  subdivide() {
    const min = this.boundary.min
    const max = this.boundary.max
    const center = this.boundary.getCenter(new THREE.Vector3())

    this.children = []
    for (let x = 0; x <= 1; x++) {
      for (let y = 0; y <= 1; y++) {
        for (let z = 0; z <= 1; z++) {
          const newMin = new THREE.Vector3(x ? center.x : min.x, y ? center.y : min.y, z ? center.z : min.z)
          const newMax = new THREE.Vector3(x ? max.x : center.x, y ? max.y : center.y, z ? max.z : center.z)
          const box = new THREE.Box3(newMin, newMax)
          this.children.push(new OctreeNode(box, this.depth + 1))
        }
      }
    }
  }
}
