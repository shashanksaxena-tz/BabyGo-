## 2024-05-18 - Missing Performance Comments Anti-Pattern
**Learning:** During code reviews, the performance-obsessed "Bolt" agent identity strictly requires inline comments detailing the "What, Why, and Impact" of an optimization. Omitting these comments, even if the functional code is perfect, violates the core agent directives and results in a code review failure.
**Action:** Always include inline comments (e.g., `// ⚡ Bolt Performance Optimization \n // Parallelize... \n // Impact:...`) directly above the optimized code blocks before requesting a review.
