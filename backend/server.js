
import express from 'express'
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

// Import models
import { User } from './models/user.models.js';
import { Earning } from './models/earning.models.js';
import { Transaction } from './models/transaction.models.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());
dotenv.config()

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Connecting MongoDB Here
mongoose.connect(`${process.env.MONGODB_URL}`)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Socket.IO connection logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

function notifyUser(userId, update) {
    console.log("Emitting earningUpdate to", userId.toString());
    io.to(userId.toString()).emit('earningUpdate', update);
}

// API: Process a purchase – this endpoint should be called when a user makes a purchase.
app.post('/api/purchase', async (req, res) => {
    /*
    Expected payload:
    {
    "userId": "the purchaser user id",
    "purchaseAmount": 1500
    }
    */
    try {
        const { userId, purchaseAmount } = req.body;
        if (purchaseAmount < 1000) {
            return res.status(400).json({ message: 'Purchase amount is below the earning threshold.' });
        }
        console.log( userId , purchaseAmount );

        const profit = purchaseAmount;
        const objectId = new mongoose.Types.ObjectId(userId)

        const transaction = await Transaction.create({
            user: objectId,
            purchaseAmount,
            profit
        });

        const purchaser = await User.findById(userId);
        if (!purchaser) {
            return res.status(404).json({ message: 'Purchaser not found' });
        }

        // LEVEL 1 (Direct Referral) Earnings: 5% to user's parent if exists.
        if (purchaser.parent) {
            const parentUser = await User.findById(purchaser.parent);
            const directEarningAmount = profit * 0.05;
            if (parentUser) {
                // Create earning record
                await Earning.create({
                    user: parentUser._id,
                    amount: directEarningAmount,
                    referralLevel: 1,
                    transaction: transaction._id
                });

                parentUser.earnings += directEarningAmount;
                await parentUser.save();

                notifyUser(parentUser._id, {
                    type: 'direct',
                    parentname: parentUser.name,
                    username: purchaser.name,
                    amount: directEarningAmount,
                    fromUser: purchaser._id,
                    transactionId: transaction._id,
                    newTotal: parentUser.earnings
                });

            }
        }

        // LEVEL 2 (Indirect Referral) Earnings: 1% to grandparent (the parent of the purchaser’s parent)
        if (purchaser.parent) {
            const parentUser = await User.findById(purchaser.parent);
            if (parentUser && parentUser.parent) {
                const grandParentUser = await User.findById(parentUser.parent);
                const indirectEarningAmount = profit * 0.01;
                if (grandParentUser) {
                    await Earning.create({
                        user: grandParentUser._id,
                        amount: indirectEarningAmount,
                        referralLevel: 2,
                        transaction: transaction._id
                    });
                    grandParentUser.earnings += indirectEarningAmount;
                    await grandParentUser.save();

                    notifyUser(grandParentUser._id, {
                    type: 'indirect',
                    parentname: grandParentUser.name,
                    username: purchaser.name,
                    amount: indirectEarningAmount,
                    fromUser: purchaser._id,
                    transactionId: transaction._id,
                    newTotal: grandParentUser.earnings
                    });
                }
            }
        }

        return res.json({ message: 'Purchase processed and earnings updated.' });

    }
    catch (error) {
        console.error('Error in purchase API:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// API: Fetch earnings report for a given user
app.get('/api/earnings', async (req, res) => {
    /*
    Query Parameter: userId
    e.g. /api/earnings?userId=...
    */
    try {
        const { userId } = req.query;
        const earningsRecords = await Earning.find({ user: userId }).populate('transaction');
        return res.json({ earnings: earningsRecords });
    } catch (error) {
        console.error('Error fetching earnings:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// API: Example endpoint to create a new user and to manage referrals.
app.post('/api/users', async (req, res) => {
    /*
    Expected payload:
    {
    "name": "John Doe",
    "email": "john@example.com",
    "referrerId": "id_of_user_who_referred_this_user" // optional
    }
    */
    try {
        const { name, email, referrerId } = req.body;

        let existingUser = await User.findOne({ email });
        if (existingUser) {
            // Instead of creating a new user, log in as existing one.
            return res.status(200).json({
                message: 'User already exists, logging in.',
                user: existingUser
            });
        }

        let parent = null;
        if (referrerId) {
            parent = await User.findById(referrerId);
            if (!parent) {
                return res.status(400).json({ message: 'Referrer not found' });
            }
            if (parent.referrals.length >= 8) {
                return res.status(400).json({ message: 'Referrer has exceeded the referral limit.' });
            }
        }

        const newUser = await User.create({
            name,
            email,
            parent: parent ? parent._id : null
        });

        if (parent) {
            parent.referrals.push(newUser._id);
            await parent.save();
        }

        return res.status(201).json({ message: 'User created successfully', user: newUser });

    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/user', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ message: 'Name parameter is required.' });
        }
        const user = await User.findOne({ name: name });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.json({ user });
    } catch (error) {
        console.error('Error fetching user by name:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// Api to fetch all level 1 and level 2 referrals of a user by his name
app.get('/api/referrals', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ message: 'Name parameter is required.' });
        }

        const user = await User.findOne({ name }).populate('referrals');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const level1Referrals = user.referrals;

        const level1Ids = level1Referrals.map(referral => referral._id);
        const level2Referrals = await User.find({ parent: { $in: level1Ids } });

        return res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            level1: level1Referrals,
            level2: level2Referrals
        });
    } catch (error) {
        console.error('Error fetching referral info:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is listening on port :${PORT}`);
})