'use client';
import { Suspense, lazy, useState } from 'react';
import ComputerLab from './computer-lab';
import SchoolOpening, { needsSchoolOpening } from './school-opening';

// The Computer Lab opens first; the other labs load only when a student opens them.
const LaptopLab = lazy(() => import('./laptop-lab'));
const BuildPcLab = lazy(() => import('./build-pc-lab'));
const InsidePc = lazy(() => import('./assembly-lab'));
const TaskManagerLab = lazy(() => import('./task-manager-lab'));
const CourseLab = lazy(() => import('./course-lab'));
const loading = <output className="lab-loading">Opening the lab…</output>;

export default function Home() {
  const [opening, setOpening] = useState(needsSchoolOpening);
  const [mode, setMode] = useState<'lab' | 'laptop' | 'assembly' | 'inside' | 'task-manager-pc' | 'task-manager-laptop' | 'course'>('lab');

  if (opening) return <SchoolOpening onEnter={() => setOpening(false)} />;
  if (mode === 'course') return <Suspense fallback={loading}><CourseLab onBack={() => setMode('lab')} onActivity={setMode} /></Suspense>;
  if (mode === 'laptop') return <Suspense fallback={loading}><LaptopLab onBack={() => setMode('lab')} onOpenTaskManager={() => setMode('task-manager-laptop')} /></Suspense>;
  if (mode === 'task-manager-pc' || mode === 'task-manager-laptop') return <Suspense fallback={loading}><TaskManagerLab device={mode === 'task-manager-laptop' ? 'laptop' : 'pc'} onBack={() => setMode(mode === 'task-manager-laptop' ? 'laptop' : 'lab')} /></Suspense>;
  if (mode === 'assembly') return <Suspense fallback={loading}><BuildPcLab onBack={() => setMode('lab')} /></Suspense>;
  // Explore inside the PC: our OptiPlex reference model with its take-apart timeline.
  if (mode === 'inside') return <Suspense fallback={loading}><InsidePc onBack={() => setMode('lab')} backLabel="Computer Lab" /></Suspense>;
  return <ComputerLab onOpenCourse={() => setMode('course')} onOpenPC={() => setMode('inside')} onOpenLaptop={() => setMode('laptop')} onOpenAssembly={() => setMode('assembly')} onOpenTaskManager={() => setMode('task-manager-pc')} />;
}
