var GameIO = function(salons, users, httpServer){
	//Getting io object
	var io = require('socket.io').listen(httpServer);

	io.sockets.on('connection', function(socket){
		var me, salon;
		socket.on('login', function(data){
			me = users[data.userid];
			salon = salons[data.salonid];
			delete users[data.userid];
			var emitNewUsr = function(){
				var salonUsers = salon.getUsers();
				for(var k in salonUsers){
					socket.emit('newusr', salonUsers[k]);
				}
				io.sockets.emit('newusr', me);
				socket.emit('logged', me.id, salon.getStartPositions());
				salon.addUser(me);
			}
			if(salon.checkDuplicateName(me)){
				salon.changeName(me, emitNewUsr);
			}else{
				emitNewUsr();
			}
		});
		socket.on('message', function(obj){
			io.sockets.emit('message', me, obj.message);
		});
		socket.on('disconnect', function(){
			if(!me) return;
			users[me.id] = me;
			salon.removeUser(me);
			io.sockets.emit('disusr', me.id);
			if(!salon.hasEnoughPlayers()
				&& (salon.getStatus() !== 'waiting-users' && salon.getStatus() !== 'scores')){
				io.sockets.emit('not-enough-players');
			}
			if(salon.getConnectedUsers() === 0 && salon.getType() !== 'native'){
				delete salon;
				delete salons[salon.getId()];
			}
		});
		socket.on('ready', function(){
			me.ready = true;
			if(salon.allUsersReady()){
				nextSong(true, salon);
			}
		});
		socket.on('stop', function(data){
			// Premier appel de STOP, le serveur est au statut 'playing'. On change le statut en 'waiting-answer'
			// et on emmet le signal stop a tous les utilisateurs.
			if(salon.getStatus != 'waiting-answer'){
				salon.setStatus('waiting-answer');
				io.sockets.emit('stop', me);
			}

			// Si on a une réponse, on la vérifie, sinon on attends la suite.
			// Lorsque la chanson est trouvée, soit c'est la fin de la partie, soit on passe a la suivante.
			if(data.response != ''){
				if(salon.checkResponse(data.response)){
					me.points++;
					me.founds += salon.getCurrentSong().title;
					me.founds += '<br/>';
					clearInterval(salon.getInterval());
					io.sockets.emit('winner', me);
					if(salon.isLastSong()){
						gameEnd(salon);
					}else{
						nextSong(false, salon);
					}
				}else{
					socket.emit('wrong');
				}
			}
		});

		socket.on('end-response', function(salonid){
			if(salon.getStatus() === 'waiting-answer'){
				io.sockets.emit('continue');
				salon.setStatus('playing');
				socket.emit('penalite');
			}
		});

		socket.on('replay', function(){
			me.ready = false;
			salon.reinit();
		})

	});

	function autoNext(salon){
		io.sockets.emit('winner', {pseudo : "personne"});
		if(salon.isLastSong()){
			gameEnd(salon);
		}else{
			nextSong(false, salon);
		}
	}

	function nextSong(first, salon){
		first = typeof first !== 'undefined' ? first : false;
		salon.setStatus('next-song');
		if(!first) salon.nextSong();
		io.sockets.emit('next-song');
		setTimeout(function(){
			io.sockets.emit('play', salon.getCurrentSongIndex());
			salon.setStatus('playing');
			salon.setInterval(setInterval(function(){
				autoNext(salon);
			}, 60000));
		}, 5000);
	}

	function gameEnd(salon){
		io.sockets.emit('game-end');
		salon.setStatus('scores');
	}
}

exports.GameIO = GameIO;