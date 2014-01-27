$(document).ready(function(){
	$('#add-salon').click(function(){
		$(this).slideUp();
		$('#salonForm').slideToggle();
	})
	$('#salonForm').validate({
		rules : {
			name : {
				required : true,
				minLength : 4,
				maxLength : 24
			},
			playlist : {
				required : true
			},
			players : {
				required : true,
				min : 2,
				max : 6
			},
			songlistLength : {
				required : true,
				min : 5,
				max : 15
			}
		}
	});
});