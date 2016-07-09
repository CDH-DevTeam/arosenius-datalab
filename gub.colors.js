var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');
var Canvas = require('canvas');
var colorThief = require('thief');
var request = require("request");
var http = require('http');

var colors = require('./arosenius.color_utils');
var config = require('./config');

var data = [];

var client = new elasticsearch.Client({
	host: config.host,
	log: 'trace'
});

var hits = [];

client.search({
	index: 'arosenius',
	type: 'artwork',
	q: 'collection.museum: "Göteborgs universitetbibliotek"',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	processColors();

});

var hitIndex = 0;
var processColors = function() {
	console.log('processColors: hitIndex: '+hitIndex);
	var hit = hits[hitIndex];

	var imagePath = config.gub_image_path+'/'+hit._source.image+'.'+config.image_type;

	console.log('readFileSync: '+imagePath);
	request.get({
		uri: imagePath,
		encoding: null
	}, function(err, resp, body) {
		if (err) {
			return;
		}
		else {
			var imageData = body;

			console.log('new Canvas.Image');
			var image = new Canvas.Image;
			image.src = imageData;

			var canvas = new Canvas(image.width, image.height);
			var ctx = canvas.getContext('2d');

			console.log('ctx.drawImage');
			ctx.drawImage(image, 0, 0, image.width, image.height);

			var imageColors3 = _.map(colorThief.createPalette(canvas, 3), function(color) {
					return colors.colorObject(color);
			});
			var imageColors5 = _.map(colorThief.createPalette(canvas, 5), function(color) {
					return colors.colorObject(color);
			});
			var imageColors8 = _.map(colorThief.createPalette(canvas, 8), function(color) {
					return colors.colorObject(color);
			});
			var dominantColor = colors.colorObject(colorThief.getDominantColor(canvas));

			var colorData = {
				dominant: dominantColor,
				colors: {
					three: imageColors3,
					five: imageColors5,
					five_mapped: _.map(imageColors5, function(color) {
						var mappedColor = colors.mapColorToPalette(color.rgb);

						return colors.colorObject(mappedColor);
					}),
					eight_mapped: _.map(imageColors8, function(color) {
						var mappedColor = colors.mapColorToPalette(color.rgb);

						return colors.colorObject(mappedColor);
					}),
				}
			};

			hit._source.color = colorData;

			var options = {
				host: '127.0.0.1',
				port: 9200,
				path: '/arosenius/artwork/'+hit._id+'/_update',
				method: 'POST'
			};

			var req = http.request(options, function(resp){
				resp.on('data', function(chunk){
					console.log('resp.on: data');
					console.log('hitIndex: '+hitIndex+', hits.length: '+hits.length);
			    	if (hitIndex < hits.length) {
			    		hitIndex++;

			    		processColors();
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
	});
};