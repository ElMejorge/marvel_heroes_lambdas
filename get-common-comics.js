var http = require('http')
var async = require('async')
require('string_format')
var AWS = require('aws-sdk')
var lambda = new AWS.Lambda({"region":"us-east-1"})

module.exports.get = (event, context, callback) => {
	var eventJSON = {}
	var tasks = [];

	tasks = [
		getHeroComics(event.hero1["id"],event.hero1["comicAmount"]),
		getHeroComics(event.hero2["id"],event.hero2["comicAmount"]),
	];
	
	async.parallel(tasks, function(error,data){
		if(error){
			console.log(error);
			callback(error);
		} else {
			var finalResponse =[] 
			for(let index =0; index < data.length; index++){
				var currentPayload = JSON.parse(data[index].Payload)
				finalResponse.push(currentPayload)
			}

			// Loop through the smaller array so that the process is shorter
			if(finalResponse[0].length < finalResponse[1].length){
				var commonComics = getCommon(finalResponse[0],finalResponse[1])
			} else {
				var commonComics = getCommon(finalResponse[1],finalResponse[0])
			}

			callback(null,commonComics)
		}
	});

};
	
function getCommon(series1, series2){
		commonSeries = []
		
		for(var key in series1){
			if (key in series2){
				commonSeries.push({
					id:key,
					title:series1[key]
				});
			}
		}
		return commonSeries
	}

var getHeroComics = function(heroId,comicAmount) {
	return (function(callback){
				var lambdaParams = {
					FunctionName : 'mejorge-dev-get-hero-comics',
					InvocationType : 'RequestResponse',
					Payload: '{"hero":' +  heroId + ',"comicAmount":' + comicAmount + '}'
				}
				lambda.invoke(lambdaParams, function(error,data){
				if(error){
					callback(error)
				} else{
					callback(null,data)
				}
			})
	})
}

