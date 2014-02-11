var utils = require('./test-utils');
module.exports = {
	'Connect' : function(test){
		utils.adminLogin(test).done();
	},
	'Artiste et titre non répertorié' : function(test){
		test
			.open('localhost:3000/admin/song')
			.click('#song-add')
			.wait(100)
			.type('#artist', 'Raxacoricofalapatorius')
			.wait(1000)
			.click('#next')
			.wait(1000)
			.type('#customTitle', 'Vale Decem')
			.wait(1000)
			.click('#next')
			.wait(2000)
			.assert.text('#track-name', 'Vale Decem', 'Titre OK')
			.assert.text('#artist-name', 'Raxacoricofalapatorius', 'Artiste OK')
			.done();
	},
	'Seul le titre n\'est pas répertorié' : function(test){
		test
			.open('localhost:3000/admin/song')
			.click('#song-add')
			.wait(500)
			.type('#artist', 'muse')
			.wait(500)
			.click('#next')
			.wait(1000)
			.assert.numberOfElements('#title option').is.between([1, 50], 'Les top tracks on été chargées')
			.type('#customTitle', 'the gallery')
			.wait(1000)
			.click('#next')
			.wait(1000)
			.assert.text('#track-name', 'The Gallery', 'Titre OK')
			.assert.text('#artist-name', 'Muse', 'Artiste OK')
			.done();
	}
}