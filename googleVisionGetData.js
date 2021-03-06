var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');
var chroma = require('chroma-js');

var request = require("request");
var http = require('http');

var config = require('./config');

var data = [];

var googleApiUrl = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDlo-tkY-7MKxbT7zls6lAN_fx3zqdcKM4';

var client = new elasticsearch.Client({
	host: config.host,
//	log: 'trace'
});

var hits = [];

client.search({
	index: config.index,
	type: 'artwork',
	q: process.argv[2] || '*',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	processDocument();

});

var hitIndex = 0;
var processDocument = function() {
	console.log('processDocument: hitIndex: '+hitIndex);
	var hit = hits[hitIndex];

	var imageIndex = 0;

	var writeDocAndContinue = function() {
		console.log(hit.images);
		var options = {
			host: '127.0.0.1',
			port: 9200,
			path: '/'+config.index+'/artwork/'+hit._id+'/_update',
			method: 'POST'
		};

		var req = http.request(options, function(resp) {
			console.log('update '+hit._id);
			resp.on('data', function(chunk){
				console.log('resp.on: data');
				console.log('hitIndex: '+hitIndex+', hits.length: '+hits.length);

				if (hitIndex < hits.length-1) {
					hitIndex++;
					processDocument();
				}
			});
		}).on("error", function(e){
			console.log("Got error: " + e.message);
		});

		req.write(JSON.stringify({
			doc: hit._source
		}));
		req.write('\n');
		req.end();
	}

	var processImage = function() {
		console.log('imageIndex: '+imageIndex);
		if (hit._source.images && hit._source.images[imageIndex]) {
			console.log('hit._source.images.length: '+hit._source.images.length);
			console.log('imageIndex < hit._source.images.length = '+(imageIndex < hit._source.images.length));
		}
		console.log(hit._source.title);
		console.log(hit._id+' : '+hit._source.title);
		var image = hit._source.images && hit._source.images[imageIndex] ? hit._source.images[imageIndex] : null;

		if (image) {
			var imagePath = config.image_path_1000x+'/'+image.image+'.'+config.image_type;

			console.log('Get data for: '+imagePath);

			var apiParams = {
				"requests":[
					{
						"image":{
							"source":{
								"imageUri": imagePath
							}
						},
						"features":[
							{
								"type": "IMAGE_PROPERTIES"
							}
						]
					}
				]
			};

			request({
				method: 'post',
				url: googleApiUrl,
				json: apiParams
			}, function(err, resp, body) {
				if (err) {
					console.log(err);
					if (imageIndex < hit._source.images.length-1) {
						imageIndex++;

						processImage();
					}
					else {
						writeDocAndContinue();
					}
				}
				else {
					console.log(body);
//					return;

					if (body.responses[0].error) {
						if (imageIndex < hit._source.images.length-1) {
							imageIndex++;

							processImage();
						}
						else {
							writeDocAndContinue();
						}
					}
					else {
						var colors = _.map(body.responses[0].imagePropertiesAnnotation.dominantColors.colors, function(color) {
							var hsv = chroma(color.color.red, color.color.green, color.color.blue).hsl();
								color.hsv = {
									h: !hsv[0] || hsv[0] == null || typeof hsv[0] === 'null' || Math.round(hsv[0]) == null ? 0 : Math.round(hsv[0]),
									s: !hsv[1] || hsv[1] == null || typeof hsv[1] === 'null' || Math.round(hsv[1]*100) == null ? 0 : Math.round(hsv[1]*100),
									v: !hsv[2] || hsv[2] == null || typeof hsv[2] === 'null' || Math.round(hsv[2]*100) == null ? 0 : Math.round(hsv[2]*100)
								};
								return color;
						});
						hit._source.images[imageIndex].googleVisionColors = colors;

						if (imageIndex == 0) {
							hit._source.googleVisionColors = colors;
						}

						if (imageIndex < hit._source.images.length-1) {
							imageIndex++;

							processImage();
						}
						else {
							writeDocAndContinue();
						}
					}
				}
			});
		}
		else {
			if (hit._source.images && imageIndex < hit._source.images.length-1) {
				imageIndex++;

				processImage();
			}
			else {
				writeDocAndContinue();
			}
		}
	}

	processImage();
};
