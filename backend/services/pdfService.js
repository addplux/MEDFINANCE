const puppeteer = require('puppeteer');

/**
 * Generate a PDF buffer from a raw HTML string using Headless Chromium.
 * 
 * @param {string} html - The complete HTML document string to render.
 * @returns {Promise<Buffer>} - The generated native A4 PDF buffer.
 */
exports.generatePdfFromHtml = async (html) => {
    let browser = null;
    try {
        // Standard Puppeteer handles downloading and launching Chrome 
        // regardless of if it's Windows, Mac, Linux, or Railway Container.
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Wait until all network requests (images/fonts) are finished loading
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Optional: Force print media type so @media print CSS is applied
        await page.emulateMediaType('print');

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        return pdfBuffer;
    } catch (error) {
        console.error('Puppeteer PDF Generation Error:', error);
        throw error;
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
