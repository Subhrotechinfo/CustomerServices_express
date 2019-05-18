var express = require('express');
var ServiceRouter = express.Router();
var Service = require('../model/service');
var SubService = require('../model/subService');
var ObjectID = require('mongodb').ObjectID;

ServiceRouter.route('/api/servicelist').get((req, res) => {
    var arr = [];
    Service.find({}, function (err, data) {
        if (err) {
            res.status(200).json({
                success: false,
                err: err
            })
        } else {
            if (data.length > 0) {
                var subserve_promieses = [];
                data.forEach(serv => {
                    subserve_promieses.push(new Promise(function(resolve, reject) {
                        var id = serv._id
                        SubService.find({service: id.toString()}, function(err, subServ) {
                        if(err) {
                            reject(err);
                        } else {
                            serv = serv.toObject();
                            serv.subServices = subServ;
                            arr.push(serv)
                            resolve();
                            
                        }
                    })     
                    }))
                });
                Promise.all(subserve_promieses).then(function() {
                    res.status(200).json({
                        success: true,
                        data: arr
                    })
                }).catch(function(err) {
                    res.status(200).json({
                        success: false,
                        err: err
                    })
                })
            } else {
                res.status(200).json({
                    success: false,
                    err: "No service found"
                })
            }
        }
    })
});

ServiceRouter.route('/api/service/:id').get((req, res) => {
    var id = req.params.id;
    var data = {};

    findService()
        .then(findSubServices)
        .then(() => {
            res.status(200).json({
                success: true,
                data: data
            })
        }).catch((err) => {
            res.status(200).json({
                success: false,
                err: err
            })
        })

    function findService() {
        return new Promise((resolve, reject) => {
            Service.findById(id, function (err, service) {
                if (err) {
                    reject(err);
                } else {
                    if (service) {
                        data.service = service;
                        resolve();
                    } else {
                        reject("No service found with this id");
                    }
                }
            })
        })
    }

    function findSubServices() {
        return new Promise((resolve, reject) => {
            var object_id = new ObjectID(id);
            SubService.find({
                service: object_id
            }, function (err, subService) {
                if (err) {
                    reject(err);
                } else {
                    if (data.length > 0) {
                        data.subServices = subService;
                        resolve()
                    } else {
                        console.log("No sub service found");
                        resolve();
                    }
                }
            })
        })
    }
})
module.exports = ServiceRouter;