var utils = require('./test-utils.js');
module.exports = {
	'Connexion' : function(test){
		utils.login(test).done();
	}
	'Création d\'un nouveau salon' : function(test){
		test
			.open('localhost:3000/salons')
			.click("#add-salon")
			.waitForElement('#salonForm:visible')
			.type("#name", 'Skaaro')
			.click("#playlist>option:first-child")
			.submit('#salonForm')
			.assert.exists('#app')
			.assert.numberOfElements('.remSong').is(5, '5 musiques a trouver')
			.assert.numberOfElements('#songlist>div').is(5, '5 musiques dans la playlist')
			.done();
	}
}