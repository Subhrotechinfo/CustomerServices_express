const express = require('express');
const router = express.Router();
let { isEmpty } = require('../lib/checkLib')

let PaymentModel = require('../model/payment');

router.route('/api/payment/history')
    .post((req,res)=>{
        PaymentModel.find({cardNo: req.body.cardNo},function(err, fetchedDetails){
            if(err){
                res.status(200).json({err:err})
            }else if(isEmpty(fetchedDetails)){
                res.status(200).json({success: false, err: 'unable to fetch amount at this point'})
            } else {
                res.status(200).json({success: true, msg:'fetched amount', data: fetchedDetails});
            }
        })
    });

module.exports = router;
