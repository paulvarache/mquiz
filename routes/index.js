var hashToArray = function(hash){
	var ar = [];
	for(var k in hash){
		ar.push(hash[k]);
	}
	return ar;
}

var tmpFiles = {};

var uuid = require('uuid');
var crypto = require('crypto');
var config = require('konphyg')(__dirname + '/../config');
var s3Config = config('amazons3');
var lastfmConfig = config('lastfm');
var knox = require('knox');
var mm = require('musicmetadata');
var fs = require('fs');
var restify = require('restify');
var async = require('async');

/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index', { title: 'Express' });
};

exports.indexPost = function(req, res){
	var avatar = '';
	if(req.body.gravatar != ''){
		avatar = '<img src="http://www.gravatar.com/avatar/'+crypto.createHash('md5').update(req.body.gravatar).digest('hex')+'" />';
	}else{
		avatar = '<div class="default-avatar" style="background-color:'+req.body.avatar+'"></div>';
	}
	user = {
		id : uuid.v1(),
		pseudo : req.body.pseudo,
		avatar : avatar,
		points : 0,
		founds : ''
	};
	req.app.locals.users[user.id] = user;
	req.session.user = user;
	res.redirect('/salons');
};

exports.play = function(req, res){
	var salon = req.app.locals.salons[req.params.salonid];
	if(salon.isFull()){
		res.redirect('/salons');
	}else{
		if(salon.getConnectedUsers() + 1 === salon.getMaxUsers() && salon.getType() !== 'custom'){
			var nSalon = new req.app.locals.Salon(salon.getName(), 'duplicate', 2, salon.getSonglistId(), 5);
			req.app.locals.salons[nSalon.getId()] = nSalon;
		}
		return res.render('play', {salonid : req.params.salonid, me : req.session.user, songs : salon.getSonglist(), bucket: s3Config.bucket, navbarInfo : {user : req.session.user}});
	}
}

/*
 * GET users list.
 */

exports.users = function(req, res){
	var salon = req.app.locals.salons[req.params.salonid];
	var user = salon.getUser(req.params.uid);
  	return res.render('partials/user', { user: user , layout : null});
};

/*
 * GET song list.
 */
exports.songlist = function(req, res){
	var salon = req.app.locals.salons[req.params.salonid];
	if(typeof salon === 'undefined'){
		return res.end('<script>location.href="/salons";</script>');
	};
	var songs = salon.getSonglist();
	return res.render('partials/songs', {songs: songs, layout : null});
}

/*
 * GET song details.
 */
exports.songdetails = function(req, res){
	req.app.locals.Song.findById(req.params.songid, function(err, doc){
		return res.render('partials/songdetails', {song: doc, layout : null});
	});
}

/*
 * GET final score.
 */

exports.scores = function(req, res){
	var salon = req.app.locals.salons[req.params.salonid];
	var users = salon.getUsersArray();
	var winner = users[0];
	for(var i=0; i<users.length; i++){
		if(users[i].points > winner.points){
			winner = users[i];
		}
	}
	var text = '';
	var players = '';
	for(var i=0; i<users.length; i++){
		if(users[i].id !== req.session.user.id){
			players += users[i].pseudo;
			var separateur = (i === users.length - 2 ? ' et ' : ', ');
			separateur = (i === users.length - 1 ? '' : separateur);
			players += separateur;
		}
	}
	if(winner.id === req.session.user.id){
		text = "Je viens d'écraser ";
		text += players;
		text += " avec un score de ";
		text += winner.points;
		text += " sur @MQuiz";
		console.log(text);
	}else{
		text = 'Je viens de faire un blind test sur @MQuiz avec '+players;
	}
  	return res.render('partials/scores', { users: users , tweetText: encodeURIComponent(text), layout : null});
};

/*
 * GET playlists
 */

