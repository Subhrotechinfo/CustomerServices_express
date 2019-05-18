var express = require('express');
var QueryRouter = express.Router();
var Service = require('../model/service');
var SubService = require('../model/subService');
var Query = require('../model/query');
var ObjectID = require('mongodb').ObjectID;

QueryRouter.route('/api/query').post((req, res) => {
    var data = req.body;
    data.query_by = res.locals.id;
    var newQuery = new Query(data);
    newQuery.save((err) => {
        if (err) {
            res.status(200).json({
                success: false,
                err: err
            })
        } else {
            res.status(200).json({
                success: true,
                msg: "Successfully saved query"
            })
        }
    })
})

QueryRouter.route('/api/query/list').get((req, res) => {
    var id = res.locals.id;
    var role = res.locals.role;
    var pageNo = parseInt(req.query.pageNo) //req.query.pageNo
    var size = 10 //
    if (pageNo < 0 || pageNo === 0) {
        response = {
            success: false,
            message: "invalid page number, should start with 1"
        };
        return res.status(200).json(response)
    }
    console.log(role, "this is role");
    var query = {};
    var dbquery = {};
    console.log(id, "this is id");
    if(role != "Admin") {
        dbquery.id = res.locals.id; 
    }
    query.skip = req.query.pageNo ? size * (pageNo - 1) : 0;
    query.limit = req.query.pageNo ? size : '';
    Query.find(dbquery).count().exec((err, count) => {
        if (err) {
            res.status(200).json({
                success: false,
                err: err
            })
        } else {
            Query.find(dbquery).skip(query.skip).limit(query.limit).populate('sub_service').exec((err, data) => {
                if (err) {
                    console.log(err);
                    res.status(200).json({
                        success: false,
                        err: err
                    })
                } else {
                    if (data.length > 0) {
                        res.status(200).json({
                            success: true,
                            data: data,
                            count: count
                        })
                    } else {
                        res.status(200).json({
                            success: true,
                            msg: "No Quaries found"
                        })
                    }
                }
            })
        }
    })
})

QueryRouter.route('/api/query/:id').get((req, res) => {
    var id = req.params.id;
    Query.findById(id, (err, data) => {
        if (err) {
            res.status(200).json({
                success: false,
                err: err
            })
        } else {
            if (data) {
                res.status(200).json({
                    success: true,
                    data: data
                })
            } else {
                res.status(200).json({
                    success: false,
                    msg: "No query found with this id"
                })
            }
        }
    })
})

module.exports = QueryRouter;