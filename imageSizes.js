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
	index: 'arosenius',
	type: 'artwork',
	q: 'collection.museum: Nationalmuseum',
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
			path: '/arosenius/artwork/'+hit._id+'/_update',
			method: 'POST'
		};

		var req = http.request(options, function(resp) {
			console.log('update '+hit._id);
			resp.on('data', function(chunk){
				console.log('resp.on: data');
				console.log('hitIndex: '+hitIndex+', hits.length: '+hits.length);
			
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
		console.log(hit);
		console.log('hit._source.images.length: '+hit._source.images.length);
		console.log('imageIndex < hit._source.images.length = '+(imageIndex < hit._source.images.length));
		console.log(hit._source.images[imageIndex]);
		console.log(hit._source.title);
		var image = hit._source.images[imageIndex];

		if (image) {
			var imagePath = config.gub_image_path+'/'+image.image+'.'+config.image_type;

			console.log('load: '+imagePath);

			request.get({
				uri: imagePath,
				encoding: null
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
					var imageData = body;

					console.log('new Canvas.Image');

					try {

						var image = new Canvas.Image;
						image.src = imageData;

						hit._source.images[imageIndex].imagesize = {
							width: image.width,
							height: image.height
						};

						if (imageIndex < hit._source.images.length-1) {
							imageIndex++;

							processImage();
						}
						else {
							writeDocAndContinue();
						}
					}
					catch(e) {
						console.log(e);
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
			if (imageIndex < hit._source.images.length-1) {
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
