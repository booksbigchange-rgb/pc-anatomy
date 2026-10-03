'use client';
import AcademyLogo from './academy-logo';
import { readProgress, saveProgress } from './student-progress';

import { useEffect, useReducer, useState } from 'react';
import {
  ArrowLeft,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Pause,
  Play,
  Power,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import {
  APPS,
  MISSIONS,
  PROFILES,
  endProcess,
  missionSolved,
  sample,
  startProcesses,
  type AppId,
  type Device,
  type Resource,
  type Snapshot,
} from './task-manager-model.ts';

const RESOURCES = {
  cpu: {
    label: 'CPU',
    name: 'The worker',
    icon: Cpu,
    color: '#18885d',
    description:
      'The CPU follows instructions. A busy app needs more CPU time.',
  },
  memory: {
    label: 'RAM',
    name: 'The work desk',
    icon: MemoryStick,
    color: '#8450c5',
    description:
      'RAM holds work for open apps. Close an app to make room. Saved files stay on the SSD.',
  },
  disk: {
    label: 'Disk',
    name: 'The file store',
    icon: HardDrive,
    color: '#ca7218',
    description:
      'This graph shows how busy the SSD is reading and writing. It does not show how full it is.',
  },
  network: {
    label: 'Network',
    name: 'The connection',
    icon: Network,
    color: '#2278c3',
    description:
      'The network moves data to and from the internet. Video lessons and downloads share it.',
  },
};
type State = {
  device: Device;
  powered: boolean;
  processes: ReturnType<typeof startProcesses>;
  tick: number;
  history: Snapshot[];
  mission: number | null;
  completed: Resource[];
  feedback: string;
  comparison: { label: string; before: Snapshot; after: Snapshot } | null;
};
type Action =
  | { type: 'tick' | 'power' | 'reset' | 'check' }
  | { type: 'open'; app: AppId }
  | { type: 'end'; id: number }
  | { type: 'mission'; index: number }
  | { type: 'device'; device: Device };
function initial(device: Device): State {
  return {
    device,
    powered: true,
    processes: startProcesses(),
    tick: 0,
    history: [],
    mission: null,
    completed: readProgress().taskManager,
    feedback: '',
    comparison: null,
  };
}
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick':
      return state.powered
        ? {
            ...state,
            tick: state.tick + 1,
            history: [
              ...state.history,
              sample(state.processes, state.device, state.tick + 1, true),
            ].slice(-40),
          }
        : state;
    case 'power':
      return {
        ...state,
        powered: !state.powered,
        processes: startProcesses(),
        history: [],
        tick: 0,
        mission: null,
        feedback: '',
        comparison: null,
      };
    case 'reset':
      return { ...initial(state.device), completed: [] };
    case 'device':
      return {
        ...state,
        device: action.device,
        history: [],
        mission: null,
        feedback: '',
        comparison: null,
      };
    case 'open': {
      if (
        !state.powered ||
        action.app === 'system' ||
        state.processes.filter((p) => p.app === action.app).length >=
          (action.app === 'browser' ? 6 : 1)
      )
        return state;
      const id = Math.max(0, ...state.processes.map((p) => p.id)) + 1;
      return {
        ...state,
        processes: [...state.processes, { id, app: action.app }],
        comparison: { label: `Opened ${APPS[action.app].name}`, before: sample(state.processes, state.device, state.tick, true), after: sample([...state.processes, { id, app: action.app }], state.device, state.tick, true) },
        feedback: APPS[action.app].description,
      };
    }
    case 'end':
      return {
        ...state,
        processes: endProcess(state.processes, action.id),
        comparison: { label: 'After ending the selected task', before: sample(state.processes, state.device, state.tick, state.powered), after: sample(endProcess(state.processes, action.id), state.device, state.tick, state.powered) },
        feedback: state.processes.find(process => process.id === action.id)?.app === 'system' ? 'System stays protected.' : 'App ended. Compare the readings above: its CPU work stopped and its RAM was released. Saved files stay on the SSD.',
      };
    case 'mission':
      return {
        ...state,
        device: 'laptop',
        powered: true,
        processes: startProcesses(MISSIONS[action.index].apps),
        mission: action.index,
        tick: 0,
        history: [],
        feedback: '',
        comparison: null,
      };
    case 'check': {
      if (state.mission === null) return state;
      const mission = MISSIONS[state.mission];
      const solved = missionSolved(
        mission,
        state.processes,
        sample(state.processes, state.device, state.tick, state.powered),
        state.powered,
      );
      return {
        ...state,
        completed: solved
          ? [...new Set([...state.completed, mission.id])]
          : state.completed,
        feedback: solved
          ? `Solved! ${mission.explanation}`
          : `Keep trying. ${mission.task}`,
      };
    }
  }
}
function Chart({
  history,
  resource,
  current,
}: {
  history: Snapshot[];
  resource: Resource;
  current: number;
}) {
  const values = [...history.map((point) => point[resource]), current].slice(
    -40,
  );
  const points = values
    .map(
      (value, index) =>
        `${600 - ((values.length - 1 - index) * 600) / 39},${160 - value * 1.5}`,
    )
    .join(' ');
  return (
    <svg
      className="tm-chart"
      viewBox="0 0 600 175"
      // An inline SVG needs an image role; replacing it with img removes its chart geometry.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="img"
      aria-label={`${RESOURCES[resource].label} activity over the last ${values.length} samples. Current value ${Math.round(current)} percent.`}
      preserveAspectRatio="none"
    >
      {[10, 47.5, 85, 122.5, 160].map((y) => (
        <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#dce7e3" />
      ))}
      {[0, 100, 200, 300, 400, 500, 600].map((x) => (
        <line key={x} x1={x} x2={x} y1="10" y2="160" stroke="#e8eeeb" />
      ))}
      <polygon
        points={`${600 - ((values.length - 1) * 600) / 39},160 ${points} 600,160`}
        fill={RESOURCES[resource].color}
        opacity="0.1"
      />
      <polyline
        points={points}
        fill="none"
        stroke={RESOURCES[resource].color}
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="600"
        cy={160 - current * 1.5}
        r="4"
        fill={RESOURCES[resource].color}
      />
    </svg>
  );
}
export default function TaskManagerLab({
  onBack,
  device,
}: {
  onBack: () => void;
  device: Device;
}) {
  const [state, dispatch] = useReducer(reducer, device, initial);
  const [resource, setResource] = useState<Resource>('cpu');
  const [sort, setSort] = useState<Resource>('cpu');
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState('');
  const [compactSidebar, setCompactSidebar] = useState(true);
  useEffect(() => { saveProgress({ taskManager: state.completed }); }, [state.completed]);
  useEffect(() => {
    if (!state.powered || paused) return;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.powered, paused]);
  const current = sample(
    state.processes,
    state.device,
    state.tick,
    state.powered,
  );
  const profile = PROFILES[state.device];
  const selected = RESOURCES[resource];
  const mission = state.mission === null ? null : MISSIONS[state.mission];
  const rows = current.rows.filter((row) => APPS[row.app].name.toLowerCase().includes(search.trim().toLowerCase())).sort(
    (a, b) => b[sort] - a[sort] || a.id - b.id,
  );
  return (
    <main className="tm-lab">
      <header className="tm-header">
        <button className="tm-back" onClick={onBack}>
          <ArrowLeft size={17} /> Back to{' '}
          {device === 'laptop' ? 'Laptop Lab' : 'Computer Lab'}
        </button>
        <div className="tm-brand">
          <AcademyLogo />
          <div>
            <strong>BigChange Academy</strong>
            <small>COMPUTER LAB · TASK MANAGER</small>
          </div>
        </div>
        <span className="tm-simulation">Classroom simulation</span>
      </header>
      <div className="tm-layout">
        <aside className={'tm-sidebar' + (compactSidebar ? ' compact' : '')}>
          <button className="tm-mobile-challenges" aria-expanded={!compactSidebar} onClick={() => setCompactSidebar(!compactSidebar)}>{compactSidebar ? 'Show challenges & XP' : 'Hide challenges & XP'}</button>
          <p className="tm-eyebrow">NEW CHAPTER</p>
          <h1>
            What is your{' '}
            <br />
            computer doing?
          </h1>
          <p>Open an app. Watch the graphs. Find what makes a computer busy.</p>
          <label className="tm-device">
            Virtual computer
            <select
              value={state.device}
              onChange={(event) =>
                dispatch({
                  type: 'device',
                  device: event.target.value as Device,
                })
              }
            >
              <option value="laptop">Laptop · 8 GB RAM</option>
              <option value="pc">PC · 16 GB RAM</option>
            </select>
          </label>
          <button
            className={'tm-power' + (state.powered ? ' on' : '')}
            onClick={() => dispatch({ type: 'power' })}
          >
            <Power size={17} />{' '}
            {state.powered
              ? 'Shut down virtual computer'
              : 'Turn on virtual computer'}
          </button>
          <div className="tm-missions">
            <p className="tm-eyebrow">TRY A CHALLENGE</p>
            {MISSIONS.map((item, index) => (
              <button
                key={item.id}
                className={state.mission === index ? 'active' : ''}
                onClick={() => {
                  dispatch({ type: 'mission', index });
                  setSearch('');
                  setPaused(false);
                  setResource(item.id);
                  setSort(item.id);
                }}
              >
                <span>
                  {state.completed.includes(item.id) ? '✓' : `0${index + 1}`}
                </span>
                {item.title}
              </button>
            ))}
          </div>
          <div className="tm-score">
            <Trophy size={22} />
            <div>
              <strong>{state.completed.length * 25} XP</strong>
              <span>{state.completed.length} of 4 challenges solved</span>
            </div>
          </div>
          {state.completed.length === 4 && (
            <p className="tm-badge">Performance Detective unlocked!</p>
          )}
          <button
            className="tm-reset"
            onClick={() => {
              dispatch({ type: 'reset' });
              setSearch('');
              setPaused(false);
            }}
          >
            <RotateCcw size={14} /> Reset chapter & XP
          </button>
          <p className="tm-note">
            These are learning examples, not readings from your real device.
            Completed challenges and XP are saved on this browser. Reset clears this chapter’s XP.
          </p>
        </aside>
        <section className="tm-main" aria-label="Task Manager simulation">
          <div className="tm-heading">
            <div>
              <p className="tm-eyebrow">{profile.name.toUpperCase()}</p>
              <h2>Task Manager</h2>
            </div>
            <div className="tm-monitor-controls">
              <span className={'tm-live' + (state.powered ? ' on' : '')}>
                {state.powered ? paused ? '○ Graphs paused' : '● Running simulation' : '○ Powered off'}
              </span>
              <button className="tm-pause" disabled={!state.powered} aria-pressed={paused} onClick={() => setPaused(!paused)}>
                {paused ? <Play size={14} /> : <Pause size={14} />}
                {paused ? 'Resume graphs' : 'Pause graphs'}
              </button>
            </div>
          </div>
          <div className="tm-resource-grid">
            {(Object.keys(RESOURCES) as Resource[]).map((key) => {
              const item = RESOURCES[key],
                Icon = item.icon;
              return (
                <button
                  key={key}
                  className={
                    'tm-resource' + (resource === key ? ' active' : '')
                  }
                  style={
                    { '--resource-color': item.color } as React.CSSProperties
                  }
                  aria-pressed={resource === key}
                  onClick={() => {
                    setResource(key);
                    setSort(key);
                  }}
                >
                  <span>
                    <Icon size={18} />
                    {item.label}
                  </span>
                  <strong>
                    {Math.round(current[key])}
                    <small>%</small>
                  </strong>
                  <div className="tm-meter">
                    <i style={{ width: `${current[key]}%` }} />
                  </div>
                  <Chart history={state.history} resource={key} current={current[key]} />
                  <small>
                    {key === 'memory'
                      ? `${(current.memoryMB / 1024).toFixed(1)} / ${profile.memory / 1024} GB needed`
                      : key === 'network'
                        ? `${current.networkMbps.toFixed(1)} / ${profile.network} Mbps`
                        : 'Activity'}
                  </small>
                </button>
              );
            })}
          </div>
          <section
            className="tm-graph-card"
            aria-label={`${selected.label} performance`}
          >
            <div className="tm-card-title">
              <div>
                <h3>
                  {selected.label} <span>· {selected.name}</span>
                </h3>
                <p>{selected.description}</p>
              </div>
              <strong style={{ color: selected.color }}>
                {Math.round(current[resource])}%
              </strong>
            </div>
            <div className="tm-graph-labels">
              <span>
                {resource === 'memory' ? '100% of RAM needed' : '100% busy'}
              </span>
              <span>{!state.powered ? 'Computer off' : paused ? 'Paused · app changes still update readings' : 'Updates every second'}</span>
            </div>
            <Chart
              history={state.history}
              resource={resource}
              current={current[resource]}
            />
            <div className="tm-graph-labels">
              <span>Earlier</span>
              <span>Now</span>
            </div>
          </section>
          {current.memoryMB > profile.memory && (
            <p className="tm-pressure">
              RAM is crowded: apps need more memory than this virtual computer
              has. Close some tabs and compare the graph.
            </p>
          )}
          {mission && (
            <section className="tm-challenge">
              <span className="tm-challenge-number">
                {(state.mission ?? 0) + 1}
              </span>
              <div>
                <p className="tm-eyebrow">CHALLENGE · 25 XP · 8 GB LAPTOP</p>
                <h3>{mission.title}</h3>
                <p>
                  {mission.symptom} {mission.task}
                </p>
                <details>
                  <summary>Need a hint?</summary>
                  <p>{mission.hint}</p>
                </details>
              </div>
              <button
                onClick={() => dispatch({ type: 'check' })}
                disabled={!state.powered}
              >
                Check my fix
              </button>
            </section>
          )}
          <output
            className={
              'tm-feedback' +
              (state.feedback.startsWith('Solved!') ? ' success' : '')
            }
          >
            {state.feedback}
          </output>
          {state.comparison && <section className="tm-comparison" aria-label="Effect of your last action">
            <h3>{state.comparison.label}</h3><p>Compare the same simulated moment, before and after your action.</p>
            <table><thead><tr><th>Resource</th><th>Before</th><th>After</th></tr></thead><tbody>{(Object.keys(RESOURCES) as Resource[]).map(key => <tr key={key}><th>{RESOURCES[key].label}</th><td>{Math.round(state.comparison!.before[key])}%</td><td>{Math.round(state.comparison!.after[key])}%</td></tr>)}</tbody></table>
            <p>RAM is working space. Disk activity is reading and writing, not how much storage is full.</p>
          </section>}
          <section className="tm-apps" aria-label="Open a virtual app">
            <div className="tm-card-title">
              <h3>
                <span>Open an app</span>
              </h3>
              <span>Choose a job for your computer</span>
            </div>
            <div className="tm-app-grid">
              {(Object.entries(APPS) as [AppId, (typeof APPS)[AppId]][])
                .filter(([id]) => id !== 'system')
                .map(([id, app]) => {
                  const count = state.processes.filter(
                    (p) => p.app === id,
                  ).length;
                  return (
                    <button
                      key={id}
                      disabled={
                        !state.powered || count >= (id === 'browser' ? 6 : 1)
                      }
                      onClick={() => dispatch({ type: 'open', app: id })}
                    >
                      <span className="tm-app-icon" aria-hidden="true">
                        {app.icon}
                      </span>
                      <strong>{app.name}</strong>
                      <small>{app.description}</small>
                      <span className="tm-open">
                        <Play size={12} />
                        {count
                          ? `${count} running${id === 'browser' && count < 6 ? ' · Add tabs' : ''}`
                          : 'Open'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </section>
          <section className="tm-processes">
            <div className="tm-card-title">
              <h3>
                <span>Find the busy process</span>
              </h3>
              <span>Click a column to sort highest first</span>
            </div>
            <label className="tm-process-search">
              Find a process
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type an app name" />
              <span>{rows.length} of {current.rows.length} processes</span>
            </label>
            <div className="tm-table-wrap">
              <table>
                <caption>
                  Running processes — simulated activity. RAM shows memory
                  needed by each app.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Process</th>
                    {(['cpu', 'memory', 'disk', 'network'] as Resource[]).map(
                      (key) => (
                        <th
                          scope="col"
                          key={key}
                          aria-sort={sort === key ? 'descending' : 'none'}
                        >
                          <button onClick={() => setSort(key)}>
                            {key === 'memory'
                              ? 'RAM needed'
                              : RESOURCES[key].label}{' '}
                            {sort === key ? '↓' : '↕'}
                          </button>
                        </th>
                      ),
                    )}
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">
                        <span aria-hidden="true">{APPS[row.app].icon}</span>{' '}
                        {APPS[row.app].name}
                        {row.app === 'browser' && (
                          <small> · group {row.id}</small>
                        )}
                      </th>
                      <td style={{ background: `rgba(24,136,93,${Math.min(.38, row.cpu / 100 * .38)})` }}>{row.cpu.toFixed(1)}%</td>
                      <td style={{ background: `rgba(132,80,197,${Math.min(.38, row.memory / profile.memory * .65)})` }}>{row.memory.toLocaleString()} MB</td>
                      <td style={{ background: `rgba(202,114,24,${Math.min(.38, row.disk / 100 * .38)})` }}>{row.disk.toFixed(1)}%</td>
                      <td style={{ background: `rgba(34,120,195,${Math.min(.38, row.network / profile.network * .38)})` }}>{row.network.toFixed(1)} Mbps</td>
                      <td>
                        <button
                          disabled={row.app === 'system'}
                          aria-label={`End ${APPS[row.app].name}${row.app === 'browser' ? ` group ${row.id}` : ''}`}
                          onClick={() => dispatch({ type: 'end', id: row.id })}
                        >
                          {row.app === 'system' ? 'Protected' : 'End task'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!state.powered && (
                <p className="tm-off">
                  The virtual computer is off. Turn it on to start exploring.
                </p>
              )}
              {state.powered && rows.length === 0 && <p className="tm-off">No matching processes. Clear the search to show all apps.</p>}
            </div>
            <p className="tm-table-note">
              A process is a running program or job. End only the virtual apps
              you opened. The System process stays protected.
            </p>
          </section>
        </section>
      </div>
      <footer className="tm-footer">
        Teacher Hermon Tesfay <span>Build → Observe → Fix → Test</span> Rocky |
        AI Companion
      </footer>
    </main>
  );
}
