
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var uuid = require('uuid');
var crypto = require('crypto');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/user/:uid', routes.users);
app.get('/songlist', routes.songlist);
app.get('/songdetails/:songid', routes.songdetails);
app.get('/scores', routes.scores);

var httpServer = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//Getting io object
var io = require('socket.io').listen(httpServer);
var game = require('./game');
app.locals.mServer = new game.MServer(2, 4);

//this func checks every second if the number of players is sufficent to continue.
setInterval(function(){
	if(!app.locals.mServer.hasEnoughPlayers()){
		io.sockets.emit('not-enough-players');
		app.locals.mServer = new game.MServer(2, 4);
	}
}, 1000);

// Remaining time to find the answer
var restant = 60;

//countdown function that stop the game if nobody found
var remaining = function(){
	console.log(restant);
	if(restant == 0){
		clearInterval(inter);
		io.sockets.emit('winner', {pseudo : "personne"});
		if(app.locals.mServer.isLastSong()){
			io.sockets.emit('game-end');
		}else{
			nextSong();
		}
	}
	restant--;
};


io.sockets.on('connection', function(socket){
	var me;
	socket.on('login', function(user){
		me = user;
		me.id = uuid.v1();
		me.points = 0;
		me.founds = '';
		if(me.gravatar != ''){
			me.avatar = '<img src="http://www.gravatar.com/avatar/'+crypto.createHash('md5').update(me.gravatar).digest('hex')+'" />';
		}else{
			me.avatar = '<div class="default-avatar" style="background-color:'+me.avatar+'"></div>';
		}
		delete me.gravatar;
		var users = app.locals.mServer.getUsers();
		for(var k in users){
			socket.emit('newusr', users[k]);
		}
		app.locals.mServer.addUser(me);
		io.sockets.emit('newusr', me);
		socket.emit('logged', me.id);
	});
	socket.on('disconnect', function(){
		if(!me) return;
		app.locals.mServer.removeUser(me);
		io.sockets.emit('disusr', me.id);
	});
	socket.on('ready', function(){
		me.ready = true;
		if(app.locals.mServer.allUsersReady()){
			nextSong(true);
		}
	});
	socket.on('stop', function(answer, user_id){

		clearInterval(inter);

		// Premier appel de STOP, le serveur est au statut 'playing'. On change le statut en 'waiting-answer'
		// et on emmet le signal stop a tous les utilisateurs.
		if(app.locals.mServer.getStatus != 'waiting-answer'){
			app.locals.mServer.setStatus('waiting-answer');
			io.sockets.emit('stop', me);
		}

		// Si on a une réponse, on la vérifie, sinon on attends la suite.
		// Lorsque la chanson est trouvée, soit c'est la fin de la partie, soit on passe a la suivante.
		if(answer.response != ''){
			if(app.locals.mServer.checkResponse(answer.response)){
				me.points++;
				console.log(app.locals.mServer.getUsers());
				me.founds += app.locals.mServer.getCurrentSong().title;
				me.founds += '<br/>';
				clearInterval(inter);
				io.sockets.emit('winner', me);
				if(app.locals.mServer.isLastSong()){
					io.sockets.emit('game-end');
				}else{
					nextSong();
				}
			}else{
				socket.emit('wrong');
			}
		}
	});

	socket.on('end-response', function(){
		if(app.locals.mServer.getStatus() == 'waiting-answer'){
			io.sockets.emit('continue');
			app.locals.mServer.setStatus('playing');
			socket.emit('penalite');
			inter = setInterval(remaining,1000);
		}
	});
});

function nextSong(first){
	first = typeof first !== 'undefined' ? first : false;
	app.locals.mServer.setStatus('next-song');
	if(!first) app.locals.mServer.nextSong();
	io.sockets.emit('next-song');
	setTimeout(function(){
		io.sockets.emit('play', app.locals.mServer.getCurrentSongIndex());
		app.locals.mServer.setStatus('playing');
		restant = 60;
		inter = setInterval(remaining,1000);
	}, 5000);
}