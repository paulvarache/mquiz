var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var playlistSchema = new Schema({
	name : String,
	difficulty : Number
});
var songSchema = new Schema({
	title : String,
	cover : String,
	artist : String,
	playlists : [],
});
var adjectifSchema = new Schema({
	base : String,
	feminin : String,
	rand : {type : Number, index : true}
});

var Playlist = mongoose.model('Playlist', playlistSchema);
var Song = mongoose.model('Song', songSchema);
var Adjectif = mongoose.model('Adjectif', adjectifSchema);

exports.Song = Song;
exports.Playlist = Playlist;
exports.Adjectif = Adjectif;