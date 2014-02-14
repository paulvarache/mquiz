$(document).ready(function(){

	$(".panel").hide();
	showOnly('before-play', 'appPanel');

	var resetScorePlusPosition = function(){
		$('#score-plus').css('top', parseInt(window.innerHeight) / 2+'px').css('left', parseInt(window.innerWidth) / 2+'px');
		$('#score-plus').css('margin-top', '-'+parseInt($('#score-plus').height()) / 2+'px').css('margin-left', '-'+parseInt($('#score-plus').width()) / 2+'px');
		$('#score-plus').css('font-size', '100000%');
	}

	resetScorePlusPosition();

	/*
	* Connection to the io server
	 */
	var socket = io.connect('/');
	var playing;
	var mySongList;
	var currentSong;
	var audioList = {};
	var playingId = null;

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
	})

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
	$("#before-play").attr('style', '');
	$('#replay').click(function(){
		socket.emit('replay');
		location.reload();
	});

	socket.on('logged', function(myId, songs, startPositions){
		var url = $('#s3URI').val();
		for(var k in songs){
			var start = startPositions[songs[k]._id] * 1000;
			var ap = new Howl({
				urls : [url+songs[k]._id+'.mp3'],
				sprite: {
					def: [start, startPositions[songs[k]._id]+60000]
				}
			});
			audioList[songs[k]._id] = ap;
		}
	});

	socket.on('message', function(user, message){
		$('#popover'+user.id).attr('data-content', message);
		$('#popover'+user.id).popover('show');
		setTimeout(function(){
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
				$('#waiting-page').remove();
				$('#app').fadeIn();
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
		if(myId != ''){
			console.log('PLAY');
			currentSong = song_id;
			showOnly('playing', 'appPanel');
			$('#response').focus();
			playing = audioList[song_id];
			playingId = song_id;
			playing.play('def');
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
				$('#submit-response').html(resusr.pseudo + ' cherche une réponse...').prop('disable', true);
			}
			playing.pause();
		}
	});

	socket.on('penalite', function(){
		if(myId != ''){
			showOnly('penalite', 'appPanel');
			setTimeout(function(){
				showOnly('playing', 'appPanel');
			},2000);
		}
	});

	socket.on('continue', function(){
		if(myId != ''){
			console.log('CONTINUE');
			$('#response').fadeIn();
			$('#submit-response').html('STOP').prop('disable', false);
			playing.play();
		}
	});

	socket.on('winner', function(winner){
		if(myId != ''){
			console.log('WINNER');
			$.get('/songdetails/'+currentSong, function(data){
				html = $(data);
				html.find('#foundby').html('Trouvé par '+winner.pseudo);
				$('#last-songs').hide().prepend(html[0]).fadeIn();
			});
			if(winner.id === myId){
				$('#rem-'+playingId).attr('src', '/images/check.png');
				$('#score-plus').fadeIn().animate({"font-size" : "1000%", "margin-top": "-200px", "margin-left": "-80px"}, {duration: 500, complete: function(){
					setTimeout(function(){
						$('#score-plus').fadeOut(function(){
							resetScorePlusPosition();
						});
					},3000);
				}});
			}else{
				$('#rem-'+playingId).attr('src', '/images/wrong.png');
			}
			$('#rem-'+playingId).tooltip('hide').attr('data-toggle', '');
			playing.pause();
			delete playing;
			showOnly('wait', 'appPanel');
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
			$('#submit-response').html('STOP').prop('disable', false);
		}
	});

	socket.on('game-end', function(users){
		console.log('GAME-END');
		if(myId != ''){
			$.get('/scores/'+salonId, function(data){
				$('#end').html(data);
				$('#score-table').tablesorter({sortList : [[1,0]]});
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
* This function countdown to a given number and execute a callback every second
* and at the end.
 */
function countdown(current, passage, end){
	if(current != 0){
		setTimeout(function(){countdown(current - 1, passage, end);}, 1000);
		passage(current);
	} else {
		end();
	}
}

function animateBar(bar, duration){
	var interval = setInterval(function(){
		bar.attr('aria-valuenow', parseInt(bar.attr('aria-valuenow')) + (100 / duration))
	}, (duration * 1000) / 10);
	setTimeout(function(){
		clearInterval(interval);
	}, duration * 1000);
}

 /*
 * This function hide the default avatars when something is added to the gravatar input
  */
function defaultAvatarAutoHide(value){
	var display = 'none';
	if(value == ''){
		display = 'inline-block';
	}
	$('.avatar, #ou').each(function(){
		$(this).css('display', display);
	});
}

function showOnly(id, multi){
	$('#'+id).fadeIn();
	$('.'+multi).not('#'+id).each(function(){
		$(this).fadeOut();
	});
}
