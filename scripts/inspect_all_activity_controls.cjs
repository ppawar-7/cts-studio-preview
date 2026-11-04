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
    } else if (file.endsWith('Challenge.jsx') || file.endsWith('Challenge.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findJsxFiles(activitiesDir);
console.log(`Found ${files.length} activity component files:\n`);

const summary = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const basename = path.basename(f);
  
  // Find button text
  const buttonMatches = [...content.matchAll(/<button[^>]*>([^<]+)<\/button>/g)];
  const submitBtns = buttonMatches
    .map(m => m[1].trim())
    .filter(txt => txt.toLowerCase().includes('verify') || txt.toLowerCase().includes('submit') || txt.toLowerCase().includes('run') || txt.toLowerCase().includes('check'));
  
  const hasSelect = content.includes('<select');
  const hasRadio = content.includes('type="radio"') || content.includes("type='radio'");
  const hasCheckbox = content.includes('type="checkbox"') || content.includes("type='checkbox'");
  const hasTextNumber = content.includes('type="text"') || content.includes('type="number"');
  const hasSvgCanvas = content.includes('<svg') || content.includes('<canvas');

  summary.push({
    file: basename,
    buttons: submitBtns,
    controls: { hasSelect, hasRadio, hasCheckbox, hasTextNumber, hasSvgCanvas }
  });
}

summary.sort((a, b) => a.file.localeCompare(b.file));
summary.forEach(s => {
  console.log(`${s.file}:`);
  console.log(`   Submit Button(s): ${JSON.stringify(s.buttons)}`);
  console.log(`   Controls: ${JSON.stringify(s.controls)}`);
});
