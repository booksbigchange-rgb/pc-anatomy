'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { courses } from '@/lib/lessons';
import type { Progress } from '@/lib/progress';
import CourseCard from './course-card';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: Progress;
  /** The lesson being taken, if any, so it can be marked. */
  current: string | null;
  onStart: (lesson: string) => void;
};

export default function CoursesDialog({
  open,
  onOpenChange,
  progress,
  current,
  onStart,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="courses-dialog">
        <DialogTitle>Lessons</DialogTitle>
        <DialogDescription>
          Short, hands-on lessons that use the 3D model. Your progress is saved
          in this browser. No account needed.
        </DialogDescription>
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={progress}
            current={current}
            onStart={onStart}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
}
