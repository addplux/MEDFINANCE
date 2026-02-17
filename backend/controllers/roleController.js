const { Role, User } = require('../models');
const { Op } = require('sequelize');

exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            include: [{
                model: User,
                as: 'users',
                attributes: ['id', 'username', 'firstName', 'lastName']
            }]
        });
        res.status(200).json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'users',
                attributes: ['id', 'username', 'firstName', 'lastName']
            }]
        });
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json(role);
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions, isSystem } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        const existingRole = await Role.findOne({ where: { name } });
        if (existingRole) {
            return res.status(400).json({ error: 'Role with this name already exists' });
        }

        const role = await Role.create({
            name,
            description,
            permissions: permissions || {},
            isSystem: isSystem || false
        });

        res.status(201).json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const role = await Role.findByPk(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Prevent modifying system roles if necessary, or just restrict name changes
        if (role.isSystem && name !== role.name) {
            return res.status(403).json({ error: 'Cannot change name of system roles' });
        }

        await role.update({
            name,
            description,
            permissions
        });

        res.status(200).json(role);
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        if (role.isSystem) {
            return res.status(403).json({ error: 'Cannot delete system roles' });
        }

        // Check if users are assigned to this role
        const userCount = await User.count({ where: { roleId: role.id } });
        if (userCount > 0) {
            return res.status(400).json({ error: 'Cannot delete role assigned to users' });
        }

        await role.destroy();
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Failed to delete role' });
    }
};
