const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\Usr\\.gemini\\antigravity-ide\\brain\\84bb35c5-7e84-4ad4-bb70-23d61b4003b9\\.system_generated\\logs\\transcript.jsonl';

async function scan() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.includes('GameContext.tsx')) continue;
    try {
      const data = JSON.parse(line);
      const step = data.step_index;
      const type = data.type;
      
      if (type === 'VIEW_FILE' && data.status === 'DONE') {
        const linesCount = data.content.split('\n').length;
        console.log(`Step: ${step} | View File | Lines read: ${linesCount}`);
      }
      
      const toolCalls = data.tool_calls || [];
      for (const call of toolCalls) {
        const name = call.name;
        if (name === 'view_file') {
          const args = call.args || {};
          console.log(`  Call: view_file | Start: ${args.StartLine} | End: ${args.EndLine}`);
        }
      }
    } catch (e) {}
  }
}

scan();
