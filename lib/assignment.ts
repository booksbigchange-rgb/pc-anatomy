import { lessonById } from './lessons/index.ts';

/**
 * A teacher's assignment: a list of lessons, and optionally a title, carried
 * in a link. There are no accounts, so the link is the whole of it: a
 * student who opens it keeps a copy in their own browser, shown on the
 * School home until they clear it.
 *
 *   /?assign=meet-the-machine,the-motherboard&title=Week%203
 */

export type Assignment = { lessons: string[]; title?: string };

export const assignmentKey = 'pc-anatomy:assignment:v1';
const titleLimit = 80;

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Known lessons only, each once, in the order given. */
export function cleanAssignment(
  lessons: unknown,
  title?: unknown,
): Assignment | null {
  if (!Array.isArray(lessons)) return null;
  const kept = [
    ...new Set(
      lessons.filter(
        (id): id is string =>
          typeof id === 'string' && Object.hasOwn(lessonById, id),
      ),
    ),
  ];
  if (kept.length === 0) return null;
  const name =
    typeof title === 'string' ? title.trim().slice(0, titleLimit) : '';
  return name ? { lessons: kept, title: name } : { lessons: kept };
}

export function readAssignment(store: Store | null): Assignment | null {
  try {
    const raw = store?.getItem(assignmentKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { lessons, title } = parsed as Record<string, unknown>;
    return cleanAssignment(lessons, title);
  } catch {
    return null;
  }
}

export function writeAssignment(
  store: Store | null,
  assignment: Assignment | null,
) {
  try {
    if (assignment) store?.setItem(assignmentKey, JSON.stringify(assignment));
    else store?.removeItem(assignmentKey);
  } catch {
    // Blocked storage: the assignment simply is not remembered.
  }
}
