const fs = require('fs');

const bundlePath = 'c:\\Users\\Usr\\Desktop\\Futbol\\dist\\assets\\index-B-c0zxoA.js';

function inspect(keyword, contextChars = 2000) {
  const content = fs.readFileSync(bundlePath, 'utf8');
  const index = content.indexOf(keyword);
  if (index === -1) {
    console.log(`Keyword "${keyword}" NOT found in bundle.`);
    return;
  }
  console.log(`\n===========================================`);
  console.log(`Found "${keyword}" at index ${index}`);
  const start = Math.max(0, index - 200);
  const end = Math.min(content.length, index + contextChars);
  console.log(`Context:`);
  console.log(content.substring(start, end));
}

inspect('generarReunionPrivada', 1500);
inspect('guardarSorteoCopa', 2500);
inspect('generarFeedHinchada', 2500);
inspect('finalizarPartidoEnVivo', 2000);
