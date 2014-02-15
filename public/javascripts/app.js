$(document).ready(function(){

	/*
	* Préparation UI
	*/
	$('.appPanel').hide(function(){
		showOnly('before-play', 'appPanel');
	});

	resetScorePlusPosition();

	$('#saySomething li').click(function(e){
		e.preventDefault();
		$('#saySomethingTab').slideToggle();
	});

	$('#saySomethingForm').submit(function(e){
		e.preventDefault();
		var message = $('#saySomethingMessage');
		if(message.val() !== ''){
			socket.emit('message', {message : message.val()});
			message.val('');
		}
	});

	/*
	* Connection to the io server
	 */
	var socket = io.connect('/');
	var playing;
	var currentSong;
	var audioList = {};
	var playingId = null;
	var countdownInterval = null;
	var countdown = 60;

	// There are two vars defined by the view: myId and salonId

	/*
	* When the ready button is clicked, the server is informed and the user
	* is invited to wait.
	 */
	$("#ready-btn").click(function(){
		socket.emit('ready');
		$(this).html('En attente des autres joueurs...');
	});

	/*
	* When the answer button is clicked, the server is informed and the countdown
	* is launched. When the countdown is over the end-response event is emitted.
	 */
	$('#response-form').submit(function(e){
		e.preventDefault();
		socket.emit('stop', {
			response : 	$('#response').val()
			});
		$('#response').val('');
		$('#response').focus();
	});

	socket.emit('login', {userid : myId, salonid : salonId});

	/*
	* The login response from the server
	* This is where we prepare the audio object with howler
	*/
	socket.on('logged', function(songs, startPositions){
		var url = $('#s3URI').val();
		for(var k in songs){
			var start = startPositions[songs[k]._id] * 1000;
			var ap = new Howl({
				urls : [url+songs[k]._id+'.mp3'],
				sprite: {
					def: [start, startPositions[songs[k]._id]+60000] //Defines a default 60s sprite 
				},
				buffer: true
			});
			audioList[songs[k]._id] = ap; //Add the new Howl in the audioList object
		}
	});

	/*
	* When a message return from the server
	* This is essentially UI stuff
	*/
	socket.on('message', function(user, message){
		$('#popover'+user.id).attr('data-content', message);
		$('#popover'+user.id).popover('show');
		setTimeout(function(){ // 2secs after the message has been displayed whe hide it
			$('#popover'+user.id).popover('hide');
		}, 2000);
		var nMessage = '<div class="message"><strong>'+user.pseudo+': </strong>'+message+'</div>';
		$('#messages').append(nMessage);
		$("#messages").scrollTop($("#messages")[0].scrollHeight);
	});

	/*
	* When a new user connects, we add him on the user list.
	 */
	socket.on('newusr', function(user){
		$.get('user/'+user.id+'/salon/'+salonId, function(data){
			if(user.id == myId){
				$("#usrlist").prepend(data);
				$('#waiting-page').fadeOut(function(){
					$(this).remove();
				});
			}else{
				$("#usrlist").append(data);
			}
		});
	});

	/*
	* When a user disconnect, we remove him from the user list.
	 */
	socket.on('disusr', function(user_id){
		$('#popover'+user_id).popover('hide');
		$('#' + user_id).slideUp(function(){
			$(this).remove();
		});
	});

	$('#remSongs').children().tooltip({trigger : 'manual'});
	$('.user').popover({trigger : 'manual'});


	/*
	* When the game starts, we play the song and display the answer button.
	 */
	socket.on('play', function(song_id){
		$('#rem-'+song_id).tooltip('show');
		$('#rem-'+song_id).find('img').fadeOut(function(){
			$('#rem-'+song_id).find('div').css('-webkit-animation-play-state', 'running');
			$('#circle-right #circle-left').css('-webkit-animation-play-state', 'running');
			$('#remCountdown').fadeIn();
			countdownInterval = setInterval(function(){
				countdown--;
				$('#remCountdown').html(countdown);
			},1000);
		})
		if(myId != ''){
			console.log('PLAY');
			currentSong = song_id;
			showOnly('playing', 'appPanel');
			$('#response').focus();
			playing = audioList[song_id];
			playingId = song_id;
			playing.play('def');
			$('#response').focus();
		}
	});

	/*
	* When someone click the answer button, we pause the music and invite the other
	* players to wait.
	 */
	socket.on('stop', function(resusr){
		if(myId != ''){
			console.log('STOP');
			if(resusr.id == myId){
				var sec = 4;
				$('#countdown').html(5);
				var interval = setInterval(function(){
					if(sec == 1){
						clearInterval(interval);
						socket.emit('end-response');
						$('#countdown').html('');
					}else{
						$('#countdown').html(sec);
						sec--;
					}
				}, 1000);
			}else{
				$('#response').fadeOut();
				$('#submit-response').html(resusr.pseudo + ' cherche une réponse...')
				$('#submit-response').prop('disabled', true);
			}
			playing.pause();
		}
	});

	socket.on('penalite', function(){
		if(myId != ''){
			showOnly('penalite', 'appPanel');
			setTimeout(function(){
				showOnly('playing', 'appPanel');
				$('#response').focus();
			},2000);
		}
	});

	socket.on('continue', function(){
		if(myId != ''){
			console.log('CONTINUE');
			$('#response').fadeIn();
			$('#submit-response').html('Je sais, je sais !');
			$('#submit-response').prop('disabled', false);
			playing.play('def');
		}
	});

	socket.on('winner', function(winner, end){
		if(myId != ''){
			$('#response').val('');
			console.log('WINNER');
			$.get('/songdetails/'+currentSong, function(data){
				html = $(data);
				html.find('#found-by').html('Trouvé par '+winner.pseudo);
				$('#last-songs').hide().prepend(html[0]).fadeIn();
			});
			clearInterval(countdownInterval);
			countdown = 60;
			if(winner.id === myId){
				var img = $('#rem-'+playingId).find('img');
				var div = $('#rem-'+playingId).find('div');
				img.attr('src', '/images/check.png');
				div.fadeOut(function(){
					$(this).remove();
					img.fadeIn();
				});
				$('#remCountdown').fadeOut();
				$('#score-plus').fadeIn().animate({"font-size" : "1000%", "margin-top": "-200px", "margin-left": "-80px"}, {duration: 500, complete: function(){
					setTimeout(function(){
						$('#score-plus').fadeOut(function(){
							resetScorePlusPosition();
						});
					},3000);
				}});
			}else{
				var img = $('#rem-'+playingId).find('img');
				var div = $('#rem-'+playingId).find('div');
				img.attr('src', '/images/wrong.png');
				div.fadeOut(function(){
					$(this).remove();
					img.fadeIn();
				});
				$('#remCountdown').fadeOut();
			}
			$('#rem-'+playingId).tooltip('hide').attr('data-toggle', '');
			if(!end){
				setTimeout(function(){
					playing.pause();
					delete playing;
				}, 6500);
				showOnly('wait', 'appPanel');
			}
		}
	});

	socket.on('wrong', function(){
		if(myId != ''){
			for(var i = 0; i<3; i++){
				$('#response').animate({'margin-left' : '10px'}, 25)
							.animate({'margin-left' : '-10px'}, 50)
							.animate({'margin-left' : '0px'}, 25);
			}
		}
	});

	socket.on('next-song', function(){
		if(myId != ''){
			showOnly('wait', 'appPanel');
			$('#response').fadeIn();
			$('#submit-response').html('Je sais, je sais !').prop('disabled', false);
		}
	});

	socket.on('game-end', function(users){
		console.log('GAME-END');
		if(myId != ''){
			$.get('/scores/'+salonId, function(data){
				$('#end').html(data);
				$('#score-table').tablesorter({sortList : [[1,0]]});
				$('#replay').click(function(){
					socket.emit('replay');
					location.reload();
				});
				$('#tweetButton').click(function(e){
					e.preventDefault();
					window.open($(this).attr('href'), 'Partager sur Twitter',
							'left=20,top=20,width=500,height=500,toolbar=1,resizable=0');
				});
				showOnly('end', 'appPanel');
			});
		}
	});

	socket.on('not-enough-players', function(){
		showOnly('not-enough', 'appPanel');
		setTimeout(function(){
			location.reload();
		}, 5000);
	});
});

/*
* Fonctions
*/

//Hide all the elements which class is multi and show the element with the id
function showOnly(id, multi){
	console.log('SHOW ONLY: '+id);
	$('.'+multi).not('#'+id).each(function(){
		console.log(this);
		$(this).fadeOut();
	}).promise().done(function(){
		$('#'+id).fadeIn();
	});
}

//Resets the position of the +1 
var resetScorePlusPosition = function(){
	$('#score-plus').css('top', parseInt(window.innerHeight) / 2+'px').css('left', parseInt(window.innerWidth) / 2+'px');
	$('#score-plus').css('margin-top', '-'+parseInt($('#score-plus').height()) / 2+'px').css('margin-left', '-'+parseInt($('#score-plus').width()) / 2+'px');
	$('#score-plus').css('font-size', '100000%');
}
