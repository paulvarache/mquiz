$(document).ready(function(){

	/*
	* Preparation of the avatar section
	 */
	var defaultAvatar = $("#default-avatar");
	var colors = ['FireBrick', 'LightSkyBlue', 'GreenYellow'];

	for(var i in colors){
		var da = defaultAvatar.clone();
		da.attr('id', colors[i]);
		da.find('.default-avatar').attr('style', 'background-color: '+colors[i]+';');
		defaultAvatar.parent().prepend(da);
	}
	defaultAvatar.remove();

	$('.default-avatar').each(function(){
		$(this).parent().click(function(e){
			e.preventDefault();
			$('.default-avatar').each(function(){
				$(this).parent().css('background-color', 'white');
			})
			$(this).css('background-color', 'grey');
			$('#avatar').val($(this).attr('id'));
			$(this).attr('class', $(this).attr('class')+' active');
		});
	});

	showOnly('', 'panel');

	/*
	* Connection to the io server
	 */
	var socket = io.connect('http://mquiz.localhost:4242');
	var myId;
	var playing;
	var mySongList;
	var currentSong;

	/*
	* Variablizing our sub-templates
	 */
	var usrtpl = $('#usrtpl').html();
	$('#usrtpl').remove();
	var songtpl = $('#songtpl').html();
	$('#songtpl').remove();
	var lastsongtpl = $('#last-song-tpl').html();
	$('#last-song-tpl').remove();
	var scoretpl = $('#score-table-tpl').html();
	$('#score-table-tpl').remove();

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

	/*
	* On the login, the user id is stored and the song list is prepared.
	 */
	socket.on('logged', function(id, songList){
		myId = id;
		mySongList = songList;
		$("#login-screen").fadeOut();
		$("#usrlist").empty();
		$("#before-play").attr('style', '');
		for(var k in songList){
			$('#songList').append(Mustache.render(songtpl, songList[k]));
		}
		console.log(mySongList);
	});

	/*
	* When a new user connects, we add him on the user list.
	 */
	socket.on('newusr', function(user){
		console.log(user);
		if(user.gravatar == ''){
			var da = defaultAvatar.clone();
			da.find('.default-avatar').attr('style', 'background-color: '+user.avatar+';');
			user.avatar = da.html();
		}else{
			user.avatar = '<img src="'+user.avatar+'" />';
		}
		if(user.id == myId){
			user.pseudo = user.pseudo+' (moi)';
			$("#usrlist").prepend(Mustache.render(usrtpl, user));
		}else{
			$("#usrlist").append(Mustache.render(usrtpl, user));
		}
	});

	/*
	* When a user disconnect, we remove him from the user list.
	 */
	socket.on('disusr', function(user_id){
		$('#' + user_id).slideUp(function(){
			$(this).remove();
		});
	});

	/*
	* When the game starts, we play the song and display the answer button.
	 */
	socket.on('play', function(song_id){
		console.log('PLAY');
		currentSong = song_id;
		showOnly('playing', 'panel');
		$('#response').focus();
		playing = $('#'+song_id).get(0);
		playing.play();
	});

	/*
	* When someone click the answer button, we pause the music and invite the other
	* players to wait.
	 */
	socket.on('stop', function(resusr){
		console.log('STOP');
		if(resusr.id == myId){
			countdown(5,
				function(sec){
					$('#countdown').html(sec);
				},
				function(){
					socket.emit('end-response');
					$('#countdown').html('');
				}
			);
		}else{
			$('#response').fadeOut();
			$('#submit-response').html(resusr.pseudo + ' cherche une réponse...').prop('disable', true);
		}
		playing.pause();
	});

	socket.on('continue', function(){
		console.log('CONTINUE');
		$('#response').fadeIn();
		$('#submit-response').html('STOP').prop('disable', false);
		playing.play();
	});

	socket.on('winner', function(winner){
		console.log('WINNER');
		var result = {song : mySongList[currentSong], user : winner};
		$('#last-songs').hide().append(Mustache.render(lastsongtpl, result)).fadeIn();
		playing.pause();
		playing.parentNode.remove();
		showOnly('wait', 'panel');
		$('#waiting-next-song').css('width', '0%').animate({width: '100%'},5000);
	});

	socket.on('next-song', function(){
		showOnly('wait', 'panel');
		$('#response').fadeIn();
		$('#submit-response').html('STOP').prop('disable', false);
		$('#waiting-next-song').css('width', '0%').animate({width: '100%'}, 5000);
	});

	socket.on('game-end', function(users){
		for(var k in users){
			$('#score-table-body').append(Mustache.render('<tr>'+scoretpl+'</tr>', users[k]));
		}
		$('#score-table').tablesorter({sortList : [[1,0]]});
		showOnly('end', 'panel');
	});

	/*
 	* Definition of the actions to perform on the page elements
  	*/
  	$('#gravatar').on('keyup change', function(){
  		defaultAvatarAutoHide($(this).val());
  	});

  	/*
  	* Prevent the login form from doing anything.
  	 */
  	$('#login-form').submit(function(event){
  		event.preventDefault();
  	});

  	/*
  	* Enables the validation of hidden type input.
  	 */
  	$.validator.setDefaults({
    	ignore: [],
	});

  	/*
  	* Description of the validation methods for the login form
  	 */
  	$('#login-form').validate({
  		groups : {
  			names : "avatar gravatar"
  		},
  		rules : {
  			avatar : {
  				require_from_group : [1, '.avatar-field']
  			},
  			gravatar : {
  				require_from_group : [1, '.avatar-field'],
  				email : true
  			},
  			pseudo : {
  				required : true,
  				minlength : 4,
  				maxlength : 22
  			}
  		},
  		submitHandler : function(form){
  			socket.emit('login', {
			pseudo : 	$('#pseudo').val(),
			avatar : 	$('#avatar').val(),
			gravatar : 	$('#gravatar').val()
			});
  		}
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
	$('.'+multi).each(function(){
		$(this).hide();
	});
	$('#'+id).show();
}
