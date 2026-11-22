import { engineeringProjects } from './src/data.js';
const list = engineeringProjects.map(p => ({ id: p.id, slug: p.slug }));
console.log(JSON.stringify(list, null, 2));

