var clickAction = function(link){
		link.click(function(e){
			e.preventDefault();
			var link = $(this);
			$.get('playlist/delete/'+link.attr('id'), function(data){
				link.parent().parent().slideToggle();
			})
		});
	};
$(document).ready(function(){
	$('.delete-link').each(function(){clickAction($(this))});
	var playlistForm = $('#playlist-form');
	playlistForm.submit(function(e){
		e.preventDefault();
	})
	playlistForm.validate({
		rules : {
			name : {
				required : true,
				minlength : 4,
				maxlength : 22
			},
			difficulty : {
				required : true,
				number : true,
				min : 1,
				max : 5
			}
		},
		submitHandler : function(){
			$.post(
				playlistForm.attr('action'),
				playlistForm.serialize(),
				function(data){
					var line = $(data);
					line.find('.delete-link').each(function(){clickAction($(this))});
					console.log(data);
					console.log(line);
					$('#playlists').append(line);
					line.hide().slideToggle();
					$('#name').empty();
					$('#difficulty').empty();
				});
		}
	});
});