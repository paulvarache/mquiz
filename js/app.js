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

	/*
	* Connection to the io server
	 */
	var socket = io.connect('http://mquiz.localhost:4242');
	var myId;
	var playing;

	/*
	* Variablizing our sub-templates
	 */
	var usrtpl = $('#usrtpl').html();
	$('#usrtpl').remove();
	var songtpl = $('#songtpl').html();
	$('#songtpl').remove();

	/*
	* Overriding the submit actions
	 */
	$("#login-form").submit(function(event){
		event.preventDefault();
		socket.emit('login', {
			pseudo : 	$('#pseudo').val(),
			avatar : 	$('#avatar').val(),
			gravatar : 	$('#gravatar').val()
		})
	});

	/*
	* When the ready button is clicked, the server is informed and the user 
	* is invited to wait.
	 */
	$("#ready-btn").click(function(){
		socket.emit('ready', myId);
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
		countdown(5,
			function(sec){
				$('#countdown').html(sec);
			},
			function(){
				socket.emit('end-response');
				$('#countdown').html('');
			}
		);
	});

	/*
	* On the login, the user id is stored and the song list is prepared.
	 */
	socket.on('logged', function(id, songList){
		myId = id;
		$("#login-screen").fadeOut();
		$("#usrlist").empty();
		$("#ready-btn").attr('style', '');
		for(var k in songList){
			$('#songList').append(Mustache.render(songtpl, songList[k]));
		}
	});

	/*
	* When a new user connects, we add him on the user list.
	 */
	socket.on('newusr', function(user){
		console.log(user);
		if(user.gravatar != ''){

		}else{
			var da = defaultAvatar.clone();
			da.find('.default-avatar').attr('style', 'background-color: '+user.avatar+';');
			user.avatar = da.html();
		}
		$("#usrlist").append(Mustache.render(usrtpl, user));
	});

	/*
	* When a user disconnect, we remove him from the user list.
	 */
	socket.on('disusr', function(user_id){
		$('#' + user_id).remove();
	});

	/*
	* When the game starts, we play the song and display the answer button.
	 */
	socket.on('play', function(song_id){
		playing = $('#'+song_id).get(0)
		$('#response-form').attr('style', '');
		playing.play();
		$('#ready-btn').fadeOut();
	});

	/*
	* When someone click the answer button, we pause the music and invite the other
	* players to wait.
	 */
	socket.on('stop', function(resusr){
		playing.pause();
		$('#submit-response').attr('disabled','disabled');
		$('#submit-response').html(resusr.pseudo + ' cherche une réponse...');
	});

	/*
	* This user only is allowed to give an answer
	 */
	socket.on('waiting-answer', function(){
		$('#submit-response').attr('disabled','enabled');
		$('#submit-response').html('OK');
	});

	socket.on('continue', function(){
		$('#submit-response').attr('disabled','enabled');
		$('#submit-response').html('OK');
		playing.play();
	});

});

/*
* This function countdown to a given number and execute a callback every second
* and at the end.
 */
function countdown(current, passage, end){
	if(current != 0){
		window.setInterval(function(){countdown(current - 1, passage, end);}, 1000);
		passage(current);
	} else {
		end();
	}
}