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
	index: 'arosenius_v4',
	type: 'artwork',
	q: '*',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	processItem();

});

var hitIndex = 0;
var processItem = function() {
	var hit = hits[hitIndex];

	var imageIndex = 0;

	var options = {
		host: '127.0.0.1',
		port: 9200,
		path: '/arosenius_v3_reindexed_test/artwork/'+hit._id+'/_update',
		method: 'POST'
	};

	var req = http.request(options, function(resp) {
		console.log('update '+hit._id);
		resp.on('data', function(chunk){
			console.log('resp.on: data');
			console.log('hitIndex: '+hitIndex+', hits.length: '+hits.length);
		
			if (hitIndex < hits.length-1) {
				hitIndex++;
				processItem();
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
};
