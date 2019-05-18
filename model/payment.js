let mongoose = require('mongoose');

let PaymentSchema = new mongoose.Schema({
    cardNo:{
        type: String,
        default:'',
        required: true
    },
    type: {
        type: String
    },
    date: {
        type: Number,
        default: Date.now()
    },
    amount:{
        type: Number,
        required: true
    }
});
 
module.exports = mongoose.model('Payment', PaymentSchema);