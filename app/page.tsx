'use client';
import { useCallback, useEffect, useState } from 'react';
import { EyeOff } from 'lucide-react';
import { levelPath } from '@/lib/levels';
import { initialState, showScene, type Selection } from '@/lib/explorer-state';
import { lessonById } from '@/lib/lessons';
import { readAddress, type Address } from '@/lib/url-state';
import { useExplorer } from './use-explorer';
import { useLesson } from './use-lesson';
import { useAddress } from './use-address';
import { useNarrow } from './use-narrow';
import Viewer from './viewer';
import PerformanceTip from './performance-tip';
import Topbar from './topbar';
import ScaleNav from './scale-nav';
import SystemsList from './systems-list';
import StageHeading from './stage-heading';
import StageTools from './stage-tools';
import Disassembly from './disassembly';
import SearchDialog from './search-dialog';
import DetailPanel from './detail-panel';
import AboutDialog from './about-dialog';
import ComparisonWorkbench from './comparison-workbench';
import ComputerLab from './computer-lab';
import LaptopLab from './laptop-lab';
import BuildPcLab from './build-pc-lab';
import TaskManagerLab from './task-manager-lab';
import CourseLab from './course-lab';
import LessonPanel from './lesson-panel';
import CoursesDialog from './courses-dialog';

/** Where the address bar says to start, read once. */
function arrival(): Address {
  return readAddress(window.location.search);
}

