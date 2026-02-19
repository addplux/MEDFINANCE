/**
 * MEDFINANCE360 Auth Controller
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

const jwt = require('jsonwebtoken');
const { User, Organization, Notification } = require('../models');
const { Op } = require('sequelize');

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check account status before password verification
        if (user.status === 'pending') {
            return res.status(403).json({
                error: 'Account pending approval',
                message: 'Your account is awaiting admin approval. You will be notified once approved.'
            });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({
                error: 'Account rejected',
                message: user.rejectionReason
                    ? `Your account registration was declined: ${user.rejectionReason}`
                    : 'Your account registration was declined. Please contact your administrator.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is inactive. Contact your administrator.' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({ token, user: user.toSafeObject() });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// ─── Register (self-service) ──────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, department } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'First name, last name, email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check for duplicate email
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Generate a username from email
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);

        // Create user with pending status
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password,
            username,
            department: department || null,
            role: 'viewer',
            status: 'pending',
            isActive: false
        });

        // Notify all admins
        const admins = await User.findAll({ where: { role: 'admin', status: 'approved', isActive: true } });
        if (admins.length > 0) {
            await Promise.all(
                admins.map(admin =>
                    Notification.create({
                        userId: admin.id,
                        type: 'registration_request',
                        title: 'New Account Registration',
                        message: `${firstName} ${lastName} (${email}) has requested access${department ? ` — Department: ${department}` : ''}.`,
                        isRead: false,
                        metadata: { pendingUserId: newUser.id }
                    })
                )
            );
        }

        res.status(201).json({
            message: 'Registration submitted successfully. Your account is pending admin approval.',
            userId: newUser.id
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
};

// ─── Get pending users (admin only) ───────────────────────────────────────────
const getPendingUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { status: 'pending' },
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ error: 'Failed to fetch pending users' });
    }
};

// ─── Approve user (admin only) ────────────────────────────────────────────────
const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.status !== 'pending') return res.status(400).json({ error: 'User is not in pending status' });

        await user.update({
            status: 'approved',
            isActive: true,
            role: role || 'viewer'
        });

        // Notify the admin performing the action and clear their notification
        await Notification.update(
            { isRead: true },
            { where: { metadata: { pendingUserId: parseInt(id) }, type: 'registration_request' } }
        );

        res.json({ message: `Account approved successfully`, user: user.toSafeObject() });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
};

// ─── Reject user (admin only) ─────────────────────────────────────────────────
const rejectUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.status !== 'pending') return res.status(400).json({ error: 'User is not in pending status' });

        await user.update({
            status: 'rejected',
            isActive: false,
            rejectionReason: reason || 'Registration declined by administrator'
        });

        // Mark related notifications as read
        await Notification.update(
            { isRead: true },
            { where: { metadata: { pendingUserId: parseInt(id) }, type: 'registration_request' } }
        );

        res.json({ message: 'Account rejected', user: user.toSafeObject() });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ error: 'Failed to reject user' });
    }
};

// ─── Get current user ─────────────────────────────────────────────────────────
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

// ─── Get organization info (public) ───────────────────────────────────────────
const getOrganizationInfo = async (req, res) => {
    try {
        const organization = await Organization.findOne({
            attributes: ['name', 'logo', 'type']
        });
        if (!organization) return res.json({ name: 'MEDFINANCE360' });
        res.json(organization);
    } catch (error) {
        console.error('Get organization info error:', error);
        res.status(500).json({ error: 'Failed to get organization info' });
    }
};

module.exports = {
    login,
    register,
    getPendingUsers,
    approveUser,
    rejectUser,
    getCurrentUser,
    logout,
    getOrganizationInfo
};
