/**
 * Returns a set of predefined phase templates based on the learning goal.
 * This provides the structural backbone for the roadmap.
 */
exports.getPhaseTemplates = (goal) => {
  const normalizedGoal = goal.toLowerCase();

  // Very rudimentary keyword matching to pick a template,
  // could be expanded to use NLP or more robust categorization.
  if (normalizedGoal.includes('code') || normalizedGoal.includes('program') || normalizedGoal.includes('developer') || normalizedGoal.includes('software')) {
    return [
      { title: 'Foundations & Syntax', order: 1 },
      { title: 'Core Concepts & Paradigms', order: 2 },
      { title: 'Building Small Projects', order: 3 },
      { title: 'Advanced Topics & Best Practices', order: 4 },
      { title: 'Capstone Project & Portfolio', order: 5 },
    ];
  }

  if (normalizedGoal.includes('language') || normalizedGoal.includes('speak')) {
    return [
      { title: 'Basic Vocabulary & Pronunciation', order: 1 },
      { title: 'Essential Grammar & Simple Sentences', order: 2 },
      { title: 'Everyday Conversations & Listening', order: 3 },
      { title: 'Reading & Writing Practice', order: 4 },
      { title: 'Fluency & Immersion', order: 5 },
    ];
  }

  // Default fallback template
  return [
    { title: 'Introduction & Basics', order: 1 },
    { title: 'Core Fundamentals', order: 2 },
    { title: 'Practical Application', order: 3 },
    { title: 'Advanced Mastery', order: 4 },
  ];
};
