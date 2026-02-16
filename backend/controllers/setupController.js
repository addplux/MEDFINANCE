const { Service, User, Department } = require('../models');

// ========== Services/Tariffs ==========

// Get all services
const getAllServices = async (req, res) => {
    try {
        const { category, isActive } = req.query;

        const where = {};
        if (category) where.category = category;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const services = await Service.findAll({
            where,
            order: [['category', 'ASC'], ['serviceName', 'ASC']]
        });

        res.json(services);
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Failed to get services' });
    }
};

// Create service
const createService = async (req, res) => {
    try {
        const { serviceName, category, department, price, description } = req.body;

        if (!serviceName || !category || price === undefined || price === null) {
            return res.status(400).json({ error: 'Service name, category, and price are required' });
        }

        const normalizedCategory = category.toLowerCase();

        // Generate service code based on the LAST service code, not count
        const lastService = await Service.findOne({
            where: { category: normalizedCategory },
            order: [['createdAt', 'DESC']],
            attributes: ['serviceCode']
        });

        const categoryPrefix = normalizedCategory.substring(0, 3).toUpperCase();
        let nextNumber = 1;

        if (lastService && lastService.serviceCode) {
            // Extract the number part from the last service code
            // Format is XXX001, so we remove the first 3 chars
            const lastNumberStr = lastService.serviceCode.substring(3);
            const lastNumber = parseInt(lastNumberStr);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }

        const serviceCode = `${categoryPrefix}${String(nextNumber).padStart(3, '0')}`;

        const service = await Service.create({
            serviceCode,
            serviceName,
            category: normalizedCategory,
            department,
            price,
            description
        });

        res.status(201).json(service);
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            error: 'Failed to create service',
            details: error.message,
            validation: error.errors ? error.errors.map(e => e.message) : null
        });
    }
};

// Update service
const updateService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        await service.update(req.body);
        res.json(service);
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
};

// Delete service
const deleteService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        // Soft delete by setting isActive to false
        await service.update({ isActive: false });
        res.json({ message: 'Service deactivated successfully' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
};

// Get single service
const getService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({ error: 'Failed to get service' });
    }
};

// ========== Users ==========

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const { role, isActive } = req.query;

        const where = {};
        if (role) where.role = role;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

// Create user
const createUser = async (req, res) => {
    try {
        const { username, email, password, role, firstName, lastName } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'Username, email, password, and role are required' });
        }

        const user = await User.create({
            username,
            email,
            password,
            role,
            firstName,
            lastName
        });

        res.status(201).json(user.toSafeObject());
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow password update through this endpoint
        delete req.body.password;

        await user.update(req.body);
        res.json(user.toSafeObject());
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Get single user
const getUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};

// ========== Departments ==========

// Get all departments
const getAllDepartments = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        const departments = await Department.findAll({
            where,
            include: [
                { association: 'manager', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['departmentCode', 'ASC']]
        });

        res.json(departments);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to get departments' });
    }
};

// Create department
const createDepartment = async (req, res) => {
    try {
        const { departmentCode, departmentName, managerId, description } = req.body;

        if (!departmentCode || !departmentName) {
            return res.status(400).json({ error: 'Department code and name are required' });
        }

        const department = await Department.create({
            departmentCode,
            departmentName,
            managerId,
            description
        });

        const createdDepartment = await Department.findByPk(department.id, {
            include: [{ association: 'manager', attributes: ['id', 'firstName', 'lastName'] }]
        });

        res.status(201).json(createdDepartment);
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({ error: 'Failed to create department' });
    }
};

// Update department
const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id);

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        await department.update(req.body);

        const updatedDepartment = await Department.findByPk(department.id, {
            include: [{ association: 'manager', attributes: ['id', 'firstName', 'lastName'] }]
        });

        res.json(updatedDepartment);
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
};

// Get single department
const getDepartment = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id, {
            include: [{ association: 'manager', attributes: ['id', 'firstName', 'lastName'] }]
        });
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.json(department);
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ error: 'Failed to get department' });
    }
};

module.exports = {
    getAllServices,
    createService,
    updateService,
    deleteService,
    getService,
    getAllUsers,
    createUser,
    updateUser,
    getUser,
    getAllDepartments,
    createDepartment,
    updateDepartment,
    getDepartment
};
