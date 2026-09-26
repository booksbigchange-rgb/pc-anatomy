'use client';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { sources } from '@/lib/manifest';
import {
  GUIDE,
  GUIDE_ACCELERATION,
  REPOSITORY,
  UPSTREAM_REPOSITORY,
} from './links';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="about-dialog">
        <DialogTitle>Big Change PC Atlas</DialogTitle>
        <DialogDescription>
          An interactive 3D computer-hardware learning experience adapted for
          Big Change students from the MIT-licensed PC Anatomy project.
        </DialogDescription>
        <p>
          Start with an assembled ATX tower, take it apart, and keep going: into
          the motherboard, graphics card, processors, cooling, storage and the
          logical architecture inside modern chips. Students can inspect,
          isolate, focus, search and move between scales to understand how the
          parts of a computer work together.
        </p>
        <h3>Two kinds of model.</h3>
        <p>
          <strong>Hardware</strong> is original, approximate mechanical
          geometry. Standardized dimensions follow published form factors where
          available, while representative parts explain construction and
          relationships rather than reproducing a particular bill of materials.
        </p>
        <p>
          <strong>Silicon</strong> shows documented logical architecture rather
          than transistor-level physical layouts. These diagrams are educational
          models of published architecture, not semiconductor mask maps.
        </p>
        <h3>Research, source & credits</h3>
        <a className="about-source" href={GUIDE_ACCELERATION}>
          Browser hardware acceleration setup <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE}>
          PC components: an illustrated beginner’s guide
          <ArrowUpRight size={15} />
        </a>
        {Object.entries(sources)
          .slice(0, 2)
          .map(([id, s]) => (
            <a
              className="about-source"
              key={id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {s.name}
              <ArrowUpRight size={15} />
            </a>
          ))}
        <a
          className="about-source"
          href="https://github.com/FrameworkComputer/Framework-Laptop-13"
          target="_blank"
          rel="noreferrer"
        >
          Framework Laptop 13 CAD · Framework Computer · CC BY 4.0
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href="https://github.com/KiCad/kicad-packages3D"
          target="_blank"
          rel="noreferrer"
        >
          KiCad 3D component library · CC BY-SA 4.0 + library exception
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={UPSTREAM_REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          Original PC Anatomy project · Yoseph
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href="https://github.com/ashemag/human-atlas"
          target="_blank"
          rel="noreferrer"
        >
          Interaction inspiration · Human Atlas
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          Big Change fork source code
          <ArrowUpRight size={15} />
        </a>
        <p className="about-foot">
          Big Change learning edition. Upstream PC Anatomy remains credited under
          its MIT License. Framework Laptop 13 CAD is converted and optimized
          under CC BY 4.0; its inclusion does not imply endorsement by Framework
          Computer. Selected laptop connector geometry comes from the KiCad
          3D component library under CC BY-SA 4.0 with KiCad's library
          exception. No affiliation with NVIDIA, AMD or Intel.
        </p>
      </DialogContent>
    </Dialog>
  );
}
