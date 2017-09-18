var http = require('http')
var async = require('async')
require('string_format')
var AWS = require('aws-sdk')
var lambda = new AWS.Lambda({"region":"us-east-1"})

module.exports.get = (event, context, callback) => {
	var eventJSON = {}
	var tasks = [];
	
	for(let key in event){
		tasks.push(function(callback){
				var lambdaParams = {
					FunctionName : 'mejorge-dev-get-hero-series',
					InvocationType : 'RequestResponse',
					Payload: '{"heroId":"' +  event[key] + '"}'
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
			commonComics = getCommon(finalResponse[0],finalResponse[1])
			callback(null,commonComics)
		}
	});

};
