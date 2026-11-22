import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const dataPath = resolve('D:/Projects/pragneysh/pragneysh-portfolio/src/data.js');
const content = readFileSync(dataPath, 'utf8');

// 1. Blocks
const epStart = content.indexOf('export const engineeringProjects = [');
const lpStart = content.indexOf('export const liveProjects = [');
const expStart = content.indexOf('export const experience = [');

if (epStart === -1 || lpStart === -1 || expStart === -1) {
  console.error('Failed to locate array boundaries in src/data.js');
  process.exit(1);
}

const epText = content.substring(epStart, lpStart);
const lpText = content.substring(lpStart, expStart);

function extractObjects(text) {
  const list = [];
  let cur = null;
  for (let l of text.split(/\r?\n/)) {
    const trimmed = l.trim();
    if (trimmed === '{') {
      if (cur && cur.id) list.push(cur);
      cur = {};
      continue;
    }
    if (!cur) continue;
    let m = l.match(/\bid:\s*"([^"]+)"/); if (m) { cur.id = m[1]; continue; }
    m = l.match(/\bslug:\s*"([^"]+)"/); if (m) { cur.slug = m[1]; continue; }
    m = l.match(/\btitle:\s*"([^"]+)"/); if (m) { cur.title = m[1]; continue; }
    m = l.match(/\bcategory:\s*"([^"]+)"/); if (m) { cur.category = m[1]; continue; }
    m = l.match(/\bbadge:\s*"([^"]+)"/); if (m) { cur.badge = m[1]; continue; }
    m = l.match(/\bfeatured:\s*(true|false)/); if (m) { cur.featured = (m[1] === 'true'); continue; }
    m = l.match(/\bimage:\s*([a-zA-Z0-9_]+|null)/); if (m) { cur.image = m[1]; continue; }
    m = l.match(/\bliveUrl:\s*("[^"]*"|null)/); if (m) { cur.liveUrl = m[1].replace(/"/g, ''); continue; }
    m = l.match(/\bgithubUrl:\s*("[^"]*"|null)/); if (m) { cur.githubUrl = m[1].replace(/"/g, ''); continue; }
    m = l.match(/\bstatus:\s*"([^"]+)"/); if (m) { cur.status = m[1]; continue; }
  }
  if (cur && cur.id) list.push(cur);
  return list;
}

const engineeringProjects = extractObjects(epText);
const liveProjects = extractObjects(lpText);

console.log('=== 1. ENGINEERING PROJECTS (' + engineeringProjects.length + ') ===');
engineeringProjects.forEach((p, idx) => {
  console.log(`${idx + 1}. ID: ${p.id} | Slug: ${p.slug} | Title: ${p.title} | Badge: ${p.badge} | Featured: ${p.featured} | Img: ${p.image} | Live: ${p.liveUrl} | GH: ${p.githubUrl}`);
});

console.log('\n=== 2. LIVE PROJECTS (' + liveProjects.length + ') ===');
liveProjects.forEach((p, idx) => {
  console.log(`${idx + 1}. ID: ${p.id} | Slug: ${p.slug} | Title: ${p.title} | Cat: ${p.category} | Img: ${p.image} | Live: ${p.liveUrl} | GH: ${p.githubUrl}`);
});

// 3. Duplicate checks
console.log('\n=== 3. DUPLICATE CHECKS ===');
const epIds = engineeringProjects.map(p => p.id);
const epSlugs = engineeringProjects.map(p => p.slug);
const dupEpIds = epIds.filter((id, i) => epIds.indexOf(id) !== i);
const dupEpSlugs = epSlugs.filter((s, i) => epSlugs.indexOf(s) !== i);
console.log('Duplicate IDs in engineeringProjects:', dupEpIds.length ? dupEpIds : 'None (All Unique)');
console.log('Duplicate Slugs in engineeringProjects:', dupEpSlugs.length ? dupEpSlugs : 'None (All Unique)');

const lpIds = liveProjects.map(p => p.id);
const lpSlugs = liveProjects.map(p => p.slug);
const dupLpIds = lpIds.filter((id, i) => lpIds.indexOf(id) !== i);
const dupLpSlugs = lpSlugs.filter((s, i) => lpSlugs.indexOf(s) !== i);
console.log('Duplicate IDs in liveProjects:', dupLpIds.length ? dupLpIds : 'None (All Unique)');
console.log('Duplicate Slugs in liveProjects:', dupLpSlugs.length ? dupLpSlugs : 'None (All Unique)');

