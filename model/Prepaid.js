let mongoose = require('mongoose');

let PrepaidSchema = new mongoose.Schema({
    cardNo:{
        type: String,
        default:'',
        required: true,
        unique: true
    },
    mobileNo: {
        type: String,
        default:'',
        required: true,
        unique: true
    },
    emailId: {
        type: String,
        required:true
    },
    amount:{
        type: Number,
        default:0
    }
});
 
module.exports = mongoose.model('Prepaid', PrepaidSchema);


