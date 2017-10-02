var http = require('http')
var async = require('async')
require('string_format')
var AWS = require('aws-sdk')
var lambda = new AWS.Lambda({"region":"us-east-1"})

module.exports.get = (event, context, callback) => {
	tasks = []
	
	for(let i=0;i<=15;i++){
		tasks.push(function(callback){
				var lambdaParams = {
					FunctionName : 'mejorge-dev-get-hero-page',
					InvocationType : 'RequestResponse',
					Payload: '{"limit":"100","page":"' + i + '"}'
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
};
