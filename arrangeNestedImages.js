var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

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
	index: (process.argv[2] || 'arosenius'),
	type: 'artwork',
	q: '_type: artwork AND collection.museum: Nationalmuseum',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	sortImages();

});

var hitIndex = 0;
var sortImages = function() {
	console.log('sortImages: hitIndex: '+hitIndex);
	var hit = hits[hitIndex];

	var imageIndex = 0;

	var writeDocAndContinue = function() {

		var options = {
			host: '127.0.0.1',
			port: 9200,
			path: '/'+(process.argv[2] || 'arosenius')+'/artwork/'+hit._id+'/_update',
			method: 'POST'
		};

		var req = http.request(options, function(resp) {
			console.log('update '+hit._id);
			resp.on('data', function(chunk){
				console.log('resp.on: data');
				console.log('hitIndex: '+hitIndex+', hits.length: '+hits.length);
			
				if (hitIndex < hits.length-1) {
					hitIndex++;
					sortImages();
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

	if (_.filter(hit._source.images, function(image) {
		return image.image.indexOf('recto') > -1 || image.image.indexOf('verso') > -1;
	}).length > 0) {	
		hit._source.images.sort(function(image1, image2) {
			if (image1.image.indexOf('recto') > -1) {
				return 0;
			}
			else if (image1.image.indexOf('verso') > -1) {
				return 1;
			}
			else {
				return true;
			}
		});
	}

	writeDocAndContinue();
};
