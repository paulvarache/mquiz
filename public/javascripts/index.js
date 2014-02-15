$(document).ready(function(){

  $.get('https://api.github.com/repos/paulvarache/mquiz/git/refs/heads/master', function(data){
    var id = data.object.sha;
    $.get('https://api.github.com/repos/paulvarache/mquiz/git/commits/'+id, function(lastCommit){
      $('#last-commit').html('Derniers ajouts: '+lastCommit.message);
    })
  })

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
 	* Definition of the actions to perform on the page elements
  	*/
  	$('#gravatar').on('keyup change', function(){
  		defaultAvatarAutoHide($(this).val());
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
        $('#login-screen').fadeOut();
        form.submit();
      }
  	});
});

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