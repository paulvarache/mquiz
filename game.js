/*
* Definition de la classe MServer. Elle gère les utilisateurs et la playlist.
 */
var MServer = function(minPlayers, players, playlistId){
	var minPlayers = minPlayers;
	var players = players;
	var status = 'waiting-users';
	var users = {};
	var currentSong = 1;
	/*var songlist = {
		'b4ee4fc0-7d1c-11e3-b49d-b122d042516d' : {
			id : 'b4ee4fc0-7d1c-11e3-b49d-b122d042516d', 
			song : '01.mp3', 
			title : 'Luigi\'s Ballad',
			artist : 'StarBomb',
			cover : '01.jpg',
			year : '2013'
		},
		'b4ee4fc0-7d1c-11e3-b49d-b123d042516d' : {
			id : 'b4ee4fc0-7d1c-11e3-b49d-b123d042516d', 
			song : '02.mp3', 
			title : 'Othersides',
			artist : 'Macklemore feat. Ryan Lewis',
			cover : '02.jpg',
			year : '2010'
		},
		'b4ee4fc0-7d1c-11e3-c49d-b123d042516d' : {
			id : 'b4ee4fc0-7d1c-11e3-c49d-b123d042516d', 
			song : '03.mp3', 
			title : 'Panic Station (Madeon Remix)',
			artist : 'Madeon',
			cover : '',
			year : '2013'
		},
	};*/

	var mongoose = require('mongoose');
	mongoose.connect('mongodb://localhost/mquiz');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, "Connection error"));
	db.once('open', function(){
		var Schema = mongoose.Schema;

		var songSchema = new Schema({song : String, title : String, cover : String, artist : String, year : Number});

		var Song = mongoose.model('Song', songSchema);

		var testSong = new Song({song : "01.mp3", title : "fjdif", cover : "fgjigs", artist : "gdhsi", year : 2013});

		Song.find({}).where("song").equals("01.mp3").exec(function(err, doc){
			
		});
	});

	this.getMinPlayers = function(){
		return minPlayers;
	};
	this.getStatus = function(){
		return status;
	};
	this.setStatus = function(newStatus){
		status = newStatus;
	}
	this.getUsers = function(){
		return users;
	};
	this.getSonglist = function(){
		return songlist;
	};
	this.getCurrentSongIndex = function(){
		return songlist[currentSong].id
	};
	this.addUser = function(user){
		users[user.id] = user;
	}
	this.removeUser = function(user){
		delete users[user.id];
	}
	this.getUser = function(index){
		return users[index];
	}
	this.allUsersReady = function(){
		if(Object.keys(users).length < players) return false;
		for(var k in users){
			if(users[k].ready != true) return false;
		}
		return true;
	}
	/*
	* Find out if there is enough players to continue the game
	 */
	this.hasEnoughPlayers = function(){
		return (status !== 'waiting-users' && this.getUsersArray().length >= minPlayers);
	}
	this.checkResponse = function(response){
		var song = songlist[currentSong].title;
		var levenshtein = require('levenshtein');
		var max = response.length > song.length ? response.length : song.length;
		var l = new levenshtein(response.toLowerCase(), song.toLowerCase());
		var success = max * 0.8;
		console.log('RESULT: '+(max - l.distance)+'/'+max);
		console.log('GOAL: '+success+'/'+max);
		return success >= (max - l.distance) ? false : true;
	}
	this.isLastSong = function(){
		return currentSong === songlist.length - 1;
	}
	this.nextSong = function(){
		currentSong++;
	}
	this.getCurrentSongPosition = function(){
		return currentSong;
	}
	this.getCurrentSong = function(){
		return songlist[currentSong];
	}
	this.getUsersArray = function(){
		return this.hashToArray(users);
	}
	this.hashToArray = function(hash){
		var result = []
		for(k in hash){
			result.push(hash[k]);
		}
		return result;
	}
};

exports.MServer = MServer;