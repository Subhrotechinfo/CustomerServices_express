import Config from '../config/config';
import { request } from 'http';
var mongoose = require('mongoose');
var express = require('express');
var jsonwebtoken = require('jsonwebtoken');
var router = express.Router();
var User = require("../model/user");
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
let Prepaid = require('./../model/Prepaid');
let check = require('./../lib/checkLib');
let CrmModel = require('./../model/crm');
let async = require('async');
let nodemailer = require('nodemailer');

const { port, secretKey, expiredAfter } = Config;

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'biznezupaay@gmail.com',
    pass: 'upaaybiznez@123$'
  }
});
/************REGISTER API************************* */
router.post('/api/signup', function (req, res) {
  console.log(req.body, "this is signup body");
  if (!req.body.name || !req.body.password || !req.body.email) {
    res.status(200).json({ success: false, msg: 'Please enter email,name and password.' });
  } else {
    console.log(req.body);
    var code;
    if(req.body.permission.includes('Sales Executive') || req.body.permission.includes('Merchant')) {
      code = crypto.randomBytes(7).toString('hex');
    }
    var newUser = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: parseInt(req.body.mobile),
      company: req.body.company,
      business_nature: req.body.business_nature,
      business_type: req.body.business_type,
      desc: req.body.desc,
      password: req.body.password,
      permission: req.body.permission,
      ref_code: code,
      signup_by: req.body.signup_by,
      status:req.body.status,
      created: new Date().getTime(),
      deleted: req.body.deleted
    });
    // save the user
    newUser.save(function (err, user) {
      if (err) {

        if (err.code === 11000) {
          console.log("test");
          return res.status(200).json({ success: false, err: 'User already exist!.' });
        } else {
          console.log('err', err);
          return res.status(200).json({ success: false, err: err });
        }
      } else {
        var data = user;
        delete data.password;
        var token = jsonwebtoken.sign(
          {
            expiredAt: new Date().getTime() + expiredAfter,
            email: user.email,
            mobile:user.mobile,
            id: user._id,
            permission: user.permission
          },
          secretKey
        );
        res.status(200).json({ success: true, msg: req.body.name + ' created successfully.', data: data, token: token });

        if(req.body.signup_by) {
          User.findOne({ref_code: req.body.signup_by}, function(err, data) {
            if(err) {
              console.log(err)
            } else {
              if(data) {
                data.ref_bonus = data.ref_bonus + 100;
                data.save(function(err) {
                  if(err) {
                    console.log(err)
                  } else {
                    console.log("Successfully incresed ref bonus")
                  }
                })
              } else {
                console.log("No user found")
              }
            }
          })
        }
      }
    });
  }
});

/**************END REGISTER API*************/

/**************LOGIN API********************/

router.post('/api/login', (req, res) => {
  const response = {}; 
  const update_login_date = {};
  update_login_date.login_date = new Date().getTime();
  var query = {};
  query.deleted = 0
  if(req.body.username.includes('@')) {
    query.email =  req.body.username
  } else {
    query.mobile = req.body.username
  };
  console.log(query, "this is query");
  User.findOne(query, function (err, user) {
    console.log('login hit',user)
    if (err) {
      // console.log(err);
      response.err = 'Internal Server Error.';
      response.success = false;
      res.status(200).json(response);
      //  res.status(500).send({success: false, msg: 'Internal Server Error.'});
    }
    if (!user) {
      response.error = 'Authentication failed. User not found.';
      response.success = false;
      res.status(200).json(response);
      // res.status(200).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      console.log(user);
      user.comparePassword(req.body.password, function (err, isMatch) {
        // console.log(isMatch);
        if (isMatch && !err) {
          // if user is found and password is right create a token
          response.token = jsonwebtoken.sign(
            {
              expiredAt: new Date().getTime() + expiredAfter,
              email: user.email,
              mobile:user.mobile,
              id: user._id,
              permission:user.permission
            },
            secretKey
          );

          User.findByIdAndUpdate(user._id, update_login_date, function (err, post) {
            if (err) {
              response.error = 'Authentication failed. Wrong creditinals.' + err;
              response.success = false;
              res.status(200).json(response);
            } else {
              // console.log(post.permission)
              if((req.body.app &&  req.body.app == 1)  && (post.permission.includes('Merchant') || post.permission.includes('Sales Executive'))){
                response.success = true;
                response.msg = `Logged in as ${post.permission}.`;
                response.data = {
                  name:post.name ? post.name : '',
                  mobile:post.mobile ? post.mobile : '',
                  email:post.email ? post.email : '',
                  _id:post.id ? post.id : '',
                  permission: post.permission ? post.permission : '' ,
                  ref_code: post.ref_code ? post.ref_code : ''
                }
                res.status(200).json(response)
              }else{
                response.success = true;
                response.msg = `Logged in as Admin`;
                res.status(200).json(response);
              } 
            }
          });

          // var token = jwt.sign(user, config.secret);
          // return the information including token as JSON
          // res.json({success: true, token:token});
        } else {
          response.error = 'Authentication failed. Wrong creditinals.';
          response.success = false;
          res.status(200).json(response);
        }
      });
    }

  });

});
/**************END LOGIN API****************/

