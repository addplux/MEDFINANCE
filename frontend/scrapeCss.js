const https = require('https');

https.get('https://preview-tpjivint--health-billing-records-1.deploypad.app/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const cssLinks = [...data.matchAll(/href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
        console.log('CSS Links:', cssLinks);

        const styles = [...data.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
        console.log('Inline Styles found:', styles.length);

        styles.forEach(style => {
            const rootMatches = style.match(/:root\s*{([^}]+)}/g);
            if (rootMatches) {
                rootMatches.forEach(m => console.log('INLINE ROOT:', m));
            }
            const fonts = style.match(/font-family:[^;]+/g);
            if (fonts) console.log('FONTS INLINE:', [...new Set(fonts)].slice(0, 5));
        });

        cssLinks.forEach(link => {
            const url = link.startsWith('http') ? link : (link.startsWith('/') ? 'https://preview-tpjivint--health-billing-records-1.deploypad.app' + link : 'https://preview-tpjivint--health-billing-records-1.deploypad.app/' + link);
            https.get(url, (res2) => {
                let cssData = '';
                res2.on('data', chunk => cssData += chunk);
                res2.on('end', () => {
                    const rootMatches = cssData.match(/:root\s*{([^}]+)}/g);
                    if (rootMatches) {
                        rootMatches.forEach(m => console.log('ROOT in', url, ':', m));
                    }
                    const fonts = cssData.match(/font-family:[^;}]+/g);
                    if (fonts) console.log('FONTS in', url, ':', [...new Set(fonts)].slice(0, 5));
                });
            }).on('error', err => console.error('Error fetching CSS:', err));
        });
    });
}).on('error', err => console.error('Error fetching HTML:', err));
