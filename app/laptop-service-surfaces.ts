import * as THREE from 'three';

// Original illustrative surface artwork, not a manufacturer's electrical layout.
// One small canvas per surface keeps the detail inexpensive on classroom devices.
export function applyServiceSurface(
  item: THREE.Mesh,
  role: 'board' | 'battery',
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = role === 'board' ? '#205448' : '#20262a';
  ctx.fillRect(0, 0, 1536, 768);
  if (role === 'board') {
    // Fine parallel routing with 45-degree turns, solder vias and silk outlines.
    ctx.lineWidth = 2;
    for (let bank = 0; bank < 12; bank++) {
      const x = 55 + (bank % 6) * 246;
      const y = 90 + Math.floor(bank / 6) * 370;
      for (let lane = 0; lane < 12; lane++) {
        const d = lane * 7;
        ctx.strokeStyle = lane % 3 ? '#32685a' : '#3b7060';
        ctx.beginPath();
        ctx.moveTo(x + d, y);
        ctx.lineTo(x + d, y + 65);
        ctx.lineTo(x + d + 45, y + 110);
        ctx.lineTo(x + d + 45, y + 210);
        ctx.stroke();
        ctx.fillStyle = '#b19a68';
        ctx.beginPath();
        ctx.arc(x + d + 45, y + 210, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#123a31';
        ctx.beginPath();
        ctx.arc(x + d + 45, y + 210, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#8ea99b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 18, y + 235, 106, 42);
      ctx.fillStyle = '#c4d2bd';
      ctx.font = '12px monospace';
      ctx.fillText('U' + (bank + 12), x + 20, y + 292);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = '#afac89';
        ctx.fillRect(x + i * 22, y + 318, 7, 10);
        ctx.fillRect(x + i * 22, y + 337, 7, 10);
      }
    }
    ctx.fillStyle = '#ccdac6';
    ctx.font = '18px monospace';
    ctx.fillText('BIG CHANGE  /  LAPTOP LAB', 530, 40);
    ctx.font = '13px monospace';
    ctx.fillText('EDUCATIONAL MAINBOARD   REV 1.0', 540, 62);
  } else {
    // Cell divisions, printed technical label and safety pictograms.
    for (let i = 1; i < 4; i++) {
      ctx.fillStyle = '#11171b';
      ctx.fillRect(i * 384 - 3, 30, 6, 708);
      ctx.fillStyle = '#30373b';
      ctx.fillRect(i * 384 + 3, 30, 2, 708);
    }
    ctx.fillStyle = '#171d21';
    ctx.fillRect(160, 155, 1216, 430);
    ctx.strokeStyle = '#454e53';
    ctx.strokeRect(160, 155, 1216, 430);
    ctx.fillStyle = '#dce0dc';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Li-ion', 200, 222);
    ctx.font = '24px sans-serif';
    ctx.fillText('RECHARGEABLE LAPTOP BATTERY', 380, 220);
    ctx.fillStyle = '#a9b3b6';
    ctx.font = '21px monospace';
    ctx.fillText('BIG CHANGE  /  LEARNING MODEL', 200, 272);
    ctx.font = '20px sans-serif';
    [
      'Do not bend, puncture or crush.',
      'Disconnect power before servicing.',
      'Keep away from heat and water.',
    ].forEach((line, i) => ctx.fillText(line, 200, 340 + i * 36));
    ctx.strokeStyle = '#c3cbc9';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(1150, 315);
    ctx.lineTo(1080, 435);
    ctx.lineTo(1220, 435);
    ctx.closePath();
    ctx.stroke();
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText('!', 1141, 419);
    ctx.font = '18px monospace';
    ctx.fillText('RECYCLE RESPONSIBLY', 200, 532);
    for (let i = 0; i < 105; i++) {
      ctx.fillStyle = '#bac3c2';
      ctx.fillRect(850 + i * 4, 495, i % 3 === 0 ? 3 : 1, 43);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const geometry = item.geometry.clone();
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) - box.min.x) / (box.max.x - box.min.x);
    uv[i * 2 + 1] =
      1 - (position.getZ(i) - box.min.z) / (box.max.z - box.min.z);
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  item.geometry = geometry;
  item.material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: role === 'board' ? 0.56 : 0.82,
    metalness: role === 'board' ? 0.08 : 0.02,
  });
}
