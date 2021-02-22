var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var Canvas = require('canvas');

var request = require("request");
var http = require('http');

var config = require('./config');

var data = [];

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

	processSizes();

});

var hitIndex = 0;
var processSizes = function() {
	console.log('processSizes: hitIndex: '+hitIndex);
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
			
				if (hitIndex < hits.length-1) {
					hitIndex++;
					processSizes();
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
		console.log(hit._id);
		console.log(hit._source.title);

		if (hit._source.images && hit._source.images.length > 0) {
			var image = hit._source.images[imageIndex];
			var imagePath = config.gub_image_path+'/'+image.image+'.'+config.image_type;

			console.log('load: '+imagePath);

			request.get({
				uri: imagePath,
				encoding: null
			}, function(err, resp, body) {
				if (err) {
					console.log(err);
					if (hit._source.images && imageIndex < hit._source.images.length-1) {
						imageIndex++;

						processImage();
					}
					else {
						writeDocAndContinue();
					}
				}
				else {
					var imageData = body;

					console.log('new Canvas.Image');

					try {

						var image = new Canvas.Image;
						image.src = imageData;
						console.log('image size: '+image.width+'x'+image.height);

						hit._source.images[imageIndex].imagesize = {
							width: image.width,
							height: image.height
						};
						console.log(hit._source.images[imageIndex]);
						if (hit._source.images && imageIndex < hit._source.images.length-1) {
							imageIndex++;

							processImage();
						}
						else {
							writeDocAndContinue();
						}
					}
					catch(e) {
						console.log('error');
						console.log(e);
						if (hit._source.images && imageIndex < hit._source.images.length-1) {
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
