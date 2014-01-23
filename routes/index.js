
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

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
	var song = req.app.locals.mServer.getSonglist()[req.params.songid];
	return res.render('partials/songdetails', {song: song, layout : null});
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
			{$pop : {playlists : {$each : [req.params.plId]}}},
			function(){
				req.app.locals.Song.update(
					{_id : { $in : req.body.idList}},
					{$addToSet : {playlists : {$each : [req.params.plId]}}},
					function(err, songs){
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