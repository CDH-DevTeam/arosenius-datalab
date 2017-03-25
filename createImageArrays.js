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
	q: '_missing_: images',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	processHits();

});

var hitIndex = 0;

var processHits = function() {
	console.log('processHits: hitIndex: '+hitIndex);
	var hit = hits[hitIndex];

	var imageArray= [];
	imageObject = {};

	if (hit.image) {
		imageObject.image = hit.image;
	}
	if (hit.page) {
		imageObject.page = hit.page;
	}
	if (hit.imagesize) {
		imageObject.imagesize = hit.imagesize;
	}
	if (hit.color) {
		imageObject.color = hit.color;
	}

	imageArray.push(imageObject);

	console.log(imageArray);
	
	if (hitIndex < hits.length-1) {
		hitIndex++;
		processHits();
	}

	return;

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
				processHits();
			}
		});
	}).on("error", function(e){
		console.log("Got error: " + e.message);
	});
};