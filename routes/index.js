
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
  	return res.render('partials/user', { user: user });
};

/*
 * GET song list.
 */
exports.songlist = function(req, res){
	var songs = req.app.locals.mServer.getSonglist();
	return res.render('partials/songs', {songs: songs});
}

/*
 * GET song details.
 */
exports.songdetails = function(req, res){
	var song = req.app.locals.mServer.getSonglist()[req.params.songid];
	return res.render('partials/songdetails', {song: song});
}

/*
 * GET final score.
 */

exports.scores = function(req, res){
	var users = req.app.locals.mServer.getUsersArray();
  	return res.render('partials/scores', { users: users });
};