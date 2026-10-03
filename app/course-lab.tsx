import { useState } from 'react';
import AcademyLogo from './academy-logo';
import { readProgress } from './student-progress';
import { EMPTY_OS, FINAL_QUESTIONS, assessmentResult, osAction, readCourse, saveCourse, type CourseProgress } from './course-model';
import './course-lab.css';

const FLOW = [
  { title: 'Open a saved photo', question: 'Where is the saved photo?', choices: ['RAM', 'SSD', 'Fan'], answer: 'SSD', explanation: 'Storage keeps saved files when power is off.' },
  { title: 'Load the photo', question: 'Where does the app hold its working copy?', choices: ['RAM', 'Speaker', 'Power supply'], answer: 'RAM', explanation: 'The OS and app load working data into RAM.' },
  { title: 'Edit the photo', question: 'Which part processes the editing instructions?', choices: ['Battery', 'SSD', 'CPU'], answer: 'CPU', explanation: 'The CPU processes instructions. RAM holds the working data. Graphics hardware helps draw the result.' },
  { title: 'Save your edit', question: 'Where must the edited file be written?', choices: ['Fan', 'SSD', 'RAM only'], answer: 'SSD', explanation: 'Saving writes changes back to storage. Closing without saving can lose the edit.' },
  { title: 'Shut down', question: 'What happens to the working copy in RAM?', choices: ['It is cleared without power', 'It becomes a cable', 'It replaces the SSD'], answer: 'It is cleared without power', explanation: 'Saved changes remain on the SSD. Working RAM needs power.' },
];
type Tab = 'path' | 'flow' | 'os' | 'check';
export default function CourseLab({ onBack, onActivity }: { onBack: () => void; onActivity: (activity: 'laptop' | 'assembly' | 'task-manager-pc') => void }) {
  const [tab, setTab] = useState<Tab>('path');
  const [progress, setProgress] = useState(readCourse);
  const hardware = readProgress();
  const [saveFailed, setSaveFailed] = useState(false);
  const update = (patch: Partial<CourseProgress>) => { const next = { ...progress, ...patch }; setProgress(next); setSaveFailed(!saveCourse(next)); };
  const [flowStep, setFlowStep] = useState(0);
  const [flowCorrect, setFlowCorrect] = useState(false);
  const [flowFeedback, setFlowFeedback] = useState('Choose the part that handles this step.');
  const [flowDone, setFlowDone] = useState(false);
  const [os, setOs] = useState(EMPTY_OS);
  const [osFeedback, setOsFeedback] = useState('Start with Power on. This desktop and its files are simulated.');
  const [cycled, setCycled] = useState(false);
  const [answerIndex, setAnswerIndex] = useState(0);
  const result = assessmentResult(progress.finalAnswers);
  const question = FINAL_QUESTIONS[answerIndex];
  const answer = progress.finalAnswers[question.id];
  const act = (action: Parameters<typeof osAction>[1]) => {
    const next = osAction(os, action);
    if (action === 'shutdown' && os.saved !== null && os.signedIn) setCycled(true);
    setOs(next.state); setOsFeedback(next.feedback);
    if (next.state.restored && next.state.reopened && cycled) update({ os: true });
  };
  const download = () => {
    const report = { academy: 'BigChange Academy', version: 1, date: new Date().toISOString(), hardware, course: progress, finalResult: result, note: 'Practice results saved by this browser. Not a repair qualification or independently supervised assessment.' };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'bigchange-my-learning.json'; anchor.click(); URL.revokeObjectURL(url);
  };
  const completed = [hardware.pcBuilt, hardware.taskManager.length === 4, progress.laptopScore !== null, progress.flow, progress.os, result.complete].filter(Boolean).length;
  return <main className="course-lab">
    <header><button onClick={onBack}>← Computer Lab</button><AcademyLogo /><div><h1>My learning path</h1><p>BigChange Academy · Version 1 · Teacher Hermon Tesfay</p></div></header>
    <nav aria-label="Course sections">{([['path', 'Learning path'], ['flow', 'How parts work together'], ['os', 'OS and files'], ['check', 'Final knowledge check']] as const).map(([id, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {saveFailed && <p role="alert">This browser could not save your latest result. Keep this page open and download your results before leaving.</p>}
    {tab === 'path' && <section aria-label="Learning path"><h2>Explore → Build → Test → Explain</h2><p>{completed} / 6 results recorded. A recorded attempt is not always a passing score.</p><progress max={6} value={completed} />
      <ol className="course-path">
        <li><h3>Explore the laptop</h3><p>Find parts, follow the Guided lesson, practise connections and troubleshooting. Finish its Knowledge check.</p><p>{progress.laptopScore === null ? 'Knowledge check not recorded yet' : `Latest knowledge check: ${progress.laptopScore}%`}</p><button onClick={() => onActivity('laptop')}>Open Laptop Lab</button></li>
        <li><h3>Build your PC</h3><p>Orient, seat and secure parts. Connect cables and pass the power-on check.</p><p>{hardware.pcBuilt ? '✓ Simulated POST passed' : 'Build not completed yet'}</p><button onClick={() => onActivity('assembly')}>Open PC Build</button></li>
        <li><h3>Use Task Manager</h3><p>Finish all four challenges. Explain what changed in the before/after readings.</p><p>{hardware.taskManager.length} / 4 challenges</p><button onClick={() => onActivity('task-manager-pc')}>Open Task Manager</button></li>
        <li><h3>Follow the data</h3><p>Open, edit and save a photo. Explain CPU, RAM and storage.</p><p>{progress.flow ? '✓ Practice completed' : 'Not completed'}</p><button onClick={() => setTab('flow')}>Follow a photo</button></li>
        <li><h3>Use an operating system</h3><p>Create, save, reopen, delete and restore a virtual file.</p><p>{progress.os ? '✓ Practice completed' : 'Not completed'}</p><button onClick={() => setTab('os')}>Start OS practice</button></li>
        <li><h3>Check your understanding</h3><p>Answer eight questions. Review mistakes and practise again.</p><p>{result.complete ? `${result.correct} / 8 correct · ${result.percent}%` : `${result.answered} / 8 answered`}</p><button onClick={() => setTab('check')}>Start final check</button></li>
      </ol><button onClick={download}>Download my results</button><p>Results stay in this browser. They are not shared with the teacher automatically. Clearing browser data removes them.</p>
    </section>}
    {tab === 'flow' && <section aria-label="Data flow practice"><h2>Follow a photo</h2><p>A simplified route. Real apps also use caches, drivers and other services.</p>
      <div className="course-flow" aria-label="Photo data route">{['SSD: saved photo', 'RAM: working copy', 'CPU: edit instructions', 'SSD: saved changes'].map((label, i) => <div key={label} className={i === Math.min(flowStep, 3) ? 'current' : ''}>{label}<span aria-hidden="true"> →</span></div>)}</div>
      {flowDone ? <><h3>✓ Photo saved. Working memory cleared.</h3><p>Your saved edit stays on the SSD after shutdown.</p><button onClick={() => { setFlowStep(0); setFlowCorrect(false); setFlowDone(false); setFlowFeedback('Choose the part that handles this step.'); }}>Practise again</button></> : <><p>Step {flowStep + 1} / {FLOW.length}</p><h3>{FLOW[flowStep].title}</h3><p>{FLOW[flowStep].question}</p><div className="course-choices">{FLOW[flowStep].choices.map(choice => <button key={choice} disabled={flowCorrect} onClick={() => { const correct = choice === FLOW[flowStep].answer; setFlowCorrect(correct); setFlowFeedback(correct ? FLOW[flowStep].explanation : 'Try again. Think about this part’s job.'); }}>{choice}</button>)}</div><output>{flowFeedback}</output><button disabled={!flowCorrect} onClick={() => { if (flowStep === FLOW.length - 1) { setFlowDone(true); update({ flow: true }); } else { setFlowStep(flowStep + 1); setFlowCorrect(false); setFlowFeedback('Choose the part that handles this step.'); } }}>{flowStep === FLOW.length - 1 ? 'Finish photo practice' : 'Next step'}</button></>}
    </section>}
    {tab === 'os' && <section aria-label="Operating system practice"><h2>OS and files</h2><p>The OS manages apps, files and access to hardware. This is a teaching desktop, not Windows or a real OS installation.</p><p>Challenge: save a note → shut down → power on and sign in → reopen it → delete and restore it.</p>
      <div className="course-desktop"><div className="course-status">{!os.powered ? 'Computer off' : !os.signedIn ? 'OS loaded · Sign-in screen' : 'Virtual desktop'}</div>
        <div className="course-choices"><button onClick={() => act('power')} disabled={os.powered}>Power on</button><button onClick={() => act('sign-in')} disabled={!os.powered || os.signedIn}>Sign in</button><button onClick={() => act('open')} disabled={!os.signedIn}>Open Notes</button><button onClick={() => act('shutdown')} disabled={!os.signedIn}>Shut down</button></div>
        {os.editor && <div className="course-editor"><label>My note<textarea maxLength={500} value={os.draft} onChange={e => setOs(previous => ({ ...previous, draft: e.target.value }))} /></label><button onClick={() => act('save')}>Save note</button><button onClick={() => act('close')}>Close Notes</button><p>Text you type is working data. Use Save to keep it in virtual Files.</p></div>}
        <div className="course-files"><article><h3>Files · virtual storage</h3><p>{os.saved === null ? 'No saved file' : 'My note.txt'}</p><button disabled={!os.signedIn || os.saved === null} onClick={() => act('reopen')}>Open saved note</button><button disabled={!os.signedIn || os.saved === null} onClick={() => act('delete')}>Move note to Recycle Bin</button></article><article><h3>Recycle Bin</h3><p>{os.deleted === null ? 'Empty' : 'My note.txt'}</p><button disabled={!os.signedIn || os.deleted === null} onClick={() => act('restore')}>Restore note</button></article></div>
      </div><output>{osFeedback}</output>{progress.os && <p>✓ OS practice completed</p>}<p>Practice results are saved; the virtual desktop and note reset when you leave this activity. Use your real computer’s file tools only with your teacher’s instructions.</p>
    </section>}
    {tab === 'check' && <section aria-label="Final assessment"><h2>Final knowledge check</h2><p>Your first selected answer is recorded. Read the explanation, then continue. You can start a fresh attempt afterward.</p><p>Question {answerIndex + 1} / 8</p><h3>{question.prompt}</h3><div className="course-choices">{question.options.map(option => <button key={option} disabled={!!answer} aria-pressed={answer === option} onClick={() => update({ finalAnswers: { ...progress.finalAnswers, [question.id]: option } })}>{option}</button>)}</div>
      {answer && <output>{answer === question.answer ? 'Correct. ' : `Review: the answer is ${question.answer}. `}{question.why}</output>}
      <div className="course-choices"><button disabled={answerIndex === 0} onClick={() => setAnswerIndex(answerIndex - 1)}>Previous question</button><button disabled={!answer || answerIndex === FINAL_QUESTIONS.length - 1} onClick={() => setAnswerIndex(answerIndex + 1)}>Next question</button></div>
      {result.complete && <div className="course-result"><h3>{result.correct} / 8 correct · {result.percent}%</h3><p>{result.percent >= 75 ? 'Good progress. Explain your answers to your teacher.' : 'Review the topics below, practise, then try again.'}</p><ul>{FINAL_QUESTIONS.filter(q => progress.finalAnswers[q.id] !== q.answer).map(q => <li key={q.id}>{q.why}</li>)}</ul><button onClick={() => { update({ finalAnswers: {} }); setAnswerIndex(0); }}>Start a fresh attempt</button><button onClick={download}>Download my results</button></div>}
    </section>}
  </main>;
}
