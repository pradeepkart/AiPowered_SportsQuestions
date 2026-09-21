export const sports = [
  { id: 'cricket', name: 'Cricket', icon: '🏏', topic: 'The rules of cricket' },
  { id: 'football', name: 'Football', icon: '⚽', topic: 'Football fundamentals' },
  { id: 'tennis', name: 'Tennis', icon: '🎾', topic: 'Tennis scoring explained' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', topic: 'Badminton for beginners' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', topic: 'Volleyball rules and positions' },
];

export function inferRequest(text, selectedSport, selectedMode) {
  const mentioned = sports.filter(sport => new RegExp(`\\b${sport.id}\\b`, 'i').test(text));
  if (mentioned.length > 1) throw new Error('Choose one sport at a time so your set stays focused.');
  const questions = /\bquestions?\b/i.test(text);
  const answers = /\banswers?\b/i.test(text);
  const mode = /\bboth\b/i.test(text) || (questions && answers) ? 'both' : answers ? 'answers' : questions ? 'questions' : selectedMode;
  return { sport: mentioned[0]?.id ?? selectedSport, mode };
}

export function validatePairs(data) {
  if (!Array.isArray(data) || data.length === 0 || data.some(pair =>
    !pair || typeof pair.question !== 'string' || !pair.question.trim() ||
    typeof pair.answer !== 'string' || !pair.answer.trim())) {
    throw new Error('The generator returned an incomplete set. Please try again.');
  }
  return data.slice(0, 10);
}
