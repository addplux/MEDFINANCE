const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);
let errors = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Match import statements: import ... from './path' or import('./path')
    const regex = /from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const importPath = match[1] || match[2];
        
        // Only check relative imports
        if (importPath.startsWith('.')) {
            const dirName = path.dirname(file);
            const resolvedPath = path.resolve(dirName, importPath);
            
            // It could be a file with .js, .jsx, .css extensions, or a directory with index.js
            let targetPaths = [
                resolvedPath,
                resolvedPath + '.js',
                resolvedPath + '.jsx',
                resolvedPath + '.css',
                path.join(resolvedPath, 'index.js'),
                path.join(resolvedPath, 'index.jsx')
            ];

            let found = false;
            let actualCase = null;

            for (const p of targetPaths) {
                if (fs.existsSync(p)) {
                    // Check actual case on disk
                    const baseName = path.basename(p);
                    const dirName = path.dirname(p);
                    try {
                        const actualFiles = fs.readdirSync(dirName);
                        if (actualFiles.includes(baseName)) {
                            found = true;
                            break;
                        } else {
                            // File exists (Windows is case-insensitive), but actual case differs
                            actualCase = actualFiles.find(f => f.toLowerCase() === baseName.toLowerCase());
                            if (actualCase) {
                                console.log(`[ERROR] Case mismatch in ${file.replace(srcDir, '')}`);
                                console.log(`   Imported: '${importPath}' -> Resolves to base: '${baseName}'`);
                                console.log(`   Expected: '${actualCase}'\n`);
                                errors++;
                            }
                        }
                    } catch(e) {}
                }
            }
            
            if (!found && !actualCase) {
                // Ignore missing things that might be mapped by Vite (like @assets), though we only checked '.'
                // Or might be .svg / .png
                if (!importPath.endsWith('.svg') && !importPath.endsWith('.png') && !importPath.endsWith('.jpg')) {
                     // console.log(`[WARNING] Could not resolve ${importPath} in ${file}`);
                }
            }
        }
    }
});

if (errors === 0) {
    console.log("✅ No case-sensitivity import errors found.");
} else {
    console.log(`❌ Found ${errors} case-sensitivity errors.`);
}
