function handleDragStart(e){
	console.log('drag');
}

$(document).ready(function(){
	$('#playlist, #songlist').sortable({
		connectWith : '.connected'
	});
});