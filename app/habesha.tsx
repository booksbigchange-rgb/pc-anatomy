/**
 * Habesha touches shared by the labs: a Tigrinya welcome in Ge'ez script and
 * the tibeb woven-border pattern. Wording should be checked by a Tigrinya-speaking teacher.
 */
export const TIGRINYA_WELCOME = 'እንቋዕ ብደሓን መጻእኩም';
export const GEEZ_FONT = "'Noto Sans Ethiopic', 'Ebrima', 'Nyala', sans-serif";

/** Tibeb colours: cream cloth with indigo edges, green, gold and red motifs. */
export const TIBEB = { cloth: '#f3ead8', edge: '#2b4c8c', green: '#2f7d4f', gold: '#d9a441', red: '#b8322e' } as const;

export function TigrinyaWelcome({ className = '' }: { className?: string }) {
  return (
    <span className={'geez-welcome ' + className}>
      <span lang="ti">{TIGRINYA_WELCOME}</span>
      <span aria-hidden="true"> · </span>
      <span>Welcome</span>
    </span>
  );
}

/** Draw a band of tibeb into a 2D canvas: edges, then alternating red and green diamonds with gold crosses. */
export function paintTibeb(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.fillStyle = TIBEB.cloth;
  context.fillRect(x, y, width, height);
  const edge = Math.max(2, height * 0.12);
  context.fillStyle = TIBEB.edge;
  context.fillRect(x, y, width, edge);
  context.fillRect(x, y + height - edge, width, edge);
  const unit = height * 1.4, mid = y + height / 2, r = (height - edge * 2) * 0.42;
  for (let cx = x + unit / 2, i = 0; cx < x + width; cx += unit, i++) {
    context.fillStyle = i % 2 ? TIBEB.green : TIBEB.red;
    context.beginPath();
    context.moveTo(cx, mid - r); context.lineTo(cx + r, mid); context.lineTo(cx, mid + r); context.lineTo(cx - r, mid);
    context.closePath(); context.fill();
    context.strokeStyle = TIBEB.gold; context.lineWidth = Math.max(1, height * 0.05); context.stroke();
    context.fillStyle = TIBEB.gold;
    const c = r * 0.22, gap = unit / 2;
    context.fillRect(cx + gap - c, mid - c * 2.5, c * 2, c * 5);
    context.fillRect(cx + gap - c * 2.5, mid - c, c * 5, c * 2);
  }
}
