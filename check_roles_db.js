const { User, Role } = require('./backend/models');

async function checkRoles() {
    try {
        const users = await User.findAll({
            include: [{ model: Role, as: 'userRole' }]
        });
        
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`User: ${u.username} (${u.firstName} ${u.lastName})`);
            console.log(`- Role ENUM: ${u.role}`);
            console.log(`- Role ID: ${u.roleId}`);
            console.log(`- Role Object: ${u.userRole ? u.userRole.name : 'NONE'}`);
            if (u.userRole) {
                console.log(`- Permissions: ${JSON.stringify(u.userRole.permissions)}`);
            }
            console.log('---');
        });

        const roles = await Role.findAll();
        console.log('\n--- DEFINED ROLES ---');
        roles.forEach(r => {
            console.log(`Role: ${r.name} (ID: ${r.id})`);
            console.log(`- Permissions: ${JSON.stringify(r.permissions)}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkRoles();
