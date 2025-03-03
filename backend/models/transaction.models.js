import mongoose from 'mongoose'


const transactionSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        purchaseAmount: { 
            type: Number, 
            required: true 
        },
        profit: { 
            type: Number, 
            required: true
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        }
        
    } 
    , {timestamps : true}
)

export const Transaction = mongoose.model('Transaction', transactionSchema)

