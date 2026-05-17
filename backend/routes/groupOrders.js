const express = require('express');
const router = express.Router();
const GroupOrder = require('../models/GroupOrder');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// CREATE GROUP ORDER
router.post('/', protect, async (req, res) => {
    try {
        const { productId, targetMembers, campus, quantity } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Check product availability in campus
        if (!product.availableCampuses.includes(campus)) {
            return res.status(400).json({ success: false, message: 'Product not available in this campus' });
        }
        
        // Validate target members (minimum 5)
        const target = parseInt(targetMembers);
        if (target < 5) {
            return res.status(400).json({ success: false, message: 'Minimum group size is 5 members' });
        }
        if (target > 20) {
            return res.status(400).json({ success: false, message: 'Maximum group size is 20 members' });
        }
        
        // Generate unique 6-digit code
        let code;
        let isUnique = false;
        while (!isUnique) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const existing = await GroupOrder.findOne({ code });
            if (!existing) isUnique = true;
        }
        
        // Expires in 4 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 4);
        
        const groupOrder = await GroupOrder.create({
            code,
            product: productId,
            productName: product.name,
            productPrice: product.price,
            productImage: product.imageUrl,
            vendor: product.vendor,
            campus,
            createdBy: req.user._id,
            creatorName: req.user.name,
            targetMembers: target,
            participants: [{
                user: req.user._id,
                userName: req.user.name,
                userDorm: req.user.dorm,
                quantity: quantity || 1,
                joinedAt: new Date(),
                hasPaid: false
            }],
            expiresAt
        });
        
        res.status(201).json({
            success: true,
            message: 'Group created successfully!',
            data: {
                code: groupOrder.code,
                groupId: groupOrder._id,
                productId: productId,
                targetMembers: groupOrder.targetMembers,
                currentMembers: 1,
                expiresAt: groupOrder.expiresAt
            }
        });
        
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// JOIN GROUP BY CODE
router.post('/join-by-code', protect, async (req, res) => {
    try {
        const { code, productId } = req.body;
        
        if (!code || !productId) {
            return res.status(400).json({ success: false, message: 'Code and product ID are required' });
        }
        
        const group = await GroupOrder.findOne({ 
            code: code.toUpperCase(),
            status: 'open'
        });
        
        if (!group) {
            return res.status(404).json({ success: false, message: 'Invalid or expired group code' });
        }
        
        // Check expiration
        if (new Date() > group.expiresAt) {
            group.status = 'expired';
            await group.save();
            return res.status(400).json({ success: false, message: 'Group code has expired' });
        }
        
        // Check if group is full
        if (group.participants.length >= group.targetMembers) {
            return res.status(400).json({ success: false, message: 'Group is already full' });
        }
        
        // Check if product matches
        if (group.product.toString() !== productId) {
            return res.status(400).json({ success: false, message: 'This group code is for a different product' });
        }
        
        // Check campus
        if (group.campus !== req.user.campus) {
            return res.status(400).json({ success: false, message: `This group is for ${group.campus.toUpperCase()} campus only` });
        }
        
        // Check if already in group
        const alreadyJoined = group.participants.some(p => p.user.toString() === req.user._id.toString());
        if (alreadyJoined) {
            return res.status(400).json({ success: false, message: 'You already joined this group' });
        }
        
        // Add participant
        group.participants.push({
            user: req.user._id,
            userName: req.user.name,
            userDorm: req.user.dorm,
            quantity: 1,
            joinedAt: new Date(),
            hasPaid: false
        });
        
        await group.save();
        
        // Calculate current discount
        const memberCount = group.participants.length;
        let discount = 0;
        let freeDelivery = false;
        
        if (memberCount >= 8) {
            discount = 30;
            freeDelivery = true;
        } else if (memberCount >= 7) {
            discount = 25;
        } else if (memberCount >= 6) {
            discount = 20;
        } else if (memberCount >= 5) {
            discount = 15;
        }
        
        res.json({
            success: true,
            message: `Successfully joined group! ${memberCount}/${group.targetMembers} members`,
            data: {
                groupId: group._id,
                productId: group.product,
                code: group.code,
                currentMembers: memberCount,
                targetMembers: group.targetMembers,
                discount: discount,
                freeDelivery: freeDelivery,
                discountedPrice: group.productPrice - (group.productPrice * discount / 100),
                isComplete: memberCount >= group.targetMembers
            }
        });
        
    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET USER'S GROUPS
router.get('/my-groups', protect, async (req, res) => {
    try {
        const groups = await GroupOrder.find({
            $or: [
                { createdBy: req.user._id },
                { 'participants.user': req.user._id }
            ]
        }).sort('-createdAt');
        
        // Add discount info to each group
        const enrichedGroups = groups.map(group => {
            const memberCount = group.participants.length;
            let discount = 0;
            let freeDelivery = false;
            
            if (memberCount >= 8) {
                discount = 30;
                freeDelivery = true;
            } else if (memberCount >= 7) {
                discount = 25;
            } else if (memberCount >= 6) {
                discount = 20;
            } else if (memberCount >= 5) {
                discount = 15;
            }
            
            return {
                _id: group._id,
                code: group.code,
                productId: group.product,
                productName: group.productName,
                productPrice: group.productPrice,
                productImage: group.productImage,
                currentMembers: memberCount,
                targetMembers: group.targetMembers,
                discount: discount,
                freeDelivery: freeDelivery,
                discountedPrice: group.productPrice - (group.productPrice * discount / 100),
                expiresAt: group.expiresAt,
                status: group.status,
                isCreator: group.createdBy.toString() === req.user._id.toString(),
                participants: group.participants.map(p => ({
                    userName: p.userName,
                    userDorm: p.userDorm,
                    hasPaid: p.hasPaid
                }))
            };
        });
        
        res.json({ success: true, data: enrichedGroups });
    } catch (error) {
        console.error('Get my groups error:', error);
        res.json({ success: true, data: [] });
    }
});

// GET SINGLE GROUP DETAILS
router.get('/:groupId', protect, async (req, res) => {
    try {
        const group = await GroupOrder.findById(req.params.groupId);
        
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        
        // Check if user is in group
        const isMember = group.participants.some(p => p.user.toString() === req.user._id.toString());
        const isCreator = group.createdBy.toString() === req.user._id.toString();
        
        if (!isMember && !isCreator) {
            return res.status(403).json({ success: false, message: 'You are not a member of this group' });
        }
        
        const memberCount = group.participants.length;
        let discount = 0;
        let freeDelivery = false;
        
        if (memberCount >= 8) {
            discount = 30;
            freeDelivery = true;
        } else if (memberCount >= 7) {
            discount = 25;
        } else if (memberCount >= 6) {
            discount = 20;
        } else if (memberCount >= 5) {
            discount = 15;
        }
        
        res.json({
            success: true,
            data: {
                _id: group._id,
                code: group.code,
                productId: group.product,
                productName: group.productName,
                productPrice: group.productPrice,
                productImage: group.productImage,
                campus: group.campus,
                currentMembers: memberCount,
                targetMembers: group.targetMembers,
                discount: discount,
                freeDelivery: freeDelivery,
                discountedPrice: group.productPrice - (group.productPrice * discount / 100),
                expiresAt: group.expiresAt,
                isCreator: isCreator,
                participants: group.participants.map(p => ({
                    userName: p.userName,
                    userDorm: p.userDorm,
                    quantity: p.quantity,
                    hasPaid: p.hasPaid
                })),
                status: group.status
            }
        });
        
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// MARK PARTICIPANT AS PAID (when they checkout)
router.post('/:groupId/checkout', protect, async (req, res) => {
    try {
        const { orderId } = req.body;
        const group = await GroupOrder.findById(req.params.groupId);
        
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        
        const participant = group.participants.find(p => p.user.toString() === req.user._id.toString());
        if (!participant) {
            return res.status(403).json({ success: false, message: 'You are not in this group' });
        }
        
        participant.hasPaid = true;
        await group.save();
        
        // Check if all members have paid
        const allPaid = group.participants.every(p => p.hasPaid === true);
        
        if (allPaid && group.participants.length >= group.targetMembers) {
            group.status = 'completed';
            await group.save();
        }
        
        res.json({
            success: true,
            message: 'Payment confirmed',
            allPaid,
            groupCompleted: group.status === 'completed'
        });
        
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;