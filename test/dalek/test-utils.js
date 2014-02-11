
var login = function(test){
	test
		.open('localhost:3000')
		.type('#gravatar', 'paul.varache@ysance.com')
		.type('#pseudo', 'Paul')
		.submit('#login-form');
	return test;
}
var adminLogin = function(test){
	return login(test)
		.open('localhost:3000/admin/song')
		.type('#login', 'paul')
		.type('#password', 'dummy')
		.submit('#adminForm');
}
var logout = function(test){
	test.open('localhost:3000/logout');
	return test;
}

exports.login = login;
exports.adminLogin = adminLogin;
exports.logout = logout;
