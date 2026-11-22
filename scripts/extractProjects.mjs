import { readFileSync } from 'fs';
import { resolve } from 'path';

const dataPath = resolve('D:/Projects/pragneysh/pragneysh-portfolio/src/data.js');
const content = readFileSync(dataPath, 'utf8');

// Find exact engineeringProjects block
const startMatch = content.indexOf('export const engineeringProjects = [');
if (startMatch === -1) {
  console.error('Could not find engineeringProjects declaration');
  process.exit(1);
}

const endMatch = content.indexOf('export const liveProjects = [', startMatch);
const epBlock = content.substring(startMatch, endMatch !== -1 ? endMatch : content.length);

// Parse objects inside engineeringProjects
const lines = epBlock.split(/\r?\n/);
let projects = [];
let current = null;

for (let line of lines) {
  const trimmed = line.trim();
  if (trimmed === '{') {
    if (current && current.id) projects.push(current);
    current = {};
    continue;
  }
  if (!current) continue;

  const idMatch = line.match(/\bid:\s*"([^"]+)"/);
  if (idMatch) { current.id = idMatch[1]; continue; }

  const slugMatch = line.match(/\bslug:\s*"([^"]+)"/);
  if (slugMatch) { current.slug = slugMatch[1]; continue; }

  const titleMatch = line.match(/\btitle:\s*"([^"]+)"/);
  if (titleMatch) { current.title = titleMatch[1]; continue; }

  const catMatch = line.match(/\bcategory:\s*"([^"]+)"/);
  if (catMatch) { current.category = catMatch[1]; continue; }

  const featMatch = line.match(/\bfeatured:\s*(true|false)/);
  if (featMatch) { current.featured = featMatch[1] === 'true'; continue; }

  const imgMatch = line.match(/\bimage:\s*([a-zA-Z0-9_]+|null)/);
  if (imgMatch) { current.image = imgMatch[1]; continue; }

  const liveMatch = line.match(/\bliveUrl:\s*("[^"]*"|null)/);
  if (liveMatch) { current.liveUrl = liveMatch[1].replace(/"/g, ''); continue; }

  const ghMatch = line.match(/\bgithubUrl:\s*("[^"]*"|null)/);
  if (ghMatch) { current.githubUrl = ghMatch[1].replace(/"/g, ''); continue; }
}
if (current && current.id) projects.push(current);

console.log(JSON.stringify(projects, null, 2));
