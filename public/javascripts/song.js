$(document).ready(function(){
	var reqEnd = '&api_key=5216edf37ad15286cfb41070bd484906&format=json';
	var tracks;
	var artist;
	var step = 'song';

	$('.songInfo').each(function(){
		$(this).click(function(){
			var player = $('#previewPlayer').get(0);
			if(!player.paused && $('#previewPlayer source').attr('id') === $(this).attr('id')){
				player.pause();
			}else{
				var id = $(this).attr('id');
				$('#previewPlayer source').attr('src', $('#s3URI').val()+id+'.mp3');
				$('#previewPlayer source').attr('id', id);
				player.pause();
				player.load();
				player.play();
			}
		});
	});

	var processHandling = function(data){
		console.log(data);
	};
	var uploadSuccess = function(){
		console.log('success');
	}
	var addSong = function(data){
		var li = $(data.result);
		li.find('.deleteTmp').click(function(){
			$.get('/admin/deleteTmpFile/'+$(this).attr('id'), function(){
				li.slideToggle(function(){
					$(this).remove();
					if($('#songList').children().length === 0){
						$('#songListPanel').fadeOut();
					}
				});
			});
		});
		li.click(function(e){
			e.preventDefault();
			id = $(this).attr('id').substr(5, $(this).attr('id').length);
			var title = $(this).find('#title').val();
			var artist = $(this).find('#artist').val();
			console.log(artist);
			var div = $(this);
			$.getJSON('/admin/getCover/'+encodeURIComponent(artist)+'/'+encodeURIComponent(title), function(data){
				console.log(data);
				div.find('#cover').attr('src', data.cover);
			});
		});
		$('#songList').append(li);
		li.hide().slideToggle();
	}
	$('#triggerFile').click(function(){
		$('#song').trigger('click');
	})
	$('#song').fileupload({
		dataType: 'html',
		done: function(e, data){
			if($('#songListPanel').css('display') === 'none'){
				$('#songListPanel').fadeIn(function(){
					addSong(data);
				});
			}else{
				addSong(data);
			}
		}
	});
	$('#addAll').click(function(){
		var songs = [];
		var error = false;
		$('.uploadDetails').each(function(){
			if($(this).find('#title').val() === '' || $(this).find('#title').val() === ''){
				error = true;
				return false;
			}
			var song = {
				id: $(this).attr('id').substr(5, $(this).attr('id').length),
				title: $(this).find('#title').val(),
				artist: $(this).find('#artist').val(),
				cover: $(this).find('#cover').attr('src')
			}
			songs.push(song);
		});
		if(!error){
			$.post('/admin/addMultipleSong', {songs: songs}, function(){
				$('#songList').empty();
				$('#songListPanel').fadeOut();
				for(var i = 0; i<songs.length; i++){
					var newSong = $(
					  '<div draggable="true" class="list-group-item song songInfo" style="background: url('+songs[i].cover+');">'
					+ '<div class="songInfoText">'
					+ '<h5>'+songs[i].title+'</h5>'
					+ '<h6>'+songs[i].artist+'</h6>'
					+ '</div>'
					+ '</div>');
					$('#playlist').prepend(newSong).fadeIn();
				}
			});
		}
	});
});