exports.playlists = function(req, res){
	req.app.locals.Playlist.find().exec(function(err, docs){
		if(err){
			console.log(err);
		}
		return res.render('playlists', {
			playlists: docs,
			admin : true,
			navbarInfo : {user : req.session.user}});
	});
};
/*
 * POST playlists
 */
exports.playlistsPost = function(req, res){
	if(req.xhr){
		var newPlaylist = new req.app.locals.Playlist({name : req.body.name, difficulty : req.body.difficulty});
		newPlaylist.save(function(err, doc){
			if(err){
				console.log(err);
			}
			doc.layout = null;
			return res.render('partials/playlist', doc);
		});
	}else{
		res.redirect("/admin/playlists");
	}
};

/*
 * GET delete playlist
 */
exports.playlistDelete = function(req, res){
	if(req.xhr){
		var id = req.params.plId;
		req.app.locals.Playlist.findByIdAndRemove(id, function(err, doc){
			if(err){
				console.log(err);
			}
			res.send(200);
		});
	}else{
		res.redirect("/admin/playlists");
	}
}

/*
 * GET songs
 */
exports.songs = function(req, res){
	req.app.locals.Playlist.findOne({_id: req.params.plId}, function(err, playlist){
		if(err){
			console.log(err);
			res.redirect('/admin/playlists');
		}else{
			req.app.locals.Song.findByPlaylistId(playlist.id, function(err, docs){
				req.app.locals.Song.findNotInPlaylist(playlist.id, function(err, others){
					res.render('songs', {
						songs : others,
						currentPlaylist : docs,
						playlist : playlist,
						admin : true,
						navbarInfo : {user : req.session.user}
					});
				});
			});
		}
	});
}

/*
 * POST songs
 */
exports.songsPost = function(req, res){
	if(req.xhr){
		req.app.locals.Song.removePlaylist(req.params.plId, function(err, data){
				req.app.locals.Song.addPlaylistTo(req.body.idList, req.params.plId, function(err, songs){
						res.send(200);
					});
			});
	}else{
		res.redirect('/admin/playlists');
	}
}

/*
 * GET song.
 */
exports.song = function(req, res){
	req.app.locals.Song.find().exec(function(err, docs){
		res.render('song', {
			songs : docs,
			admin: true,
			bucket: s3Config.bucket,
			navbarInfo : {user : req.session.user}});
	});
}

/*
 * POST song.
 */
exports.songPost = function(req, res){
	var s3 = knox.createClient(s3Config);
	var song = req.app.locals.Song({
		title : req.body.title,
		artist : req.body.artist,
		cover : req.body.cover
	});
	song.save(function(err, doc){
		var song = req.files.song;
		var s3Headers = {
			'Content-Type': song.type,
			'x-amz-acl': 'public-read'
		};
		s3.putFile(song.path, doc.id + '.mp3', s3Headers, function(err, response){
			res.redirect('/admin/song');
		});
	});
}

exports.addMultipleSong = function(req, res){
	var s3 = knox.createClient(s3Config);
	songs = req.body.songs;
	async.each(songs, function(item, callback){
		var path = tmpFiles[item.id];
		var parser = mm(fs.createReadStream(path), {duration: true});
		parser.on('metadata', function(tags){
			var song = req.app.locals.Song({
				title : item.title,
				artist : item.artist,
				cover : item.cover,
				duration : tags.duration
			});
			delete tmpFiles[item.id];
			song.save(function(err, doc){
				var s3Headers = {
					'Content-Type': 'audio/mpeg',
					'x-amz-acl': 'public-read'
				};
				s3.putFile(path, doc.id + '.mp3', s3Headers, function(err, response){
					console.log('One file transfered');
					callback();
					//fs.unlinkSync(path);
				});
			});
		});
	},
	function(){
		console.log('Transfert all completed')
	});
	res.send(200);
}

