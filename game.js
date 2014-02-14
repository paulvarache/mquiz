function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

/*
* Definition de la classe Salon. Elle gère les utilisateurs et la playlist.
 */
var Salon = function(name, type, players, songlistId, songlistLength, password){
	var uuid = require('uuid');
	var model = require('./model');
	var Song = model.Song;
	var Playlist = model.Playlist;
	var id = uuid.v1();
	var type = type;
	var name = name;
	var players = players;
	var status = 'waiting-users';
	var users = {};
	var currentSong = 0;
	var password = password || '';
	var songlistLength = songlistLength;
	var songlist = [];
	var parent = this;
	var interval = null;
	var startPositions = {};


	this.getStartPositions = function(){
		return startPositions;
	}
	this.loadPlaylist = function(callback){
		Song.find()
		.where({playlists : songlistId})
		.exec(function(err, songs){
			songlist = shuffle(songs);
			songlist = songlist.slice(0, songlistLength);
			console.log(songlist);
			for(var i = 0; i < songlist.length; i++){
				var startPosition = 0
				if(songlist[i].duration > 60){
					var limitMax = songlist[i].duration - 60;
					startPosition = Math.floor((Math.random() * limitMax) + 1);
				}
				startPositions[songlist[i].id] = startPosition;
			}
			callback();
		});
	};
	this.changeName = function(newUsr, callback){
		var adjectif = require('./adjectif');
		adjectif.getName(newUsr.pseudo, false, function(name){
			newUsr.pseudo = name;
			callback();
		});
	}
	this.checkDuplicateName = function(newUsr){
		for(var k in users){
			if(users[k].pseudo === newUsr.pseudo){
				return true;
			}
		}
		return false;
	}
	this.newId = function(){
		id = uuid.v1();
	}
	this.getSonglistId = function(){
		return songlistId;
	}
	this.needPassword = function(){
		return !(password === '');
	}
	this.checkPasswd = function(nPassword){
		return (nPassword === password);
	}
	this.getType = function(){
		return type;
	}
	this.setInterval = function(nInterval){
		interval = nInterval;
	};
	this.getInterval = function(){
		return interval;
	}
	this.isFull = function(){
		return players === this.getConnectedUsers();
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
		var l = new levenshtein(response.toLowerCase(), song.toLowerCase().replace(/\s*\(.*?\)\s*/g, ''));
		var success = max * 0.8;
		console.log('RESULT: '+(max - l.distance)+'/'+max);
		console.log('GOAL: '+success+'/'+max);
		return success >= (max - l.distance) ? false : true;
	}
	this.isLastSong = function(){
		return currentSong === (songlistLength - 1);
	}
	this.nextSong = function(){
		console.log("CurrentSongIndex: "+currentSong+" / NextOne: ");
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

exports.Salon = Salon;