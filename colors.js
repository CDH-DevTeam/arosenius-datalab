var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var Canvas = require('canvas');
var colorThief = require('thief');
var Vibrant = require('node-vibrant');
var chroma = require('chroma-js');

var request = require("request");
var http = require('http');

var colors = require('./arosenius.color_utils');
var config = require('./config');

var data = [];

var client = new elasticsearch.Client({
	host: config.host,
//	log: 'trace'
});

var hits = [];

console.log(process.argv[2])

client.search({
	index: config.index,
	type: 'artwork',
	q: process.argv[2] || '*',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	processColors();

});

var hitIndex = 0;
var processColors = function() {
	console.log('processColors: hitIndex: '+hitIndex);
	var hit = hits[hitIndex];

	var imageIndex = 0;

	var writeDocAndContinue = function() {
		console.log(hit.images);

		 if (hit._source.images && hit._source.images[0]) {
			hit._source.color = hit._source.images[0].color;
		}

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

	var processImage = function() {
		console.log('imageIndex: '+imageIndex);
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
						var dominantColor = colors.colorObject(colorThief.getDominantColor(canvas));

						var vibrant = new Vibrant(imagePath);

						var vibrantColors = [];

						vibrant.getPalette(function(err, swatches) {
							for (var swatch in swatches) {
								if (swatches.hasOwnProperty(swatch) && swatches[swatch]) {
									var hex = swatches[swatch].getHex();
									var hsv = chroma(hex).hsv();

									var temperature = chroma(hex).temperature();

									vibrantColorObj = {
										rgb: chroma(hex).rgb(),
										hex: hex,
										hsv: {
											h: !hsv[0] || hsv[0] == null || typeof hsv[0] === 'null' || Math.round(hsv[0]) == null ? 0 : Math.round(hsv[0]), 
											s: !hsv[1] || hsv[1] == null || typeof hsv[1] === 'null' || Math.round(hsv[1]*100) == null ? 0 : Math.round(hsv[1]*100), 
											v: !hsv[2] || hsv[2] == null || typeof hsv[2] === 'null' || Math.round(hsv[2]*100) == null ? 0 : Math.round(hsv[2]*100)
										},
										population: swatches[swatch].getPopulation(),
										temperature: temperature
									};
									vibrantColors.push(vibrantColorObj);
								}
							}
							var colorData = {
								dominant: dominantColor,
								colors: {
									three: imageColors3,
									five: imageColors5,
									prominent: vibrantColors
								}
							};

							hit._source.images[imageIndex].color = colorData;

							if (imageIndex < hit._source.images.length-1) {
								imageIndex++;

								processImage();
							}
							else {
								writeDocAndContinue();
							}
						});
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
