var hashToArray = function(hash){
	var ar = [];
	for(var k in hash){
		ar.push(hash[k]);
	}
	return ar;
}


/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.indexPost = function(req, res){
	var uuid = require('uuid');
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
	console.log(req.app.locals.users);
	res.redirect('/salons');
}

/*
 * GET users list.
 */

exports.users = function(req, res){
	var user = req.app.locals.mServer.getUsers()[req.params.uid];
  	return res.render('partials/user', { user: user , layout : null});
};

/*
 * GET song list.
 */
exports.songlist = function(req, res){
	var songs = req.app.locals.mServer.getSonglist();
	return res.render('partials/songs', {songs: songs, layout : null});
}

/*
 * GET song details.
 */
exports.songdetails = function(req, res){
	req.app.locals.Song.findById(req.params.songid, function(err, doc){
		console.log(doc);
		return res.render('partials/songdetails', {song: doc, layout : null});
	});
}

/*
 * GET final score.
 */

exports.scores = function(req, res){
	var users = req.app.locals.mServer.getUsersArray();
  	return res.render('partials/scores', { users: users , layout : null});
};

/*
 * GET playlists
 */

exports.playlists = function(req, res){
	req.app.locals.Playlist.find().exec(function(err, docs){
		if(err){
			console.log(err);
		}
		console.log(docs);
		return res.render('playlists', { playlists: docs });
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
			console.log(doc);
			doc.layout = null;
			return res.render('partials/playlist', doc);
		});
	}else{
		res.redirect("playlists");
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
		res.redirect("playlists");
	}
}

/*
 * GET songs
 */
exports.songs = function(req, res){
	req.app.locals.Song.find().where({playlists : req.params.plId}).exec(function(err, docs){
		req.app.locals.Song.find().where({playlists : { $ne : req.params.plId}}).exec(function(err, others){
			res.render('songs', {songs : others, currentPlaylist : docs});
		});
	});
}

/*
 * POST songs
 */
exports.songsPost = function(req, res){
	if(req.xhr){
		req.app.locals.Song.update(
			{playlists : req.params.plId},
			{$pop : {playlists : req.params.plId}},
			{multi : true},
			function(err, data){
				req.app.locals.Song.update(
					{_id : { '$in' : req.body.idList}},
					{$push : {playlists : req.params.plId}},
					{multi : true},
					function(err, songs){
						console.log('SONGS UPDATED : ');
						console.log(songs);
						res.send(200);
					});
			});
	}else{
		res.redirect('playlists');
	}
}

/*
 * GET song.
 */
exports.song = function(req, res){
	req.app.locals.Song.find().exec(function(err, docs){
		res.render('song', {songs : docs});
	});
}

/*
 * POST song.
 */
exports.songPost = function(req, res){
	console.log(req.files);
	var song = req.app.locals.Song({
		title : req.body.title,
		artist : req.body.artist,
		cover : req.body.cover});
	song.save(function(err, doc){
			var fs = require('fs');
			fs.readFile(req.files.song.path, function(err, data){
				var newpath = __dirname+'/../public/audio/'+doc._id+'.mp3';
				fs.writeFile(newpath, data, function(err){
					fs.unlink(req.files.song.path, function(){
						res.redirect('/song');
					});
				});
			});
		});
}


exports.salons = function(req, res){
	req.app.locals.Playlist.find().exec(function(err, playlists){
		res.render('salons', {playlists : playlists, salons : hashToArray(req.app.locals.salons)});
	})
}

exports.salonsPost = function(req, res){
	var salon = new req.app.locals.MServer(req.body.name, req.body.players, req.body.playlist);
	req.app.locals.salons[salon.getId()] = salon;
	//get connected user and move him from app to salon
	res.redirect('/play/'+salon.getId());
}