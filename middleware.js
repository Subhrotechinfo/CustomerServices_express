import jsonwebtoken from 'jsonwebtoken';
import Config from './config/config';

const { secretKey } = Config;

let authenticate = (req, res, next) => {
	let token = req.headers.authorization;
	if(!token){
		res.status(200).json({err:'token missing'})
	}else {
		jsonwebtoken.verify(token, secretKey, (error, decoded) => {
			if (error) {
				res.status(200).json({error:'Invalid token'})
				// next({ error: 'token verification failed failed' });
			} else {
				const { expiredAt } = decoded;
				res.locals.id = decoded.id;
				res.locals.role = decoded.permission[0];
				console.log(decoded);
				if (expiredAt > new Date().getTime()) {
					if(decoded.permission.includes('Merchant') || decoded.permission.includes('Sales Executive')){
						//allow api app  
						// res.status(200).json({msg:'authorized'});
						next();
					}else {
						//send error for app api hits
						// next();
						res.status(200).json({error:'unauthorized request'}); 
					}

				} else {
					next({ error: 'token expired' });
				}
			}
		});	
	}
	
};

const authError = (err, req, res, next) => {
	let token = req.headers.authorization;
	if(!token){
		res.status(200).json({err:'token missing'})
	}else{
		 res.status(200);
		 next({err:err})
	}

	// res.json(err);
};

export { authenticate , authError  };







