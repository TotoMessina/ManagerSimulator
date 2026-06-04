const fs = require('fs');

const bundlePath = 'c:\\Users\\Usr\\Desktop\\Futbol\\dist\\assets\\index-B-c0zxoA.js';

function main() {
  const content = fs.readFileSync(bundlePath, 'utf8');
  
  // Find where the mapping is defined
  const mappingIndex = content.indexOf('guardarSorteoCopa:Ze');
  if (mappingIndex === -1) {
    console.error('Context mapping not found!');
    return;
  }
  console.log(`Context mapping found at index ${mappingIndex}`);
  
  // Now let's extract the mappings
  const mappingText = content.substring(mappingIndex - 200, mappingIndex + 800);
  console.log(`Mapping context:\n${mappingText}\n`);
  
  // From the mapping, we know:
  // guardarSorteoCopa: Ze
  // resolverReunionPrivada: Dt
  
  // Since they are defined in the same provider scope, let's search backwards from mappingIndex
  // for "const Ze=" or "const Dt=" or "Ze=useCallback(" or "Dt=useCallback("
  
  function findDefinition(name) {
    // Search backwards from mappingIndex for the declaration
    // In minified code, it's often "const Ze=" or "let Ze=" or "Ze="
    let pos = mappingIndex;
    let found = [];
    
    // We look for patterns like "const Ze=" or "Ze=useCallback" or "Ze=e=>"
    const regex = new RegExp(`\\b${name}\\s*=`, 'g');
    let match;
    // Since we want to search backwards, let's just find all matches in the file, and filter those that are before mappingIndex
    const allContent = content.substring(0, mappingIndex);
    const matches = [];
    let idx = -1;
    while ((idx = allContent.indexOf(name + '=', idx + 1)) !== -1) {
      matches.push(idx);
    }
    
    // Get the latest matches (closest to mappingIndex)
    console.log(`Matches for ${name}= before mapping:`, matches.slice(-5));
    
    for (const matchIdx of matches.slice(-3)) {
      console.log(`\n-------------------------------------------`);
      console.log(`Declaration of ${name} at index ${matchIdx}:`);
      console.log(content.substring(matchIdx, matchIdx + 2000));
    }
  }
  
  console.log('--- FINDING Dt (resolverReunionPrivada) ---');
  findDefinition('Dt');
  
  console.log('--- FINDING Ze (guardarSorteoCopa) ---');
  findDefinition('Ze');
}

main();
