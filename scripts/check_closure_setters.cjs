'use strict';
const fs = require('fs');
const path = require('path');

const activitiesDir = path.resolve(__dirname, '..', 'src', 'activities');

function findJsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findJsxFiles(fullPath));
    } else if (file.endsWith('Challenge.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findJsxFiles(activitiesDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const basename = path.basename(file);

  // Look for patterns like `setFoo([...foo])` or `setBar({ ...bar })` without `prev =>`
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.match(/set[A-Z][A-Za-z0-9]*\(\s*\[\s*\.\.\.[a-zA-Z0-9]/) ||
        line.match(/set[A-Z][A-Za-z0-9]*\(\s*\{\s*\.\.\.[a-zA-Z0-9]/)) {
      if (!line.includes('prev')) {
        console.log(`${basename}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
}
