const { User } = require('./backend/models');
const sequelize = require('./backend/config/database'); // Adjust path if needed

async function checkUser() {
    try {
        const email = 'admin@medfinance360.com';
        console.log(`Checking user: ${email}`);

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User NOT FOUND');
        } else {
            console.log('User FOUND:');
            console.log(`- ID: ${user.id}`);
            console.log(`- Role: ${user.role}`);
            console.log(`- Status: ${user.status}`);
            console.log(`- Is Active: ${user.isActive}`);
            console.log(`- Created At: ${user.createdAt}`);
        }
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        await sequelize.close(); // Close connection
    }
}

checkUser();
