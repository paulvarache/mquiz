/*
* Definition de la classe MServer. Elle gère les utilisateurs et la playlist.
 */
var MServer = function(name, players, songlistId){
	var uuid = require('uuid');
	var model = require('./model');
	var Song = model.Song;
	var Playlist = model.Playlist;
	var id = uuid.v1();
	var name = name;
	var players = players;
	var status = 'waiting-users';
	var users = {};
	var currentSong = 0;
	var songlist = [];
	Song.find().where({playlists : songlistId}).exec(function(err, songs){
		songlist = songs.shuffle();
	});

	var interval = null;

	this.reinit = function(){
		currentSong = 0;
		Song.find().where({playlists : songlistId}).exec(function(err, songs){
			songlist = songs.shuffle();
		});
		status = 'waiting-users';
	}
	this.setInterval = function(nInterval){
		interval = nInterval;
	};
	this.getInterval = function(){
		return interval;
	}
	this.isFull = function(){
		return players === this.getConnectedUsers;
	};
	this.getConnectedUsers = function(){
		return this.getUsersArray().length;
	};
	this.getMaxUsers = function(){
		return players;
	};
	this.getId = function(){
		return id;
	};
	this.getName = function(){
		return name;
	};
	this.setSonglist = function(nSonglist){
		songlist = nSonglist;
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
		return (status !== 'waiting-users' && this.getUsersArray().length >= 2);
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