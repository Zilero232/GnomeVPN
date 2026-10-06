import type { NodeConfigIssues } from './nodes-config.types';

export const duplicatesOf = (values: string[]): string[] => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

export const formatIssues = (issues: NodeConfigIssues) =>
  issues
    .map((issue) => {
      const [index, ...field] = issue.path;

      return typeof index === 'number' ? `index ${index}: ${field.join('.')} — ${issue.message}` : `${issue.path.join('.')} — ${issue.message}`;
    })
    .join('\n');
