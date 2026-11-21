import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLabId, labIds, subjects } from '../lib/catalogue.ts';
import { levels } from '../lib/levels.ts';
import { courseById, courses } from '../lib/lessons/index.ts';

const exhibits = subjects.flatMap((s) => s.exhibits);

await test('subjects and exhibits have unique, URL-safe ids and complete text', () => {
  const slug = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  assert.equal(new Set(subjects.map((s) => s.id)).size, subjects.length);
  assert.equal(new Set(exhibits.map((e) => e.id)).size, exhibits.length);
  for (const subject of subjects) {
    assert.match(subject.id, slug);
    assert.ok(subject.title && subject.summary, subject.id);
    assert.ok(subject.exhibits.length > 0, subject.id);
  }
  for (const exhibit of exhibits) {
    assert.match(exhibit.id, slug);
    assert.ok(exhibit.title && exhibit.summary, exhibit.id);
  }
});

await test('every exhibit opens a real scale or lab', () => {
  for (const { id, open } of exhibits) {
    if (open.kind === 'scale') assert.ok(Object.hasOwn(levels, open.level), id);
    else assert.ok(isLabId(open.lab), id);
  }
  // Every lab is reachable from the School home.
  for (const lab of labIds)
    assert.ok(
      exhibits.some((e) => e.open.kind === 'lab' && e.open.lab === lab),
      `lab ${lab} has no exhibit`,
    );
});

await test('every course belongs to exactly one subject', () => {
  const listed = subjects.flatMap((s) => s.courses);
  for (const id of listed) assert.ok(courseById[id], `unknown course ${id}`);
  for (const course of courses)
    assert.equal(
      listed.filter((id) => id === course.id).length,
      1,
      `${course.id} must appear in one subject`,
    );
});
