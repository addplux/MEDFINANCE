require('dotenv').config();
const { User } = require('./models');

async function listUsers() {
    try {
        const users = await User.findAll();
        console.log('Current Users:', users.map(u => ({ 
            username: u.username,
            email: u.email, 
            role: u.role, 
            isActive: u.isActive 
        })));
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        process.exit();
    }
}

listUsers();
