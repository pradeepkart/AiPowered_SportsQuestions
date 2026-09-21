import test from 'node:test';
import assert from 'node:assert/strict';
import { inferRequest, validatePairs } from './request.js';

test('detects the requested sport and questions-only mode', () => {
  assert.deepEqual(inferRequest('Give me 10 football questions', 'cricket', 'both'), { sport: 'football', mode: 'questions' });
});
test('answers-only hides questions and both restores both fields', () => {
  assert.equal(inferRequest('Tennis answers only', 'cricket', 'both').mode, 'answers');
  assert.equal(inferRequest('cricket questions and answers', 'cricket', 'questions').mode, 'both');
  assert.equal(inferRequest('give me both', 'cricket', 'questions').mode, 'both');
});
test('uses selected controls when the prompt does not specify them', () => {
  assert.deepEqual(inferRequest('Explain the scoring rules', 'badminton', 'answers'), { sport: 'badminton', mode: 'answers' });
});
test('does not silently route multiple sports to one endpoint', () => {
  assert.throws(() => inferRequest('tennis and football', 'cricket', 'both'), /one sport/);
});
test('rejects malformed responses and limits rendered pairs to ten', () => {
  for (const data of [null, [], {}, [{ question: 'Q' }], [{ question: '', answer: 'A' }]]) assert.throws(() => validatePairs(data));
  assert.equal(validatePairs(Array.from({ length: 12 }, () => ({ question: 'Q', answer: 'A' }))).length, 10);
});
