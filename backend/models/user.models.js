import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        name: { 
            type: String,
            required: true ,
            unique: true
        },
        email: { 
            type: String,
            required: true,
            unique: true 
        },
        // The direct referrer (parent) of this user
        parent: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            default: null 
        },
        // Direct referrals (children) of this user. Max 8 enforced in business logic.
        referrals: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        // Total earnings accumulated by this user.
        earnings: { type: Number, default: 0 }
    }
    , {timestamps : true}
)

export const User = mongoose.model('User', userSchema)