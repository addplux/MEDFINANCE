const https = require('https');
const fs = require('fs');

const jsUrl = 'https://preview-89izf4zj--education-scalable-integrated.deploypad.app/assets/index-GoEQBkNi.js';
const cssUrl = 'https://preview-89izf4zj--education-scalable-integrated.deploypad.app/assets/index-BejJueiu.css';

function fetchUrl(url, callback) {
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => callback(data));
    });
}

fetchUrl(jsUrl, (jsData) => {
    // Find className="<classes>" or className: "<classes>"
    const classMatches = [...jsData.matchAll(/(?:className|class)\s*[:=]\s*["']([^"']+)["']/g)];
    let allClasses = classMatches.map(m => m[1]).join(' ').split(/\s+/);
    allClasses = [...new Set(allClasses)].filter(c => c);

    // Categorize classes to answer the user's questions:
    const textSizes = allClasses.filter(c => c.startsWith('text-'));
    const paddings = allClasses.filter(c => c.match(/^p[xy]?-/));
    const margins = allClasses.filter(c => c.match(/^m[xy]?-/));
    const gaps = allClasses.filter(c => c.startsWith('gap-'));
    const widths = allClasses.filter(c => c.match(/^w-|^max-w-/));
    const heights = allClasses.filter(c => c.startsWith('h-'));
    const cards = allClasses.filter(c => c.includes('card') || c.includes('rounded') || c.includes('shadow') || c.includes('border'));

    console.log("TEXT SIZES:", textSizes.slice(0, 30).join(', '));
    console.log("PADDINGS:", paddings.slice(0, 30).join(', '));
    console.log("GAPS:", gaps.slice(0, 30).join(', '));
    console.log("WIDTHS/LAYOUT:", widths.slice(0, 30).join(', '));
    console.log("CARDS/BORDERS:", cards.slice(0, 30).join(', '));
});
