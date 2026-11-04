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

const results = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const basename = path.basename(file);

  // Match inputs
  const inputs = [...content.matchAll(/<input[^>]+>/g)].map(m => m[0]);
  const selects = [...content.matchAll(/<select[^>]+>/g)].map(m => m[0]);
  const buttons = [...content.matchAll(/<button[^>]+>/g)].map(m => m[0]);

  // Find validator call: validate*(...)
  const validatorCallMatch = content.match(/validate[A-Za-z0-9]+\s*\(\s*\{([^}]+)\}\s*\)/s);

  results.push({
    file: basename,
    validatorArgs: validatorCallMatch ? validatorCallMatch[1].replace(/\s+/g, ' ').trim() : 'unknown',
    inputCount: inputs.length,
    selectCount: selects.length,
    buttonCount: buttons.length,
  });
}

results.sort((a, b) => a.file.localeCompare(b.file));
results.forEach(r => {
  console.log(`${r.file}: Args={ ${r.validatorArgs} } (Inputs: ${r.inputCount}, Selects: ${r.selectCount}, Buttons: ${r.buttonCount})`);
});
