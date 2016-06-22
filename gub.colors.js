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

client.search({
	index: 'arosenius',
	type: 'artwork',
	q: 'collection.museum: "Göteborgs universitetbibliotek"',
	size: 10000
}, function(err, response) {
	_.each(response.hits.hits, function(hit) {
		var imagePath = config.gub_image_path+'/'+hit._source.bundle+'/web/'+hit._source.page.id.replace('web', '')+'.'+config.image_type;

		console.log('readFileSync: '+imagePath);
		var imageData = fs.readFileSync(imagePath);

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
		var imageColors10 = _.map(colorThief.createPalette(canvas, 10), function(color) {
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
				ten: imageColors10,
				ten_mapped: _.map(imageColors10, function(color) {
					var mappedColor = colors.mapColorToPalette(color.rgb);

					return colors.colorObject(mappedColor);
				})
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
		    	console.log(chunk);
			});
		}).on("error", function(e){
			console.log("Got error: " + e.message);
		});

		req.write(JSON.stringify({
			doc: hit._source
		}));
		req.write('\n');
		req.end();
/*
		request({
			url: 'http://127.0.0.1:9200/arosenius/artwork/'+hit._id+'/_update',
			method: "POST",
			json: true,
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				doc: hit._source
			})
		},  function (error, response, body) {
			console.log('request callBack');

			if (error) {
				console.log(error);
			}
			console.log(response);
		});
*/
	});
});