/************* USER LIST API****************/
router.get('/api/userlist', function (req, res) {
  /*********Search Query build ************/
  var finalData = [];
  var dbquery = {};
  if (req.query.name) {
    dbquery.name = new RegExp(req.query.name, "i");
  }
  if (req.query.email) {
    dbquery.email = new RegExp(req.query.email, "i");
  }

  if(req.query.deleted) {
    dbquery.deleted  =req.query.deleted;
  }

  if (req.query.permission) {
    var permission = req.query.permission;
    var permissionArray = permission.split(',');
    dbquery.permission = { $in: permissionArray }; //req.query.stream;
  }


  /******* pagination query started here ***********/
  var pageNo = parseInt(req.query.pageNo)  //req.query.pageNo
  var size = parseInt(req.query.per_page)  //
  var query = {}
  if (pageNo < 0 || pageNo === 0) {
    response = { success: false, message: "invalid page number, should start with 1" };
    return res.status(200).json(response)
  }
  query.skip = size * (pageNo - 1)
  query.limit = size
  console.log('query', query);

  /******* pagination query end here****************/

  /************total count query start here ********/
  // Find some documents
  User.find(dbquery, {deleted:0}).count().exec(function (err, totalCount) {
    console.log('totalCount', totalCount);
    if (err) {
      res.json({ success: false, result: "Error fetching data" });
    }
    User.find(dbquery, { name: 1, email: 1, _id: 1, deleted: 1, created: 1, permission: 1, login_date: 1, ref_code: 1 })
      .sort({ created: -1 }).skip(query.skip).limit(query.limit)
      .exec(function (err, userInformation) {
        if (err) {
          res.status(200).json({ success: false, result: 'error' });
        }
        else {
          var user_promises = [];
          userInformation.forEach(function(element) {
              user_promises.push(new Promise(function(resolve, reject) {
                var elem = element.toObject();
                if(elem.ref_code) {
                  var code = elem.ref_code;
                  User.find({signup_by: code}).count().exec(function(err, userCount) {
                    if(err) {
                      console.log(err);
                      reject(err);
                    } else {
                      elem.signUps = userCount;
                      finalData.push(elem);
                      resolve();
                    }
                  })
                } else {
                  elem.signUps = 0;
                  finalData.push(elem);
                  resolve();
                }
              }))
          });
          Promise.all(user_promises).then(function() {
            res.status(200).json({ success: true, result: finalData, totalRecCount: totalCount });
          }).catch(function(err) {
            res.status(200).json({ success: false, err: err });
          })
        }
      });


  });

});
/************** END OF USER LIST API*************/
/************** START USER UPDATE API************/
router.put('/api/updateUser/:id', function (req, res, next) {
  console.log(req.params.id);
  console.log(req.body);

  //  console.log('After generate password');
  //  console.log(req.body);
  /*********** password set ******************/
  if (req.body.password) {
    //console.log('req.body.password',req.body.password);
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(req.body.password, salt, null, function (err, hash) {
        //console.log('hash',hash);
        if (err) {
          //return cb(err);
          res.status(200).json({ success: false, msg: "Someting wrong." });
        }
        if (hash) {
          req.body.password = hash;
          //  console.log('hash',req.body.password);
          User.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
            if (err) {
              //return next(err);
              res.status(200).json({ success: false, msg: "Someting wrong." });
            }
            res.status(200).json({ success: true, msg: req.body.name + " updated successfully" });
            // res.json(post);
          });
        }
        // cb(null, hash);
      });
    });

  } else {
    // res.json('test');
    User.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
      if (err) {
        return next(err);
      }
      res.json({ success: true, msg: req.body.name + " updated successfully" });
      // res.json(post);
    });
  } // else end
});
/***************** END USER UPDATE API *************/
/************** START USER FETCH BY ID API************/
router.route("/api/user/id/:id")
  .get(function (req, res) {
    var response = {};
    User.findById(req.params.id,{deleted:0} ,function (err, data) {
      // This will run Mongo Query to fetch data based on ID.
      if (err) {
        response = { "success": false, "message": "Error fetching data" };
        res.status(200).json(response)
      } else {
        response = { "success": true, "result": data };
        res.status(200).json(response);
      }
    });
  })
