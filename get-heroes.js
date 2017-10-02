var http = require('http')
var async = require('async')
require('string_format')
var AWS = require('aws-sdk')
var lambda = new AWS.Lambda({"region":"us-east-1"})

module.exports.get = (event, context, callback) => {
	var url = "http://gateway.marvel.com/v1/public/characters";
	var pubKey = "b8dc1a3d05d7593f780bbe8d41bcfd7a";
	var ts = "1505721483"
	var hashKey = "0b3662ccb22d48eac391115575f7f9e3";

	var limit = 1;
	var finalUrl = url + "?apikey=" + pubKey + "&ts=" + ts + "&hash=" + hashKey + "&limit=" + limit; 

	http.get(finalUrl, (res) => {
		res.setEncoding('utf8');
		var responseData = "";

		res.on("data", (data) => {
			responseData += data;
		})

		res.on("end", (data) => {
			var heroesAmount = JSON.parse(responseData).data.total;

			tasks = getHeroesTasks(heroesAmount);
			
		async.parallel(tasks, function(error,data){
			if(error){
				console.log(error);
				callback(error);
			} else {
				var finalResponse =[] 
				for(let index =0; index < data.length; index++){
					var currentPayload = JSON.parse(data[index].Payload)
					finalResponse = finalResponse.concat(currentPayload[0])
				}
				callback(null,finalResponse)
			}
		});

		});
	});
};

var getHeroesTasks = function (heroesAmount) {
	tasks = []
	
	for(let i=0;i<=Math.ceil(heroesAmount/100);i++){
		tasks.push(function(callback){
				var lambdaParams = {
					FunctionName : 'mejorge-dev-get-hero-page',
					InvocationType : 'RequestResponse',
					Payload: '{"page":"' + i + '"}'
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

	return tasks;
}
