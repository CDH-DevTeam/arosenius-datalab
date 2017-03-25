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

	if (hit._source.image) {
		imageObject.image = hit._source.image;
	}
	if (hit._source.page) {
		imageObject.page = hit._source.page;
	}
	if (hit._source.imagesize) {
		imageObject.imagesize = hit._source.imagesize;
	}
	if (hit._source.color) {
		imageObject.color = hit._source.color;
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