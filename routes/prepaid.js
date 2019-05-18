let express = require('express');
let router = express.Router();
let Prepaid = require('./../model/Prepaid');
let check = require('./../lib/checkLib');
let PaymentModel = require('./../model/payment')
let auth = require('../middleware')
/************Prepaid API load************************* */
router.route('/api/prepaid/register')
      .post((req,res)=>{
        console.log('api hit')
          let prepaidData = new Prepaid({
            cardNo: req.body.cardNo,
            mobileNo: req.body.mobileNo,
            emailId: req.body.emailId
          });
          prepaidData.save()
            .then((prepaidData) => {
              res.status(200).json({success: true, msg: 'Data Saved',data: prepaidData})
              // res.status(200).json({success: true, msg: 'Data Saved',data: prepaidData})
            })
            .catch((err)=>{
              res.status(200).json({success: false, msg:'Some thing went wrong while saving the data.'})
            })
      });

/************Prepaid API sell************************* */
router.route('/api/prepaid/sell')
      .post( (req,res) => {
          let amt = req.body.amount;
          var query = {};
          if(req.body.id.length > 10) {
            query.cardNo = req.body.id
          } else {
            query.mobileNo = req.body.id
          }
          Prepaid.findOne(query, function(err, data) {
            if(err) {
              console.log(err)
            } else {
              if(data) {
                console.log(data, data.amount, amt, "this si amoutns")
                if(data.amount > amt){
                  data.amount = data.amount - amt
                  data.save(function(err, finalData) {
                    if(err) {
                      console.log(err)
                    } else {
                      res.status(200).json({
                        success: true,
                        msg: `You have paid ${amt}. Remaining amount is ${finalData.amount}`
                      });
                      let paymentData = new PaymentModel({
                        cardNo: data.cardNo,
                        type: 'sell',
                        amount: amt
                      })
                      paymentData.save(function(err, paymentUpdate){
                        if(err){
                          console.log(err);
                        }else {
                          console.log(paymentUpdate);     
                        }
                      });                            
                    }
                  });
                }else {
                  res.status(200).json({success: false, msg:'insufficient balance'})
                } 
              } else {
                res.status(200).json({success: true, msg: "No card found"})
              }
            }
          });
      });

router.route('/api/prepaid/balance')
  .post((req,res)=>{
    var query = {};
    if(req.body.id && req.body.id.length > 10) {
      query.cardNo = req.body.id;
    } else {
      query.mobileNo = req.body.id;
    }
    Prepaid.findOne(query, function(err, fetchedDetails){
      if(err){
        res.status(200).json({success: false, err: err})
    }else {
        console.log(fetchedDetails) 
        res.status(200).json({success: true, data: fetchedDetails.amount});
      }
    });
});

router.route('/api/prepaid/load').post((req, res) => {
  var query = {};
  var amt = req.body.amount;
  if(req.body.id && req.body.id.length > 10) {
    query.cardNo = req.body.id
  } else {
    query.mobileNo = req.body.id
  }
  Prepaid.findOne(query, function(err, data) {
    if(err) {
      res.status(200).json({
        success: false,
        err: err
      })
    } else {
      if(data) {
        data.amount = data.amount + amt;
        data.save(function(err, fetchedDetails) {
          if(err) {
            res.status(200).json({
              success: false,
              err: err
            })
          } else {
            res.status(200).json({
              success: true,
              msg: `Your card has been loaded. You total amout is ${fetchedDetails.amount}`
            });
            let paymentData = new PaymentModel({
              cardNo: fetchedDetails.cardNo,
              type: 'add',
              amount: amt
            })
            paymentData.save(function(err, paymentUpdate){
              if(err){
                console.log(err);
              }else {
                console.log(paymentUpdate)     
              }
            });
          }
        })
      } else {
        res.status(200).json({
          success: false,
          msg: "No card found"
        })
      }
    }
  })
})

module.exports = router;