const fs = require('fs');

const bundlePath = 'c:\\Users\\Usr\\Desktop\\Futbol\\dist\\assets\\index-B-c0zxoA.js';

function inspectDef(varName, contextChars = 3000) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  
  // Look for patterns like "const Ze=" or "Ze=useCallback(" or "Ze="
  const patterns = [
    `const ${varName}=`,
    `let ${varName}=`,
    `${varName}=`
  ];
  
  for (const pattern of patterns) {
    let index = -1;
    let pos = 0;
    while ((index = content.indexOf(pattern, pos)) !== -1) {
      console.log(`\n===========================================`);
      console.log(`Found pattern "${pattern}" at index ${index}`);
      const start = Math.max(0, index - 100);
      const end = Math.min(content.length, index + contextChars);
      console.log(content.substring(start, end));
      pos = index + 1;
    }
  }
}

console.log('Searching for Dt (resolverReunionPrivada):');
inspectDef('Dt', 1500);

console.log('Searching for Ze (guardarSorteoCopa):');
inspectDef('Ze', 2000);