export default function Home() {
  const [boot] = useState(arrival);
  const explorer = useExplorer(
    boot.kind === 'lesson'
      ? showScene(initialState, lessonById[boot.lesson].steps[boot.step].scene)
      : boot.kind === 'view'
        ? showScene(initialState, boot.scene)
        : initialState,
  );
  const { state, selected, logical, layers, selectConcept, choose, navigate } =
    explorer;
  const lesson = useLesson(
    explorer.showScene,
    boot.kind === 'lesson' ? boot : null,
  );
  const [courseList, setCourseList] = useState(false);
  // On a phone the detail panel and the lesson card would share the bottom of
  // the screen, and nearly every step selects a part. So during a lesson the
  // panel waits until the reader asks for the part it is showing.
  const narrow = useNarrow();
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const detailWaits =
    !!lesson.run && narrow && !!selected && detailFor !== selected.id;
  const shownDetail = detailWaits ? null : selected;
  const [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [about, setAbout] = useState(false),
    [studentMode, setStudentMode] = useState(true),
    // A link to a scale or a lesson opens the explorer; otherwise the school
    // starts in the Computer Lab.
    [mode, setMode] = useState<
      | 'lab'
      | 'laptop'
      | 'assembly'
      | 'explorer'
      | 'comparison'
      | 'task-manager-pc'
      | 'task-manager-laptop'
      | 'course'
    >(boot.kind === 'home' ? 'lab' : 'explorer'),
    // `null` until the viewer has reported for the first time. Zero means the
    // viewer is running and nothing is switched on, which is a different thing
    // to say to the reader, and saying the wrong one was what put "No
    // structures visible" on screen for the whole of a cold load.
    [count, setCount] = useState<number | null>(null);

  /** Jump to a component, closing the palette if that is where it came from. */
  const selectResult = useCallback(
    (id: string) => {
      selectConcept(id);
      setSearch(false);
      setQuery('');
    },
    [selectConcept],
  );

  // Back and Forward land on whatever the address now says.
  const follow = useCallback(
    (address: Address) => {
      if (address.kind === 'lesson')
        return lesson.begin(address.lesson, address.step);
      lesson.exit();
      if (address.kind === 'view') explorer.showScene(address.scene);
      else explorer.reset();
    },
    [explorer, lesson],
  );
  useAddress({
    state,
    run: lesson.run,
    playing: explorer.playing,
    onAddress: follow,
  });

  /** Open a lesson from the course list or the rail. */
  const startLesson = useCallback(
    (id: string) => {
      setCourseList(false);
      setMode('explorer');
      lesson.begin(id);
    },
    [lesson],
  );

  // While a lesson asks "find the part", a click on the stage is an answer:
  // it selects what was clicked, so the reader sees what they hit, and never
  // dives into it.
  const pickOnStage = useCallback(
    (selection: Selection | null, intent: 'open' | 'inspect') => {
      if (!lesson.awaitingPick) return choose(selection, intent);
      choose(selection, 'inspect');
      if (selection) lesson.pick(selection.concept);
    },
    [choose, lesson],
  );

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      // A key pressed while nothing is focused reports the document, not an
      // element, and on some soft keyboards the target is the window itself.
      // Reaching for closest() on either throws out of the handler.
      const el = event.target;
      if (
        el instanceof Element &&
        el.closest('input,textarea,[contenteditable=true]')
      )
        return;
      if (search || about || courseList || mode !== 'explorer') return;
      if (event.key === '/') {
        event.preventDefault();
        setSearch(true);
      }
      if (event.key === 'Escape') choose(null);
      if (event.key === 'Backspace') {
        const currentPath = levelPath(state.level);
        if (currentPath.length > 1) {
          event.preventDefault();
          navigate(currentPath[currentPath.length - 2]);
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [about, choose, courseList, mode, navigate, search, state.level]);

  if (mode === 'course')
    return <CourseLab onBack={() => setMode('lab')} onActivity={setMode} />;
  if (mode === 'lab')
    return (
      <ComputerLab
        onOpenCourse={() => setMode('course')}
        onOpenPC={() => setMode('explorer')}
        onOpenLaptop={() => setMode('laptop')}
        onOpenAssembly={() => setMode('assembly')}
        onOpenTaskManager={() => setMode('task-manager-pc')}
      />
    );
  if (mode === 'laptop')
    return (
      <LaptopLab
        onBack={() => setMode('lab')}
        onOpenTaskManager={() => setMode('task-manager-laptop')}
      />
    );
  if (mode === 'task-manager-pc' || mode === 'task-manager-laptop')
    return (
      <TaskManagerLab
        device={mode === 'task-manager-laptop' ? 'laptop' : 'pc'}
        onBack={() =>
          setMode(mode === 'task-manager-laptop' ? 'laptop' : 'lab')
        }
      />
    );
  if (mode === 'assembly') return <BuildPcLab onBack={() => setMode('lab')} />;
  if (mode === 'comparison')
    return (
      <ComparisonWorkbench
        onExit={() => {
          setMode('explorer');
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLButtonElement>('.compare-button')
              ?.focus(),
          );
        }}
      />
    );

  return (
    <main
      className={
        'workbench' +
        (shownDetail ? ' has-selection' : '') +
        (logical ? ' logical' : '') +
        (lesson.run ? ' in-lesson' : '')
      }
    >
      <Topbar
        layers={layers}
        studentMode={studentMode}
        onOpenLab={() => {
          lesson.exit();
          setMode('lab');
        }}
        onToggleStudentMode={() => setStudentMode((value) => !value)}
        onReset={() => {
          lesson.exit();
          explorer.reset();
        }}
        onToggleLayers={() => explorer.setLayers(!layers)}
        onSearch={() => setSearch(true)}
        onAbout={() => setAbout(true)}
        onLessons={() => setCourseList(true)}
      />
      <PerformanceTip ready={count !== null && count > 0} />
      {layers && (
        // Without this the drawer floats over a live 3-D view: a tap meant to
        // dismiss it lands in the scene and selects whatever was behind it.
        <button
          className="drawer-scrim"
          aria-label="Close systems"
          onClick={() => explorer.setLayers(false)}
        />
      )}
      <aside
        className={'explorer' + (layers ? ' mobile-open' : '')}
        aria-label="System visibility"
      >
        <ScaleNav
          level={state.level}
          shownMenu={explorer.shownMenu}
          shownSubmenu={explorer.shownSubmenu}
          onOpenMenu={explorer.showMenu}
          onOpenSubmenu={explorer.showSubmenu}
          onNavigate={navigate}
          onCompare={() => {
            lesson.exit();
            setMode('comparison');
          }}
          onLearn={() => setCourseList(true)}
          onClose={() => explorer.setLayers(false)}
        />
        <SystemsList
          visible={state.visible}
          hidden={state.hidden}
          onToggleCategory={explorer.toggleCategory}
          onToggleAll={explorer.toggleAllCategories}
          onSetConceptVisible={explorer.setConceptVisible}
          onSelectConcept={selectResult}
        />
      </aside>
      <LessonPanel
        lesson={lesson}
        waitingPart={detailWaits ? selected : null}
        onShowPart={(id) => setDetailFor(id)}
        onOpenCourses={() => setCourseList(true)}
      />
      <StageHeading
        level={state.level}
        explode={state.explode}
        logical={logical}
        selected={selected}
        count={count}
        onNavigate={navigate}
      />
      <Viewer
        state={state}
        onSelect={pickOnStage}
        onCount={setCount}
        onDived={explorer.arrive}
      />
      {count === null && (
        <div className="empty-scene loading">
          <h3>Loading components for you…</h3>
        </div>
      )}
      {count === 0 && (
        <div className="empty-scene">
          <EyeOff size={27} />
          <h3>No structures visible</h3>
          <button onClick={explorer.showEverything}>Show all systems</button>
        </div>
      )}
      <StageTools
        view={state.view}
        level={state.level}
        explode={state.explode}
        logical={logical}
        airflow={state.airflow}
        hidden={state.hidden}
        hiddenMenuOpen={explorer.hiddenMenuOpen}
        onToggleHiddenMenu={() => explorer.setHiddenMenuOpen((open) => !open)}
        onSetView={explorer.setView}
        onToggleAirflow={explorer.toggleAirflow}
        onUnhide={explorer.unhide}
        onClearHidden={explorer.clearHidden}
      />
      <Disassembly
        level={state.level}
        explode={state.explode}
        logical={logical}
        playing={explorer.playing}
        onToggleAuto={explorer.toggleAuto}
        onSetExplode={explorer.setExplode}
        onReset={lesson.run ? lesson.replay : explorer.reset}
      />
      <SearchDialog
        open={search}
        onOpenChange={setSearch}
        query={query}
        onQueryChange={setQuery}
        onSelect={selectResult}
      />
      <DetailPanel
        selected={shownDetail}
        selection={state.selection}
        level={state.level}
        isolated={state.isolated}
        studentMode={studentMode}
        onClose={() => choose(null)}
        onSelectConcept={selectResult}
        onDive={explorer.dive}
        onIsolate={explorer.toggleIsolate}
        onFocus={explorer.refocus}
        onHide={explorer.hide}
      />
      <AboutDialog open={about} onOpenChange={setAbout} />
      <CoursesDialog
        open={courseList}
        onOpenChange={setCourseList}
        progress={lesson.progress}
        current={lesson.run && !lesson.run.complete ? lesson.run.lesson : null}
        onStart={startLesson}
      />
    </main>
  );
}
