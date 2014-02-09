var expect = require('chai').expect;
describe('adjectif', function(){
	describe('#getName(original, gender)', function(){
		it('should return a name with an complement', function(done){
			var config = require('konphyg')(__dirname + '/../config');
			var mongoConfig = config('mongo');
			var mongoose = require('mongoose');
			mongoose.connect('mongodb://'+mongoConfig.username+':'+mongoConfig.password+'@'+mongoConfig.url+':'+mongoConfig.port+'/'+mongoConfig.dbname);
			var db = mongoose.connection;

			db.on('error', console.error.bind(console, "Connection error"));
			db.once('open', function(){
				var adjectif = require('../adjectif');
				adjectif.getName('Paul', true, function(name){
					console.log("Nom original: Paul  /  Nom généré: "+name);
					expect(name).to.not.be.equal('Paul');
					done();
				});
			});
		});
	});
});
