const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./backend');
console.log(`Checking ${files.length} files...`);

let errors = 0;
files.forEach(file => {
    try {
        execSync(`node -c "${file}"`, { stdio: 'ignore' });
    } catch (e) {
        console.error(`❌ Syntax Error in ${file}`);
        errors++;
    }
});

if (errors === 0) {
    console.log('✅ All files have valid syntax.');
} else {
    console.log(`\nFound ${errors} files with syntax errors.`);
    process.exit(1);
}
