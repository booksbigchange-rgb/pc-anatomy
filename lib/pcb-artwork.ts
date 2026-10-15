import * as T from 'three';

type Point = readonly [number, number];
export type PcbRoute = { from: Point; to: Point; lanes: number };

/** Original illustrative routing, not a manufacturer's electrical schematic.
 * A single clipped decal adds fine detail without hundreds of draw calls.
 */
export function addPcbArtwork(
  group: T.Group,
  outline: T.Shape,
  bounds: readonly [number, number, number, number],
  height: number,
  routes: readonly PcbRoute[],
  legends: readonly (readonly [string, number, number])[],
) {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const [minX, minZ, maxX, maxZ] = bounds;
  const sx = canvas.width / (maxX - minX), sz = canvas.height / (maxZ - minZ);
  const point = (x: number, z: number): Point => [(x - minX) * sx, (z - minZ) * sz];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const { from, to, lanes } of routes) {
    for (let lane = 0; lane < lanes; lane++) {
      const offset = (lane - (lanes - 1) / 2) * 0.027;
      const a = point(from[0] + offset, from[1]);
      const b = point(to[0] + offset, to[1]);
      const bend = Math.min(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * .55;
      const direction = Math.sign(b[1] - a[1]);
      ctx.strokeStyle = 'rgba(105,167,142,.34)';
      ctx.lineWidth = Math.max(1, sx * .007);
      ctx.beginPath(); ctx.moveTo(...a);
      ctx.lineTo(a[0], b[1] - direction * bend);
      ctx.lineTo(a[0] + Math.sign(b[0] - a[0]) * bend, b[1]);
      ctx.lineTo(...b); ctx.stroke();
      for (const p of [a, b]) {
        ctx.strokeStyle = 'rgba(186,169,111,.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p[0], p[1], sx * .013, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
  ctx.fillStyle = 'rgba(213,224,205,.8)';
  ctx.font = `${Math.round(sx * .065)}px monospace`;
  for (const [text, x, z] of legends) {
    const p = point(x, z);
    ctx.fillText(text, p[0], p[1]);
    ctx.strokeStyle = 'rgba(213,224,205,.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p[0] - 4, p[1] + 5, sx * .18, sz * .085);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = new T.ShapeGeometry(outline, 24);
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, (positions.getX(i) - minX) / (maxX - minX), 1 - (positions.getY(i) - minZ) / (maxZ - minZ));
  }
  const mesh = new T.Mesh(geometry, new T.MeshStandardMaterial({
    map: texture, transparent: true, depthWrite: false, roughness: .72,
    side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }));
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = height;
  mesh.name = 'PCB routing and silkscreen';
  mesh.userData.geometryRole = 'board-artwork';
  mesh.receiveShadow = true;
  // Printed ink cannot intercept a click intended for a socket or component.
  mesh.raycast = () => {};
  group.add(mesh);
}
