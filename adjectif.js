var Adjectif = require('./model').Adjectif;

var vowels = ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'h'];
var endings = ['x', 'f'];

exports.getName = function(original, gender, callback){
	gender = gender || false;
	var rand = Math.random();
	Adjectif.findOne({random : {$gte : rand}}, function(err, doc1){
		if(err){
			console.log(err)
		}else{
			if(!doc1){
				Adjectif.findOne({random : {$gte : rand}}, function(err, doc2){
					if(err){
						console.log(err)
					}else{
						var name = buildName(original, gender, doc2);
						callback(name);
					}
				});
			}else{
				var name = buildName(original, gender, doc1);
				callback(name);
			}
		}
	});
}

var buildName = function(original, gender, adjectif){
	var firstLetter = adjectif.base[0].toLowerCase();
	var lastLetter = adjectif.base[adjectif.base.length - 1].toLowerCase();
	var pre = '';
	if(vowels.indexOf(firstLetter) === -1){//not a vowel
		pre = gender ? ' la ' : ' le ';
	}else{
		pre = ' l\'';
	}
	if(gender && endings.indexOf(lastLetter) !== -1){
		adjectif.base = adjectif.base.substring(0, adjectif.base.length - 1);
	}
	var post = adjectif.base.toLowerCase();
	post += gender ? adjectif.feminin : '';
	return original + pre + post;
}