const allIds = [...epIds, ...lpIds];
const allSlugs = [...epSlugs, ...lpSlugs];
const dupAllIds = allIds.filter((id, i) => allIds.indexOf(id) !== i);
const dupAllSlugs = allSlugs.filter((s, i) => allSlugs.indexOf(s) !== i);
console.log('Cross-collection Duplicate IDs (EP + LP):', dupAllIds.length ? dupAllIds : 'None (All Unique)');
console.log('Cross-collection Duplicate Slugs (EP + LP):', dupAllSlugs.length ? dupAllSlugs : 'None (All Unique)');

// 4. Six Core Resume Projects Check
console.log('\n=== 4. SIX CORE RESUME PROJECTS (featured: true) ===');
const expectedFeatured = [
  'leavesmanagement',
  'tour-travel-booking',
  'tshirt-customization-platform',
  'client-portfolio-platforms',
  'auth-security-systems',
  'restaurant-ordering-system'
];
const actualFeatured = engineeringProjects.filter(p => p.featured).map(p => p.id);
console.log('Actual featured: true in EP:', actualFeatured);
const matchesFeatured = expectedFeatured.every(id => actualFeatured.includes(id)) && actualFeatured.length === 6;
console.log('Exact 6 resume projects present and featured:', matchesFeatured ? 'PASSED' : 'FAILED');

// 5. Additional System Projects Check
console.log('\n=== 5. ADDITIONAL PROJECTS (featured: false) ===');
const expectedAdditional = [
  'aws-control-center',
  'workly',
  'verticomply'
];
const actualAdditional = engineeringProjects.filter(p => !p.featured).map(p => p.id);
console.log('Actual featured: false in EP:', actualAdditional);
const matchesAdditional = expectedAdditional.every(id => actualAdditional.includes(id)) && actualAdditional.length === 3;
console.log('Additional projects present and not featured:', matchesAdditional ? 'PASSED' : 'FAILED');

// 6. Skills Categories Check
console.log('\n=== 6. SKILLS CATEGORIES CHECK (5 Categories Expected) ===');
const expectedSkillsCats = ['cloud-aws', 'devops-cicd', 'backend', 'frontend', 'databases'];
const skillsBlockMatch = content.match(/export const skillsCategories = \[([\s\S]*?)\];/);
const skillsIds = [];
if (skillsBlockMatch) {
  const catMatches = skillsBlockMatch[1].matchAll(/id:\s*"([^"]+)"/g);
  for (const m of catMatches) skillsIds.push(m[1]);
}
console.log('Skills Category IDs:', skillsIds);
const skillsMatch = expectedSkillsCats.every(c => skillsIds.includes(c)) && skillsIds.length === 5;
console.log('Matches exact 5 resume categories:', skillsMatch ? 'PASSED' : 'FAILED');

// 7. Case Study Route Resolution
console.log('\n=== 7. CASE STUDY ROUTE LOOKUP RESOLUTION ===');
engineeringProjects.forEach(p => {
  const matchesBySlug = engineeringProjects.filter(x => x.slug === p.slug || x.id === p.slug);
  console.log(`Slug '${p.slug}' -> ${matchesBySlug.length === 1 ? 'Resolves to 1 unique record (' + matchesBySlug[0].id + ')' : 'AMBIGUOUS'}`);
});

// 8. Krishna Birthday check across entire src
console.log('\n=== 8. KRISHNA BIRTHDAY CHECK ACROSS SRC ===');
function searchDirectory(dir, term) {
  let found = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      found = found.concat(searchDirectory(fullPath, term));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      const text = readFileSync(fullPath, 'utf8');
      if (text.toLowerCase().includes(term.toLowerCase())) {
        found.push(fullPath);
      }
    }
  }
  return found;
}
const kbResults = searchDirectory('D:/Projects/pragneysh/pragneysh-portfolio/src', 'krishna');
console.log('Krishna references in src/:', kbResults.length ? kbResults : '0 found (EXCLUDED)');

// 9. Export declarations check
console.log('\n=== 9. EXPORT DECLARATIONS CHECK ===');
const expectedExports = [
  'profile',
  'workflow',
  'skillsCategories',
  'services',
  'engineeringProjects',
  'liveProjects',
  'experience',
  'experiences',
  'projects',
  'developedApps',
  'maintainedProjects',
  'deployedWebsites',
  'auditedInfrastructure',
  'enrichedProjects',
  'skills',
  'achievements',
  'contributions',
  'education',
  'certifications',
  'githubData',
  'navigation',
  'socialLinks'
];
const exportMatches = [...content.matchAll(/export const ([a-zA-Z0-9_]+)/g)].map(m => m[1]);
console.log('Total exports found in data.js:', exportMatches.length);
const missingExports = expectedExports.filter(exp => !exportMatches.includes(exp));
console.log('Missing exports:', missingExports.length ? missingExports : 'None (All 22 Present)');
