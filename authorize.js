//These pathes will be excluded (mainly scripts and css to avoid redirect)
var exclude = ['javascripts', 'stylesheets', 'images'];

/*
 * Authorization middleware. Check if the user if connected. If not, he will be redirected to /
 */
module.exports = function(){
	return function(req, res, next){
		var elems = req.url.split('/');
		if(exclude.indexOf(elems[1]) !== -1){
			next();
		}else{
			if(req.url === '/' && typeof req.session.user !== 'undefined'){
				res.redirect('/salons');
			}else if(req.url !== '/' && typeof req.session.user === 'undefined'){
				res.redirect('/');
			}else{
				next();
			}
		}
	}
}