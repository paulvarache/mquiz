$(document).ready(function(){
	$('#add-salon').click(function(e){
		e.preventDefault();
		$('#salonPanel').slideToggle();
		$('html, body').animate({
			scrollTop : $('#salonPanel').offset().top
		}, 1000);
	});
	$('#salonForm').validate({
		rules : {
			name : {
				required : true,
				minlength : 4,
				maxlength : 24
			},
			playlist : {
				required : true,
			},
			players : {
				required : true,
				digits : true,
				min : 2,
				max : 6,
			},
			songlistLength : {
				required : true,
				digits : true,
				min : 5,
				max : 15
			},
			password : {
				required : false,
				minlength : 4,
				maxlength : 24
			}
		},
		submitHandler : function(form){
			form.submit();
		}
	});
	$('.connect').each(function(){
		$(this).click(function(){
			var passwd = $('#passwd-'+$(this).attr('id')).val();
			$.get('/checkPasswd/'+$(this).attr('id')+'/'+passwd, function(data){
				if(data.access == 'granted'){
					window.location = "/play/"+data.id;
				}else{
					$('#passwd-'+data.id).animate({'margin-left' : '10px'}, 25)
							.animate({'margin-left' : '-10px'}, 50)
							.animate({'margin-left' : '0px'}, 25);
				}
			});
		});
	});
	$('.passwd-link').each(function(){
		$(this).click(function(e){
			e.preventDefault();
			$("#form-"+$(this).attr('id')).slideToggle();
		})
	})
});