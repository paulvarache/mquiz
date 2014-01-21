var http = require('http');
var uuid = require('node-uuid');
var crypto = require('crypto');

httpServer = http.createServer(function(req,res){
	res.end('Hello World !');
});

httpServer.listen(4242);

/*
* Definition de la classe MServer. Elle gère les utilisateurs et la playlist.
 */
var MServer = function(nbPlayers){
	var nbPlayers = nbPlayers;
	var status = 'waiting-users';
	var users = {};
	var currentSong = 1;
	var playlist = {1 : 'b4ee4fc0-7d1c-11e3-b49d-b122d042516d', 2 : 'b4ee4fc0-7d1c-11e3-b49d-b123d042516d'};
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
	};

	this.getNbPlayers = function(){
		return nbPlayers;
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
	this.getPlaylist = function(){
		return playlist;
	};
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
		if(Object.keys(users).length < nbPlayers) return false;
		for(var k in users){
			if(users[k].ready != true) return false;
		}
		return true;
	}
	/*
	* Find out if there is enough players to continue the game
	 */
	this.hasEnoughPlayers = function(){
		return status == 'waiting-users' || Object.keys(users).length >= nbPlayers;
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
};

var mServer = new MServer(2);


//Getting io object
var io = require('socket.io').listen(httpServer);

//this func checks every second if the number of players is sufficent to continue.
setInterval(function(){
	if(!mServer.hasEnoughPlayers()){
		io.sockets.emit('not-enough-player');
		mServer = new MServer(2);
	}
}, 1000);


io.sockets.on('connection', function(socket){
	var me;
	socket.on('login', function(user){
		me = user;
		me.id = uuid.v1();
		me.points = 0;
		me.founds = '';
		if(me.gravatar != ''){
			me.avatar = 'http://www.gravatar.com/avatar/'+crypto.createHash('md5').update(me.gravatar).digest('hex');
		}
		socket.emit('logged', me.id, mServer.getSonglist());
		var users = mServer.getUsers();
		for(var k in users){
			socket.emit('newusr', users[k]);
		}
		io.sockets.emit('newusr', me);
		mServer.addUser(me);
	});
	socket.on('disconnect', function(){
		if(!me) return;
		mServer.removeUser(me);
		io.sockets.emit('disusr', me.id);
	});
	socket.on('ready', function(){
		me.ready = true;
		if(mServer.allUsersReady()){
			mServer.setStatus('next-song');
			io.sockets.emit('next-song');
			setTimeout(function(){
				io.sockets.emit('play', mServer.getCurrentSongIndex());
				mServer.setStatus('playing');
			}, 5000);
		}
	});
	socket.on('stop', function(answer, user_id){
		/*
		* Premier appel de STOP, le serveur est au statut 'playing'. On change le statut en 'waiting-answer'
		* et on emmet le signal stop a tous les utilisateurs.
		 */
		if(mServer.getStatus != 'waiting-answer'){
			mServer.setStatus('waiting-answer');
			io.sockets.emit('stop', me);
		}
		/*
		* Si on a une réponse, on la vérifie, sinon on attends la suite.
		* Lorsque la chanson est trouvée, soit c'est la fin de la partie, soit on passe a la suivante.
		 */
		if(answer.response != ''){
			if(mServer.checkResponse(answer.response)){
				me.points++;
				console.log(mServer.getUsers());
				me.founds += mServer.getCurrentSong();
				io.sockets.emit('winner', me);
				mServer.setStatus('next-song');
				if(mServer.isLastSong()){
					io.sockets.emit('game-end', mServer.getUsers());
				}else{
					mServer.nextSong();
					io.sockets.emit('next-song');
					setTimeout(function(){
						io.sockets.emit('play', mServer.getCurrentSongIndex());
						}, 5000);
				}
			}
		}
	});
	socket.on('end-response', function(){
		if(mServer.getStatus() == 'waiting-answer'){
			io.sockets.emit('continue');
			mServer.setStatus('playing');
		}
	});
});