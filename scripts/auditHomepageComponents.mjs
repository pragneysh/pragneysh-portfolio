import fs from 'node:fs';

const components = [
  'Hero',
  'FeaturedProjects',
  'About',
  'Skills',
  'Services',
  'Projects',
  'ArchitectureShowcase',
  'LiveProjects',
  'Experience',
  'Achievements',
  'Contributions',
  'Education',
  'Certifications',
  'GitHubSection',
  'Contact',
];

console.log('=== HOMEPAGE COMPONENTS AUDIT ===');
components.forEach(name => {
  const p = `src/components/${name}.jsx`;
  if (fs.existsSync(p)) {
    const code = fs.readFileSync(p, 'utf8');
    const idMatch = code.match(/id=["']([^"']+)["']/);
    const h2Match = code.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    const cleanH2 = h2Match ? h2Match[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : 'N/A';
    console.log(`${name}:`);
    console.log(`  File: ${p} (${code.split('\n').length} lines)`);
    console.log(`  Section ID: #${idMatch ? idMatch[1] : 'NONE'}`);
    console.log(`  H2 Heading: "${cleanH2}"`);
  } else {
    console.log(`${name}: NOT FOUND`);
  }
});
