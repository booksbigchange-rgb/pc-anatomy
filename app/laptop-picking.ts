import * as THREE from 'three';

// Three.js raycasting includes invisible objects and children of hidden groups.
// Ignore these retired fallback meshes before resolving the selectable owner.
export function visiblePartHit(hits: THREE.Intersection[]) {
  for (const hit of hits) {
    let node: THREE.Object3D | null = hit.object;
    let id: string | undefined;
    let visible = true;
    while (node) {
      if (!node.visible) visible = false;
      id ??= node.userData.laptopPart;
      node = node.parent;
    }
    if (visible && id) return { hit, id };
  }
  return null;
}
