const pdfService = require('./services/pdfService');

async function test() {
    try {
        console.log('Testing PDF Generation...');
        const html = '<h1>Hello World</h1><p>This is a test PDF.</p>';
        const buffer = await pdfService.generatePdfFromHtml(html);
        console.log('PDF generated successfully, buffer length:', buffer.length);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
