var http = require('http')
var async = require('async')
require('string_format')
var AWS = require('aws-sdk')
var s3 = new AWS.S3()
var lambda = new AWS.Lambda({"region":"us-east-1"})
var bucketName = "mejorge-hero-info"

module.exports.get = (event, context, callback) => {
	var objectKey = getKeyFromIds(event.hero1.id, event.hero2.id);

	checkIfObjectExists(objectKey, function(exists){
		if(exists){
			obtainCommonFromBucket(objectKey, callback);
		} else {
			obtainCommonFromApi(event.hero1, event.hero2, callback);
		}
	});
};

function saveResultsOnBucket(results, objectKey, callback){

	var params = {
		Body: JSON.stringify(results),
		Bucket: bucketName,
  		Key: objectKey,
		ACL: "public-read",
		ContentType: "application/json",
 	};

 	s3.putObject(params, function(err, data) {
   		if (err){
			callback(err);
		} else {
			callback(null, results);
		}
   	});
}

function obtainCommonFromBucket(objectKey, callback){

	var params = {
  		Bucket: bucketName, 
  		Key: objectKey,
 	};

 	s3.getObject(params, function(err, data) {
		if (err){
			console.log(err, err.stack); 
			callback(err);
		} else {
			response = JSON.parse(data.Body.toString('utf-8'));
			
			callback(null, response);
		}
 	});	
}

function obtainCommonFromApi (hero1, hero2, callback){

	var lambdaParams = {
		FunctionName : 'mejorge-dev-get-series-from-api',
		InvocationType : 'RequestResponse',
		Payload: '{"hero1":' + JSON.stringify(hero1) + ',"hero2":' + JSON.stringify(hero2) + '}'
	}

	lambda.invoke(lambdaParams, function(error,data){
		if(error){
			callback(error)
		} else{
			objectKey = getKeyFromIds(hero1.id, hero2.id);
			saveResultsOnBucket(JSON.parse(data.Payload), objectKey, callback);
		}
	})
}


function checkIfObjectExists (objectKey, callback) {
	 var params = {
  		Bucket: bucketName,
  		Key: objectKey
	 };

 	s3.headObject(params, function(err, data) {
   		if (err) {
			callback(false);
		} else {
			callback(true);
		}
  	 });
}

function getKeyFromIds(id1, id2){
	return id1 < id2
		? id1 + "-" + id2 + "-series.json"
		: id2 + "-" + id1 + "-series.json"
}
