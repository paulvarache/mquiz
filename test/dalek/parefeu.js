var utils = require('./test-utils');
module.exports = {
	'Pare-feu de connexion' : function(test){
		test
			.open('localhost:3000/salons')
			.assert.exists('#login-form')
			.done();
	},
	'Pare-feu administrateur' : function(test){
		utils.login(test)
			.assert.exists('#add-salon')
			.open('localhost:3000/admin/playlists')
			.assert.exists('#adminLogin')
			.done();
	}
};