exports.songUpload = function(req, res){
	if(req.files.songs.type === 'audio/mp3'){
		var fId = uuid.v1();
		tmpFiles[fId] = req.files.songs.path;
		var parser = mm(fs.createReadStream(req.files.songs.path), {duration: true});
		var tags = null;
		parser.on('metadata', function(metadata){
			tags = metadata;
			console.log(tags);
		});
		parser.on('done', function(err){
			if(tags !== null){
				var client = restify.createJsonClient({
					url: lastfmConfig.url
				});
				client.get(
					'/2.0/?method=track.getinfo&artist='
					 + encodeURIComponent(tags.artist)
					 + '&track='
					 + encodeURIComponent(tags.title)
					 + '&api_key='
					 + lastfmConfig.api_key
					 + '&format=json',
					function(err, requset, response, obj){
						var image = null,
							title =null,
							artist = null;
						if(typeof obj.error !== 'undefined'){
							image = '../cover/default.png';
							title = req.files.songs.name;
							artist = '';
						}else{
							if(typeof obj.track.album !== 'undefined'){
								image = obj.track.album.image[3]['#text'];
							}
							title = obj.track.name;
							artist = obj.track.artist.name;
						}
						res.render('partials/uploadDetails', {song: {id: fId, artist: artist, title: title, cover: image, okToUpload: true}, layout: null});
					});
			}else{
				res.render('partials/uploadDetails', {song: {id: fId, artist: '', title: req.files.songs.name, cover: '../cover/default.png', okToUpload: true}, layout: null});
			}
		});
	}else{
		fs.unlinkSync(req.files.song.path);
		res.render('partials/uploadDetails', {song: {id: fId, artist: '', title: req.files.songs.name, cover: '../cover/default.png', okToUpload: false}, layout: null});
	}
}

exports.deleteTmpFile = function(req, res){
	fs.unlinkSync(tmpFiles[req.params.fId]);
	delete tmpFiles[req.params.fId];
	res.send(200);
}

exports.salons = function(req, res){
	var s = [];
	var cs = [];
	var salons = req.app.locals.salons;
	for(var k in salons){
		if(salons[k].getType() === 'custom'){
			cs.push(salons[k]);
		}else{
			s.push(salons[k]);
		}
	}
	req.app.locals.Playlist.find().exec(function(err, playlists){
		res.render('salons', {playlists : playlists, salons : s, customSalons : cs, users : hashToArray(req.app.locals.users), navbarInfo : {user : req.session.user}});
	});
}

exports.salonsPost = function(req, res){
	var salon = new req.app.locals.Salon(req.body.name, 'custom', req.body.players, req.body.playlist, req.body.songlistLength, req.body.password);
	req.app.locals.salons[salon.getId()] = salon;
	//get connected user and move him from app to salon
	res.redirect('/play/'+salon.getId());
}

exports.checkPasswd = function(req, res){
	var salon = req.app.locals.salons[req.params.salonid];
	var response = {
		id : salon.getId()
	};
	response.access = salon.checkPasswd(req.params.password) ? 'granted' : 'refused';
	res.json(response);
}

exports.logout = function(req, res){
	delete req.session.user;
	res.redirect('/');
}

exports.adminLogin = function(req, res){
	res.render('adminLogin', {navbarInfo : {user : req.session.user}});
}

exports.adminLoginPost = function(req, res){
	var credentials = config('credentials');
	var username = req.body.login;
	var password = req.body.password;
	var hash = crypto.createHash('md5').update(password).digest('hex');
	var adminUser = credentials[username];
	if(typeof adminUser !== 'undefined'){
		console.log(hash);
		console.log(adminUser.passwordHash);
		if(adminUser.passwordHash === hash){
			req.session.admin = true;
			res.redirect('/admin/playlists');
		}else{
			res.render('adminLogin', {error : "Accès refusé: Mauvais mot de passe", username: username, navbarInfo : {user : req.session.user}} );
		}
	}else{
		res.render('adminLogin', {error : "Accès refusé: Mauvais identifiant", navbarInfo : {user : req.session.user}} );
	}
}

exports.apropos = function(req, res){
	res.render('apropos', {navbarInfo : {user : req.session.user}});
}