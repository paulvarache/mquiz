var config = require('konphyg')(__dirname + '/config');
var mongoConfig = config('mongo');

/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var uuid = require('uuid');
var game = require('./game');
var knox = require('knox');
var authorize = require('./authorize');
var Adjectif = require('./model').Adjectif;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.engine('hjs', require('hogan-express'));
app.set('layout', 'base');
app.set('partials', {playlist : "partials/playlist"});
app.use(express.logger('dev'));
app.use(express.bodyParser({uploadDir : 'tmp'}));
app.use(express.favicon());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret : "BLAHBLAH"}));
app.use(authorize());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.post('/', routes.indexPost);
app.get('/logout', routes.logout);
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

var adjectif = require('./adjectif');
adjectif.populate();

var httpServer = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/*
* Connexion a la base de données
*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://'+mongoConfig.username+':'+mongoConfig.password+'@'+mongoConfig.url+':'+mongoConfig.port+'/'+mongoConfig.dbname);
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
	app.locals.Salon = game.Salon;
	app.locals.knox = knox;

	Playlist.find().exec(function(err, docs){

		for(var i=0; i<docs.length; i++){
			//Salon exemple
			var salon = new game.Salon(docs[i].name, 'native', 2, docs[i].id, 5);
			salons[salon.getId()] = salon;
		}

		var io = require('./gameio');
		var gameio = new io.GameIO(salons, users, httpServer);
	});

});