/***************** END USER FETCH BY ID API *************/
/************************** validate user email ***************/
router.route('/api/user/validate').get(function (req, res) {
  /************unique check *********/
  var dbbuildQuery = {};

  if (req.query.email) {
    dbbuildQuery.email = req.query.email;
  }
  User.find(dbbuildQuery).count().exec(function (err, totalCount) {
    if (err) {
      res.status(200).send("unable to save to database" + err);
    }
    else {
      res.status(200).json({ success: true, result: totalCount });
    }


  });
});

router.route('/api/user/signup/:id').get(function(req, res) {


  var dbquery = {
    signup_by: req.params.id
  }
console.log(req.query, "this is query")
  /******* pagination query started here ***********/
  var pageNo = parseInt(req.query.pageNo)  //req.query.pageNo
  var size = 10  //
  if (pageNo < 0 || pageNo === 0) {
    response = { success: false, message: "invalid page number, should start with 1" };
    return res.status(200).json(response)
  }
  var query = {}
  query.skip = req.query.pageNo ? size * (pageNo - 1) : 0;
  query.limit = req.query.pageNo ? size : ''
  User.find(dbquery).count().exec(function(err, count) {
    if(err) {
      res.status(200).json({
        success: false,
        err: err
      })
    } else {
      User.find(dbquery).sort({created: -1}).skip(query.skip).limit(query.limit).exec(function(err, data) {
        if(err) {
          res.status(200).json({
            success: false,
            err: err
          })
        } else {
          if(data.length > 0) {
            console.log(data, "this is data");
            res.status(200).json({
              success: true,
              data: data,
              count: count
            })
          } else {
            res.status(200).json({
              success: true,
              data: [],
              msg: "no User found"
            })
          }
        }
      });
    }
  })
})

router.route('/api/forgot').post(function (req, res) {
  var usermail = req.body.email;
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({
        email: usermail
      }, function (err, user) {
        if (!user) {
          res.status(200).json({
            success: false,
            err: "No user found with this email"
          })
        } else {
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        }
      });
    },
    function (token, user, done) {
      var message = {
        to: user.email,
        subject: 'BiznezUpaay Password Reset',
        html: `<body class="body" style="background-color:#ebebeb; background-repeat:no-repeat repeat-y; background-position:center 0; padding:0 !important; margin:0 !important; display:block !important; min-width:100% !important; width:100% !important; background:#ebebeb; -webkit-text-size-adjust:none">
        <table width="100%" border="0" cellspacing="0" cellpadding="0"  align="center" style="background-color:#ebebeb;" class="mobile-mobile">
          <tr>
            <td  align="center" valign="top" style="">
              
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table width="650" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
                      <tr>
                        <td>
                          
      
                          <!-- Section 1 -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="40" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
                            <tr>
                              <td class="section" style="padding:30px 250px 30px 250px; text-align:center">
                                <div class="fluid-img" style="font-size:0pt; line-height:0pt; text-align:left"><img src="cid:logo" border="0" width="150" height="57" alt="" /></div>
                              </td>
                            </tr>
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="3" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
      
                          <!-- END Section 1 -->
                          
                          <!-- Section 2 -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
                            <tr>
                              <td class="section" style="padding:40px 25px 5px 25px;font-size:13px;color:#000000;">
                                <b style="font-size:18px;color:#000000;">${user.name}</b><br/><br/>
                                There was recently a request to change the password for your account.<br/><br/>
      
                                                          If you requested this password change, please reset your password here:
                                
                              </td>
                            </tr>
                            
                            <tr>
                              <td class="text-button2 section" style="color:#613b51; font-family:Arial,sans-serif, 'Roboto'; font-size:14px; line-height:22px; text-align:center; padding:10px 25px 10px 25px">
                                <br/>
                                <a href="http://localhost:3000/resetpassword/${token}" target="_blank" class="link3" style="color:#ffffff; text-decoration:none;background:#3696c2;padding:10px 15px 10px 15px;"><span class="link3" style="color:#ffffff; text-decoration:none">Click Here to Reset Password</span></a>
                                <br/><br/>
                              </td>
                            </tr>
                            <tr>
                              <td class="section" style="padding:5px 25px 40px 25px;font-size:13px;color:#000000;">
                                If you did not make this request, you can ignore this message and your password will remain the same.
                                
                              </td>
                            </tr>
                            
                            
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="10" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
      
                          <!-- END Section 2 -->
                          
                          
                          <!-- Section 3 -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" >
                            <tr>
                              <td class="section" style="padding:40px 25px 40px 25px; text-align:center; color:#007bdb;font-size:16px;" >
                                Thank you, BiznezUpaay !
                              </td>
                            </tr>
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="10" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
      
                          <!-- END Section 3 -->
      
                          
                        </td>
                      </tr>
                    </table>	
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
        </table>
      </body>`,
      attachments: [{
        filename: 'newlogo.png',
        path: __dirname + '/newlogo.png',
        cid: 'logo' //same cid value as in the html img src
      }]
      };

      transporter.sendMail(message, function (error) {
        if (error) {
          console.log(error);
          res.status(200).json({
            success: true,
            msg: "Mail Sent. Please check your mail to reset password"
          });
        } else {
          console.log("mail sent");
          res.status(200).json({
            success: true,
            msg: "Mail Sent. Please check your mail to reset password"
          });
        }
      });
    }
  ], function (err) {
    if (err) {
      console.log(err);
      res.status(401).json({
        error: ["Internal server error"]
      })
    }
  });
})

