Array.prototype.shuffle = function(){
	var i = this.length, shuffle = [];
	for(;i>0;i--){
		var j = Math.floor(Math.random() * (i - 1));
		shuffle.push(this[j]);
		this.splice(j, 1);
	}
	return shuffle;
}

/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var uuid = require('uuid');
var crypto = require('crypto');
var game = require('./game');
var knox = require('knox');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.engine('hjs', require('hogan-express'));
app.set('layout', 'base');
app.set('partials', {playlist : "partials/playlist"});
app.use(express.bodyParser({uploadDir : 'tmp'}));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.limit('15mb'));
app.use(express.cookieParser());
app.use(express.session({secret : "BLAHBLAH"}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.post('/', routes.indexPost);
app.get('/play/user/:uid/salon/:salonid', routes.users);
app.get('/songlist/:salonid', routes.songlist);
app.get('/songdetails/:songid', routes.songdetails);
app.get('/scores/:salonid', routes.scores);
app.get('/playlists', routes.playlists);
app.post('/playlists', routes.playlistsPost);
app.get('/playlist/delete/:plId', routes.playlistDelete);
app.get('/songs/:plId', routes.songs);
app.post('/songs/:plId', routes.songsPost);
app.get('/song', routes.song);
app.post('/song', routes.songPost);
app.get('/salons', routes.salons);
app.post('/salons', routes.salonsPost);
app.get('/play/:salonid', routes.play);
app.get('/checkPasswd/:salonid/:password', routes.checkPasswd);

var httpServer = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/*
* Connexion a la base de données
*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://mquizapp:3103dlccab@ds029979.mongolab.com:29979/heroku_app21788699');
var db = mongoose.connection;

db.on('error', console.error.bind(console, "Connection error"));
db.once('open', function(){

	var model = require('./model');
	var Song = model.Song;
	var Playlist = model.Playlist;

	app.locals.Song = Song;
	app.locals.Playlist = Playlist;

	var salons = {};
	var users = {};

	app.locals.salons = salons;
	app.locals.users = users;
	app.locals.MServer = game.MServer;
	app.locals.knox = knox;

	Playlist.find().exec(function(err, docs){

		for(var i=0; i<docs.length; i++){
			//Salon exemple
			var mServer = new game.MServer(docs[i].name, 'native', 2, docs[i].id, 5);

			salons[mServer.getId()] = mServer;
		}

		var io = require('./gameio');
		var gameio = new io.GameIO(salons, users, httpServer);
	});

});