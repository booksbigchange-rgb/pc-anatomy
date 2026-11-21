const KEY = 'bigchange-course-v1';
export type CourseProgress = { flow: boolean; os: boolean; laptopScore: number | null; finalAnswers: Record<string, string> };
export const EMPTY_COURSE: CourseProgress = { flow: false, os: false, laptopScore: null, finalAnswers: {} };
export const FINAL_QUESTIONS = [
  { id: 'cpu', prompt: 'You export a video. Which part follows the processing instructions?', options: ['CPU', 'SSD', 'Speaker'], answer: 'CPU', why: 'The CPU processes instructions. Storage keeps the files.' },
  { id: 'ram', prompt: 'You close many browser tabs. Which working space is released?', options: ['SSD storage', 'RAM', 'Power supply'], answer: 'RAM', why: 'RAM holds working data for open apps.' },
  { id: 'save', prompt: 'Where does a saved file stay after you shut down?', options: ['CPU', 'RAM only', 'SSD'], answer: 'SSD', why: 'Saved files stay on storage. RAM loses its contents without power.' },
  { id: 'safe', prompt: 'Before changing an internal connection, what should you do?', options: ['Shut down and unplug power', 'Connect wall power', 'Force the plug'], answer: 'Shut down and unplug power', why: 'Disconnect power before touching internal hardware. Follow the real device manual.' },
  { id: 'key', prompt: 'RAM does not line up with its slot. What next?', options: ['Push harder', 'Check its type and notch direction', 'Remove the fan'], answer: 'Check its type and notch direction', why: 'A compatible module must match the slot. Never force it.' },
  { id: 'disk', prompt: 'Task Manager says Disk 90%. What does that number describe?', options: ['Storage is 90% full', 'RAM capacity', 'Disk activity'], answer: 'Disk activity', why: 'Disk activity shows reading and writing. It does not show how much storage is full.' },
  { id: 'os', prompt: 'What does an operating system do?', options: ['Manages apps, files and hardware access', 'Replaces electrical power', 'Is the motherboard'], answer: 'Manages apps, files and hardware access', why: 'The OS manages these services. Apps ask it to use hardware.' },
  { id: 'fault', prompt: 'The screen has no signal. What is a useful first test?', options: ['Erase files', 'Buy a new CPU', 'Check the display cable and input'], answer: 'Check the display cable and input', why: 'Collect relevant evidence before replacing parts or changing files.' },
] as const;
export function readCourse(): CourseProgress {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!data || typeof data !== 'object') return { ...EMPTY_COURSE, finalAnswers: {} };
    const answers: Record<string, string> = {};
    for (const question of FINAL_QUESTIONS) if (question.options.some(value => value === data.finalAnswers?.[question.id])) answers[question.id] = data.finalAnswers[question.id];
    return { flow: data.flow === true, os: data.os === true, laptopScore: Number.isInteger(data.laptopScore) && data.laptopScore >= 0 && data.laptopScore <= 100 ? data.laptopScore : null, finalAnswers: answers };
  } catch { return { ...EMPTY_COURSE, finalAnswers: {} }; }
}
export function saveCourse(update: Partial<CourseProgress>) {
  const next = { ...readCourse(), ...update };
  try { localStorage.setItem(KEY, JSON.stringify(next)); return true; } catch { return false; }
}
export function assessmentResult(answers: Record<string, string>) {
  const answered = FINAL_QUESTIONS.filter(q => q.options.some(value => value === answers[q.id])).length;
  const correct = FINAL_QUESTIONS.filter(q => answers[q.id] === q.answer).length;
  return { answered, correct, complete: answered === FINAL_QUESTIONS.length, percent: Math.round(correct / FINAL_QUESTIONS.length * 100) };
}

export type OsState = { powered: boolean; signedIn: boolean; editor: boolean; draft: string; saved: string | null; deleted: string | null; restored: boolean; reopened: boolean };
export const EMPTY_OS: OsState = { powered: false, signedIn: false, editor: false, draft: '', saved: null, deleted: null, restored: false, reopened: false };
export function osAction(state: OsState, action: 'power' | 'sign-in' | 'open' | 'save' | 'close' | 'reopen' | 'delete' | 'restore' | 'shutdown', text = state.draft): { state: OsState; feedback: string } {
  if (action === 'power') return { state: { ...state, powered: true }, feedback: 'Startup checks finish. The OS loads from storage. Sign in next.' };
  if (!state.powered) return { state, feedback: 'Power on the virtual computer first.' };
  if (action === 'sign-in') return { state: { ...state, signedIn: true }, feedback: 'Desktop ready. Open Notes to make a file.' };
  if (!state.signedIn) return { state, feedback: 'Sign in to the virtual desktop first.' };
  if (action === 'shutdown') return { state: { ...state, powered: false, signedIn: false, editor: false, draft: '' }, feedback: 'Computer off. Working data is cleared. Your saved file stays on virtual storage.' };
  if (action === 'open') return { state: { ...state, editor: true, draft: '' }, feedback: 'Notes is open. Type a short note, then save it.' };
  if (action === 'save') {
    if (!state.editor || !text.trim()) return { state, feedback: 'Open Notes and type something before saving.' };
    return { state: { ...state, draft: text, saved: text, deleted: null }, feedback: 'Saved as My note.txt on virtual storage.' };
  }
  if (action === 'close') return { state: { ...state, editor: false, draft: '' }, feedback: 'Notes closed. Unsaved text is discarded; saved text stays in Files.' };
  if (action === 'reopen') return state.saved === null ? { state, feedback: 'No saved file. Create and save a note first.' } : { state: { ...state, editor: true, draft: state.saved, reopened: true }, feedback: 'Saved file opened. The OS reads it from storage into working memory.' };
  if (action === 'delete') return state.saved === null ? { state, feedback: 'Save a file first.' } : { state: { ...state, deleted: state.saved, saved: null, editor: false, draft: '' }, feedback: 'File moved to the virtual Recycle Bin. Restore it next.' };
  if (action === 'restore') return state.deleted === null ? { state, feedback: 'The Recycle Bin is empty.' } : { state: { ...state, saved: state.deleted, deleted: null, restored: true }, feedback: 'File restored to Files. This simulates a recoverable deletion, not every type of data loss.' };
  return { state, feedback: 'Choose an action.' };
}
