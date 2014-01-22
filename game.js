/*
* Definition de la classe MServer. Elle gère les utilisateurs et la playlist.
 */
var MServer = function(minPlayer, players){
	var minPlayers = minPlayers;
	var players = players;
	var status = 'waiting-users';
	var users = {};
	var currentSong = 1;
	var playlist = {
		1 : 'b4ee4fc0-7d1c-11e3-b49d-b122d042516d',
		2 : 'b4ee4fc0-7d1c-11e3-b49d-b123d042516d',
		3 : 'b4ee4fc0-7d1c-11e3-c49d-b123d042516d'};
	var songlist = {
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
	};

	for(var k in songlist){
		songlist[k].cover = songlist[k].cover == '' ? 'default.png' : songlist[k].cover;
	}

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
	this.getPlaylistArray = function(){
		var result = [];
		for(var k in playlist){
			result.push(songlist[playlist[k]]);
		}
		return result;
	};
	this.getPlaylist = function(){
		return playlist;
	}
	this.getSonglist = function(){
		return songlist;
	};
	this.getCurrentSongIndex = function(){
		return songlist[playlist[currentSong]].id
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
		return status == 'waiting-users' || Object.keys(users).length >= minPlayers;
	}
	this.checkResponse = function(response){
		var song = songlist[playlist[currentSong]].title;
		var levenshtein = require('levenshtein');
		var max = response.length > song.length ? response.length : song.length;
		var l = new levenshtein(response.toLowerCase(), song.toLowerCase());
		var success = max * 0.8;
		console.log('RESULT: '+(max - l.distance)+'/'+max);
		console.log('GOAL: '+success+'/'+max);
		return success >= (max - l.distance) ? false : true;
	}
	this.isLastSong = function(){
		return currentSong == Object.keys(songlist).length;
	}
	this.nextSong = function(){
		currentSong++;
	}
	this.getCurrentSongPosition = function(){
		return currentSong;
	}
	this.getCurrentSong = function(){
		return songlist[playlist[currentSong]];
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