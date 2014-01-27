$(document).ready(function(){
	$('#playlist, #songlist').sortable({
		connectWith : '.connected'
	});
	var newPlaylist = [];
	$('#save-btn').click(function(e){
		e.preventDefault();
		$('#playlist').find('.list-group-item').each(function(){
			newPlaylist.push($(this).attr('id'));
		});
		if(newPlaylist.length < 5){
			$('#error').html('La playlist doit contenir au moins 5 musiques');
			return;
		}
		$.post(document.URL, {idList : newPlaylist}, function(data){
			location.reload();
		});
	})
});