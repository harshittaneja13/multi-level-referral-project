import mongoose from 'mongoose'

const earningSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        // Amount earned from the referral.
        amount: { 
            type: Number, 
            required: true 
        },

        referralLevel: { 
            type: Number, enum: [1, 2], 
            required: true 
        },
        transaction: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Transaction' 
        },
        createdAt: { 
            type: Date, default: Date.now 
        }
    }
    , {timestamps : true}
)

export const Earning = mongoose.model('Earning', earningSchema)