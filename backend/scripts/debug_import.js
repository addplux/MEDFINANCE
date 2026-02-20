try {
    console.log('Requiring controller...');
    const controller = require('../controllers/nhimaController');
    console.log('Controller keys:', Object.keys(controller));
} catch (error) {
    console.error('Error requiring controller:', error);
}
