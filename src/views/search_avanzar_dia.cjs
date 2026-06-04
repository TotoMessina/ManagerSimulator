const fs = require('fs');

const bundlePath = 'c:\\Users\\Usr\\Desktop\\Futbol\\dist\\assets\\index-B-c0zxoA.js';

function inspectText(text, charsBefore = 1000, contextChars = 2500) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const index = content.indexOf(text);
  if (index === -1) {
    console.log(`Text "${text}" NOT found in bundle.`);
    return;
  }
  console.log(`\n===========================================`);
  console.log(`Found "${text}" at index ${index}`);
  const start = Math.max(0, index - charsBefore);
  const end = Math.min(content.length, index + contextChars);
  console.log(content.substring(start, end));
}

inspectText('esperando en tu oficina', 1000, 1000);
inspectText('Grupo de la Muerte! Te enfrentarás', 1000, 1000); // Also search for cup draw interception
inspectText('promesaTitularPendiente', 1000, 1000); // Also search for broken promise consequence
