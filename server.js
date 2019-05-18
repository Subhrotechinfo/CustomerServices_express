import express from 'express';
import bodyParser from 'body-parser';
import jsonwebtoken from 'jsonwebtoken';
import cors from 'cors';
import Config from './config/config';
import Database from './config/db';
import { authenticate, authError } from './middleware';
 
var mongoose = require('mongoose');
var register = require('./routes/user');
let prepaid = require('./routes/prepaid');
let crm = require('./routes/crm');
let service_api = require('./routes/service');
let query_api = require('./routes/query');
let payment_api = require('./routes/payment')
let app = express();

//var api = require('./routes/api');

// Mongoose connection with mongodb
mongoose.Promise = require('bluebird');
mongoose.connect(Database.database)
.then(() => { // if all is ok we will be here
	console.log('Start');
  })
  .catch(err => { // if error we will be here
	  console.error('App starting error:', err.stack);
	  process.exit(1);
  });

const { port, secretKey, expiredAfter } = Config;

app.get('/', (req, res) => {
	res.json({ status: 'OK' });
});
// Use middlewares to set view engine and post json data to the server
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/api/user/', [authenticate, authError]);
app.use('/api/query/', [authenticate, authError]);
app.use('/api/crm/', [authenticate, authError]);
app.use('/', register)
app.use('/', prepaid);
app.use('/', crm);
app.use('/', service_api);
app.use('/', query_api);
app.use('/', payment_api);

// app.use('/api/prepaid',prepaid, [authenticate] );
// app.use('/api/crm', crm, [authenticate]);
// app.use('/api', service_api, [authenticate]);
// app.use('/api', query_api,[authenticate]);
// app.use('/api/userlist' , [authError]);
// app.use('/api/user/validate', [authError])

// Start the server
app.listen(port, function(){
  console.log('Server is running on Port: ',port);
});

module.exports = app;


