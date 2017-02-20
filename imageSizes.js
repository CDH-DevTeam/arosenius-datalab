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
	q: '_missing_: imagesize',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	processSizes();

});

var hitIndex = 0;
var processSizes = function() {
	console.log('processSizes: hitIndex: '+hitIndex);
	var hit = hits[hitIndex];

	var imagePath = config.gub_image_path+'/'+hit._source.image+'.'+config.image_type;

	console.log('readFileSync: '+imagePath);

	request.get({
		uri: imagePath,
		encoding: null
	}, function(err, resp, body) {
		if (err) {
			console.log(err);
			if (hitIndex < hits.length) {
				hitIndex++;

				processSizes();
			}
		}
		else {
			var imageData = body;

			console.log('new Canvas.Image');

			try {

				var image = new Canvas.Image;
				image.src = imageData;

				var canvas = new Canvas(image.width, image.height);

				hit._source.imagesize = {
					width: image.width,
					height: image.height
				};

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
						if (hitIndex < hits.length) {
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
			catch(e) {
				console.log(e);
				if (hitIndex < hits.length) {
					hitIndex++;

					processSizes();
				}
			}
		}
	});
};
