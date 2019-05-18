let express = require('express');
let router = express.Router();
let CrmModel = require('../model/crm')
let check = require('../lib/checkLib')
var ObjectID = require('mongodb').ObjectID;
import jsonwebtoken from 'jsonwebtoken';
import { isRegExp } from 'util';

/**************LOGIN API********************/
router.route('/api/crm/save')
      .post((req,res) => {
          var id = res.locals.id;
          let CrmData = new CrmModel({
            name: req.body.name,
            mobileNo: req.body.mobileNo,
            address: req.body.address,
            product:req.body.product,
            status: req.body.status,
            paymentRecieved: req.body.paymentRecieved,
            paymentPending: req.body.paymentPending,
            remarks: req.body.remarks,
            dob: req.body.dob,
            merchant_Id: id
          });
          CrmData.save()
              .then((CrmData) => {
                if(check.isEmpty(CrmData)){
                  res.status(200).json({success:false, msg: 'Could not save'});
                }else {
                  res.status(200).json({success: true, msg: 'Saved Data', data: CrmData});
                }
              })
              .catch((err)=>{
                console.log(err);
                res.status(200).json({success: false, msg: 'something went wrong while saving the data', err:err})
              })
        });

router.route('/api/crm/get')
      .get((req,res) => {
          var id = res.locals.id
          CrmModel.find({merchant_Id: id, deleted:0})
          .exec()
          .then((userDetails) => {
            if(check.isEmpty(userDetails)){
              res.status(200).json({success: false, msg: 'User detail not found'})
            } else {
              res.status(200).json({success: true, data: userDetails})
            }

          })
          .catch((err)=>{
            res.status(200).json({success: false , msg: 'Something went wrong', err:err})
          });
      });

router.route('/api/crm/edit')
      .put((req,res) => {
        let id = res.locals.id
        CrmModel.findById(req.body.id, function(err, crm) {
          if(err) {
            // res.status(200).json({success: false,err: err})
            console.log(err);
          } else {
            if(crm) {
              if(crm.merchant_Id == id) {

                if(req.body.name){
                  crm.name = req.body.name;
                }
                if(req.body.mobileNo){
                  crm.mobileNo = req.body.mobileNo;
                }
                if(req.body.address){
                  crm.address = req.body.address;
                }
                if(req.body.product){
                  crm.product = req.body.product;
                }
                if(req.body.status){
                  crm.status = req.body.status;
                }
                if(req.body.paymentRecieved){
                  crm.paymentRecieved = req.body.paymentRecieved;
                }
                if(req.body.paymentPending){
                  crm.paymentPending = req.body.paymentPending;
                }
                if(req.body.remarks){
                  crm.remarks = req.body.remarks;
                }
                if(req.body.dob){
                  crm.dob = req.body.dob;
                } 

                crm.save(function(err, data){
                  if(err){
                    // res.status(200).json({err:true, msg:'error'})
                    console.log(err)
                  }else {
                    res.status(200).json({success:true, msg:'data modified', data: data})
                  }
                })
              } else {
                res.status(200).json({
                  success: false,
                  msg: "You are not allowed to edit this user"
                })
              }
            } else {
              res.status(200).json({
                success: false,
                msg: "No user found"
              })
            }
          } 
        });
      });

router.route('/api/crm/delete')
      .post((req,res) => {
        let id = res.locals.id
        // $or: [{ merchant_id:id },{ _id:req.body.id }]
        CrmModel.findById(req.body.id, function(err, crm) {
          if(err) {
            res.status(200).json({success: false,err: err})
            // console.log(err);
          } else {
            if(crm) {
              if(crm.merchant_Id == id) {
                crm.deleted = 1;
                crm.save(function(err, data) {
                  if(err){
                    // res.status(200).json({err:true, msg:'error'})
                    console.log(err)
                  }else {
                    res.status(200).json({success:true, msg:'user deactivated', data: data})
                  }
                });
              } else {
                res.status(200).json({
                  success: false,
                  msg: "You are not allowed to delete this user"
                })
              }
            } else {
              res.status(200).json({
                success: false,
                msg: "No user found"
              })
            }
          }
        });
      });


module.exports = router;