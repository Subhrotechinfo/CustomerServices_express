let mongoose = require('mongoose');
let Schema  = mongoose.Schema;

let CrmSchema = new mongoose.Schema({
    name:{
        type: String,
        default: '',
        required: true
    },
    mobileNo: {
        type: String,
        default: '',
        required: true
    },
    address:{
        type: String,
        default: '',
        required: true
    },
    product: {
        type: String,
        default: '',
        required: true
    },
    status: {
        type: String,
        default: 'No',
        required: true
     },
    paymentRecieved: {
        type: String,
        default: 'No',
        required: true
    },
    paymentPending: {
        type: String,
        default:'No',
        required: true
    },
    remarks: {
        type:String,
        default:"",
        required: true
    },
    dob:{
        type: Number,
        detault:"",
        required: true
    },
    deleted:{
        type: Number,
        default: 0    // 0-> active,1->inactive 
    },
    merchant_Id: {
        type: Schema.Types.ObjectId, ref: 'user'
    }
});

module.exports = mongoose.model('Crm', CrmSchema);
