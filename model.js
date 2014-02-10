var config = require('konphyg')(__dirname + '/config');
var mongoConfig = config('mongo');

/*
* Connexion a la base de données
*/
var mongoose = require('mongoose');

var connect = function(callback){
	mongoose.connect('mongodb://'+mongoConfig.username+':'+mongoConfig.password+'@'+mongoConfig.url+':'+mongoConfig.port+'/'+mongoConfig.dbname);
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, "Connection error"));
	db.once('open', function(){
		callback();
	});
}

var Schema = mongoose.Schema;

/*
 * Playlists
 */
var playlistSchema = new Schema({
	name : String,
	difficulty : Number
});
/*
 * Songs
 */
var songSchema = new Schema({
	title : String,
	cover : String,
	artist : String,
	playlists : [],
});
songSchema.statics.findByPlaylistId = function(plId, callback){
	return this.find({playlists : plId}, callback);
}
songSchema.statics.findNotInPlaylist = function(plId, callback){
	return this.find({playlists : { $ne : plId}}, callback);
}
songSchema.statics.removePlaylist = function(plId, callback){
	return this.update(
				{playlists : plId},
				{$pop : {playlists : plId}},
				{multi : true},
				callback
			);
}
songSchema.statics.addPlaylistTo = function(songArray, plId, callback){
	return this.update(
				{_id : { '$in' : songArray}},
				{$push : {playlists : plId}},
				{multi : true},
				callback
			);
}
/*
 * Adjectifs
 */
var adjectifSchema = new Schema({
	base : String,
	feminin : String,
	random : {type : Number, index : true}
});

var Playlist = mongoose.model('Playlist', playlistSchema);
var Song = mongoose.model('Song', songSchema);
var Adjectif = mongoose.model('Adjectif', adjectifSchema);

var populateAdjectifs = function(callback){
	Adjectif.count(function(err, count){
		if(err){
			console.log(err);
		}else{
			if(count === 0){
				var adjlist = require('./data/adjectifs.json').adjectifs;
				for(var i = 0; i < adjlist.length; i++){
					var adj = new Adjectif(adjlist[i]);
					console.log(adj);
					adj.save();
				}
			}
			callback();
		}
	});
}

exports.Song = Song;
exports.Playlist = Playlist;
exports.Adjectif = Adjectif;
exports.connect = connect;
exports.populateAdjectifs = populateAdjectifs;
