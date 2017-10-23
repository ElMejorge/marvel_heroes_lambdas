var http = require('http');
var async = require('async');
require('string_format');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var lambda = new AWS.Lambda({"region":"us-east-1"});
var dynamodb = new AWS.DynamoDB({"region":"us-east-1"});
var tableName = "mejorge-marvel-log";
var bucketName = "mejorge-hero-info";
var UUID = require('uuid-js');
var itemData = {};

module.exports.get = (event, context, callback) => {
	itemData = {
		"Id":UUID.create(),
		"StartTime":new Date().getTime(),
		"Character1":event.hero1.id,
		"Character2":event.hero2.id,
		"SingleQuantity": Math.ceil(event.hero1.comicAmount/100) + Math.ceil(event.hero2.comicAmount/100) 
	};

	var objectKey = getKeyFromIds(event.hero1.id, event.hero2.id);

	logLambdaDataToDynamo(itemData);	

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
		FunctionName : 'mejorge-dev-get-comics-from-api',
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

function logLambdaDataToDynamo(data){
	item = {
		"Id":{
			S:'' + data["Id"]
		},
		"StartTime":{
			S:'' + data["StartTime"]
		},
		"EndTime":{
			S:'' + new Date().getTime(),
		},
		"SingleQuantity":{
			N:'' + data["SingleQuantity"]
		},
		"Character1":{
			S:'' + data["Character1"]
		},
		"Character2":{
			S:"" + data["Character2"]
		},
		//"MemoryReserved":{
			//N:data["MemoryReserved"]
		//},
		//"MemoryUsed":{
			//N:data["MemoryUsed"]
		//}
	};
	
	var params = {
		Item: item,
		TableName: "mejorge-marvel-log",
		ReturnConsumedCapacity: "TOTAL"
	};

	dynamodb.putItem(params, function(err, data) {
		if (err) console.log(err, err.stack);
		else console.log(data);
	});
}

function getKeyFromIds(id1, id2){
	return id1 < id2
		? id1 + "-" + id2 + "-comics.json"
		: id2 + "-" + id1 + "-comics.json"
}
