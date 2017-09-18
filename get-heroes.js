var http = require('http')

module.exports.get = (event, context, callback) => {
	var url = "http://gateway.marvel.com/v1/public/characters";
	var pubKey = "b8dc1a3d05d7593f780bbe8d41bcfd7a";
	var ts = "1505721483"
	var hashKey = "0b3662ccb22d48eac391115575f7f9e3";

	var limit = event.limit ? event.limit : 40;
	var page = event.page ? event.page : 1;

	var finalUrl = url + "?apikey=" + pubKey + "&ts=" + ts + "&hash=" + hashKey + "&limit=" + limit;


	http.get(finalUrl, (res) => {
		res.setEncoding('utf8');
		var responseData = "";

		res.on("data", (data) => {
			responseData += data;
		})

		res.on("end", (data) => {
			var heroes = JSON.parse(responseData).data.results
			var heroesRes = [];

			heroesRes.push(heroes.map(
				function(evt){
					return {"name":evt.name}
				})
			)

			callback(null, heroesRes);
			});
	});
};
