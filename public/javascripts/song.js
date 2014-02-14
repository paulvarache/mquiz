$(document).ready(function(){
	var reqEnd = '&api_key=5216edf37ad15286cfb41070bd484906&format=json';
	var tracks;
	var artist;
	var step = 'artist';


	$('#title').focus(function(){
		$('#customTitle').prop('disabled', true);
		$('#customTitle').val('');
	});

	$('#title').focusout(function(){
		$('#customTitle').prop('disabled', false);
		$(this).prop('disabled', false);
	});

	$('#customTitle').focusout(function(){
		$('#title').prop('disabled', false);
		$(this).prop('disabled', false);
	});

	$('#customTitle').focus(function(){
		$('#title').prop('disabled', true);
		$('#title').val('');

	});
	$('#form').submit(function(e){
		var parts = $('#song').val().split('.');
		if(parts[parts.length - 1] !== 'mp3'){
			e.preventDefault();
			console.log('mp3 only');
		}else{
			$(this).fadeOut();
			$(this).parent().append('<h4>Envoi en cours...</h4>');
		}
	});
	$('#next').click(function(){
		if(step === 'artist'){
			if($('#artist').val() !== ''){
				searchArtist(function(){
					getTracks();
					$('#artistGroup').slideToggle();
					$('#titleGroup').slideToggle();
					step = 'title';
				});
			}
		}else if(step === 'title'){
			var info = {};
			if($('#title').val() === null){
				info.track = $('#customTitle').val();
				info.artist = artist;
				info.image = '';
			}else{
				var option = $('#track'+$('#title').val());
				info = option.data('info');
			}
			$.get('http://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist='+info.artist+'&track='+info.track+reqEnd, function(data){
				console.log(data);
				if(typeof data.error === 'undefined'){
					info.track = data.track.name;
					info.artist = data.track.artist.name;
					info.image = data.track.album.image[3]['#text'];
				}
				$('#titleField').val(info.track);
				$('#artistField').val(info.artist);
				$('#imageField').val(info.image);
				$('#artist-name').html(info.artist);
				$('#artist-image').attr('src', info.image);
				$('#track-name').html(info.track);
				$('#titleGroup').slideToggle();
				$('#songGroup').slideToggle();
				$(this).html('Ajouter');
				$(this).attr('type', 'submit');
				step = '';
			});
		}
	});
	$('#artist').keyup(function(){
		if($('#artist').val() !== ''){
			searchArtist();
		}else{
			$('#artist-name').html('');
			$('#artist-image').attr('src', '');
		}
	});
	$('#title').change(function(){
		var option = $('#track'+$(this).val());
		var info = option.data('info');
		$('#artist-image').attr('src', info.image);
		$('#track-name').html(info.track);
	});
	$('#song-add').click(function(e){
		e.preventDefault();
		$('#song-add-form').slideToggle();
		$(this).slideUp();
	});
	var getTracks = function(){
		if(artist === ''){
			artist = $('#artist').val();
			$('#title').hide();
		}else{
			$.get('http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist='+artist+reqEnd, function(data){
					tracks = data.toptracks.track;
					displayTracks(tracks);
			});
		}
	}
	var displayTracks = function(tracks){
		artist = tracks[0].artist.name;
		for(var i=0; i<tracks.length; i++){
			var json = {
							track : tracks[i].name,
							artist : tracks[i].artist.name,
							image : typeof tracks[i].image !== 'undefined' ? tracks[i].image[3]['#text'] : '/cover/default.png',
						}
						console.log(tracks[i]);
			var option = $('<option id="track'+i+'" value="'+i+'">'+tracks[i].name+'</option>');
			option.data('info', json);
			$('#title').append(option);
		}
	}
	var searchArtist = function(callback){
		callback = callback || function(){};
		$.get('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist='+$('#artist').val()+reqEnd, function(data){
			if(typeof data.error === 'undefined'){
				$('#artist-name').html(data.artist.name);
				$('#artist-image').attr('src', data.artist.image[4]['#text']);
				artist = data.artist.name;
			}else{
				$('#artist-name').html($('#artist').val());
				$('#artist-image').attr('src', '');
				artist = '';
			}
			callback();
		});
	}
});