router.route('/api/reset').post(function (req, res) {
  var password = req.body.password;
  var token = req.body.token;
  console.log(password, token)
  async.waterfall([
    function (done) {
      User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, user) {
        if (!user) {
          return res.status(401).json({
            error: ["User not found"]
          });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function (err) {
          done(err, user);
        });
      });
    },
    function (user, done) {
      var message = {
        to: user.email,
        subject: 'BiznezUpaay Password Updated',
        html: `<body class="body" style="background-color:#ebebeb; background-repeat:no-repeat repeat-y; background-position:center 0; padding:0 !important; margin:0 !important; display:block !important; min-width:100% !important; width:100% !important; background:#ebebeb; -webkit-text-size-adjust:none">
        <table width="100%" border="0" cellspacing="0" cellpadding="0"  align="center" style="background-color:#ebebeb;" class="mobile-mobile">
          <tr>
            <td  align="center" valign="top" style="">
              
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table width="650" border="0" cellspacing="0" cellpadding="0" class="mobile-shell">
                      <tr>
                        <td>
                          
      
                          <!-- Section 1 -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="40" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
                            <tr>
                              <td class="section" style="padding:30px 250px 30px 250px; text-align:center">
                                <div class="fluid-img" style="font-size:0pt; line-height:0pt; text-align:left"><image src="newlogo.png" border="0" width="150" height="60" alt="" /></div>
                              </td>
                            </tr>
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="3" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
      
                          <!-- END Section 1 -->
                          
                          <!-- Section 2 -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
                            <tr>
                              <td class="section" style="padding:40px 25px 5px 25px;font-size:13px;color:#000000;">
                                <b style="font-size:18px;color:#000000;">${user.name}</b><br/><br/>
                                Your password has been changed successfully. <br/><br/>
      
                                                          
                                
                              </td>
                            </tr>
                            
                            <tr>
                              <td class="section" style="padding:5px 25px 40px 25px;font-size:13px;color:#000000;">
                                Your new password is ${password}
                                
                              </td>
                            </tr>
                            
                            
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="10" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
      
                          <!-- END Section 2 -->
                          
                          
                          <!-- Section 3 -->
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" >
                            <tr>
                              <td class="section" style="padding:40px 25px 40px 25px; text-align:center; color:#007bdb;font-size:16px;" >
                                Thank you, BiznezUpaay !
                              </td>
                            </tr>
                          </table>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%"><tr><td height="10" class="spacer" style="font-size:0pt; line-height:0pt; text-align:center; width:100%; min-width:100%">&nbsp;</td></tr></table>
      
                          <!-- END Section 3 -->
      
                          
                        </td>
                      </tr>
                    </table>	
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
        </table>
      </body>
        `,
        attachments: [{
          filename: 'newlogo.png',
          path: __dirname + '/newlogo.png',
          cid: 'logo' //same cid value as in the html img src
        }]
      };

      transporter.sendMail(message, function (error) {
        if (error) {
          console.log(error);
          res.status(200).json({
            success: true,
            msg: "Password successfully updated"
          });
        } else {
          console.log("mail sent");
          res.status(200).json({
            success: true,
            msg: "Password successfully updated"
          });
        }
      });
    }
  ], function (err) {
    res.status(401).json({
      error: ["Failed to update password, please contact administrator if this issue persist"]
    })
  });
})

router.route('/api/user/incentive').get(function(req, res) {
  var id = res.locals.id;
  User.findById(id, function(err, user) {
    if(err) {
      res.status(200).json({
        success: false,
        err: err
      })
    } else {
      if(user) {
        res.status(200).json({
          success: true,
          data: user.ref_bonus
        })
      } else {
        res.status(200).json({
          success: true,
          msg: "No user found"
        })
      }
    }
    })
})

router.route('/api/otp').post(function(req, res) {
  console.log("otp called", req.body.mobile);
  var mobile = req.body.mobile;
  var url = `http://103.247.98.91/API/SendMsg.aspx?uname=20190444&pass=929a99ZH&send=BIZUPY&dest=${mobile}&msg=hi`;
  request(url, function(err, response) {
    if(err) {
      console.log(err);
    } else {
      if(response) {
        console.log(response, "this is response");
      } else {
        console.log("no response found");
      }
    }
  })
})
module.exports = router;


