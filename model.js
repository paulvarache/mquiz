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
	playlists : []
});

var Playlist = mongoose.model('Playlist', playlistSchema);
var Song = mongoose.model('Song', songSchema);

exports.Song = Song;
exports.Playlist = Playlist;