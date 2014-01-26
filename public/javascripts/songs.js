$(document).ready(function(){
	$('#playlist, #songlist').sortable({
		connectWith : '.connected'
	});
	var newPlaylist = [];
	$('#save-btn').click(function(e){
		e.preventDefault();
		$('#playlist').find('.list-group-item').each(function(){
			newPlaylist.push($(this).attr('id'));
			console.log(newPlaylist);
		});
		$.post(document.URL, {idList : newPlaylist}, function(data){
			location.reload();
		});
	})
});