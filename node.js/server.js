var http = require('http');
var uuid = require('node-uuid');

httpServer = http.createServer(function(req,res){
	res.end('Hello World !');
});

httpServer.listen(4242);
var users = {};
var songList = {1 : {id : 'b4ee4fc0-7d1c-11e3-b49d-b122d042516d', song : '01.mp3', title : 'Panic Station'}};
var currentSong = 1;

var io = require('socket.io').listen(httpServer);
io.sockets.on('connection', function(socket){
	var me;
	socket.on('login', function(user){
		me = user;
		me.id = uuid.v1();
		console.log(me);
		socket.emit('logged', me.id, songList);
		for(var k in users){
			socket.emit('newusr', users[k]);
		}
		io.sockets.emit('newusr', me);
		users[me.id] = me;
	});
	socket.on('disconnect', function(){
		if(!me) return;
		delete users[me.id];
		io.sockets.emit('disusr', me.id);
	});
	socket.on('ready', function(id){
		users[id].ready = true;
		if(users.length < 2) return;
		for(var k in users){
			if(users[k].ready != true) return;
		}
		io.sockets.emit('play', songList[currentSong].id);
	});
	socket.on('stop', function(answer, user_id){
		if(answer.response != ''){
			if(checkResponse(answer.response, songList[currentSong].title)){
				io.sockets.emit('winner', me);
			}else{
				io.sockets.emit('continue');
			}
		}
		io.sockets.emit('stop', me);
		socket.emit('waiting-answer');
	});
	socket.on('end-response', function(){
		io.sockets.emit('continue');
	});
});

function checkResponse(response, song){
	var levenshtein = require('levenshtein');
	var max = response.length > song.length ? response.length : song.length;
	var l = new levenshtein(response.toLowerCase(), song.toLowerCase());
	var success = max * 0.8;
	console.log('RESULT: '+(max - l.distance)+'/'+max);
	console.log('GOAL: '+success+'/'+max);
	return success >= (max - l.distance) ? false : true;
}