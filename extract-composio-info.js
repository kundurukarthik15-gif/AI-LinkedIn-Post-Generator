const fs = require('fs');

const data = fs.readFileSync('node_modules/@composio/core/package.json', 'utf8');
fs.writeFileSync('temp_package.json', data);

const indexPath = 'node_modules/@composio/core/dist/index.js';
if (fs.existsSync(indexPath)) {
  const indexData = fs.readFileSync(indexPath, 'utf8');
  fs.writeFileSync('temp_index.js', indexData);
}

// Check for getEntity
function search(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = require('path').join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            search(p);
        } else if (p.endsWith('.js')) {
            const content = fs.readFileSync(p, 'utf8');
            if (content.includes('getEntity')) {
                fs.appendFileSync('temp_getEntity.txt', p + '\n');
            }
        }
    }
}
search('node_modules/@composio');
