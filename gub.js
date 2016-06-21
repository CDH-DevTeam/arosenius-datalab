var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');
var Canvas = require('canvas');
var colorThief = require('thief');

var colors = require('./arosenius.color_utils');
var config = require('./config');

var client = new elasticsearch.Client({
	host: config.host
});

var data = [];

fs.readdir(config.gub_json_path, _.bind(function(err, files) {
	_.each(files, function(file) {
		var fileData = fs.readFileSync(config.gub_json_path+'/'+file, 'utf8');
		data.push(JSON.parse(fileData));
	});

	var dbData = [];

	_.each(data, function(file) {
		var senderBirthYear = '';
		var senderDeathYear = '';

		if (file.meta.letter_sender_name_date.indexOf('-') > -1) {
			var senderYears = file.meta.letter_sender_name_date.split('-');
			senderBirthYear = senderYears[0];
			senderDeathYear = senderYears[1];
		}

		var recipientBirthYear = '';
		var recipientDeathYear = '';

		if (file.meta.letter_recipient_name_date.indexOf('-') > -1) {
			var recipientYears = file.meta.letter_recipient_name_date.split('-');
			recipientBirthYear = recipientYears[0];
			recipientDeathYear = recipientYears[1];
		}

		_.each(file.files, function(imagePack) {
			_.each(imagePack.images, function(image) {

				var imageDocument = {
					bundle: file.meta.mets_ID, //
					type: file.letter_sender_name_given && file.letter_sender_name_given != '' ? 'letter' : '',
					sender: file.letter_sender_name_given && file.letter_sender_name_given != '' ? {
						firstname: file.meta.letter_sender_name_given,
						surname: file.meta.letter_sender_name_family,
						birth_year: senderBirthYear,
						death_year: senderDeathYear
					} : null,
					recipient: file.letter_recipient_name_given && file.letter_sender_name_given != '' ? {
						firstname: file.meta.letter_recipient_name_given,
						surname: file.meta.letter_recipient_name_family,
						birth_year: recipientBirthYear,
						death_year: recipientDeathYear
					} : null,
					date: file.meta.letter_unitdate && file.meta.letter_unitdate != '' ? {
							date: file.meta.letter_unitdate
						} : {
							date: file.meta.document_unitdate
						},
					title: file.meta.document_unittitle, //
					subtitle: imagePack.metadata.physdesc,
					description: imagePack.metadata.note,//
					serie: '',
					format: {},
					technic: null,
					material: null,
					collection: {
						museum: 'Göteborgs universitetbibliotek',
						archive_item: {
							title: file.meta.archive_unit_title,
							archive_physloc: file.meta.archive_physloc
						}
					},
					museum_int_id: file.meta.mets_ID,
					licence: '',
					acquisition: null,
					signature: null,
/*
					color: {
						dominant: image.dominantColor,
						colors: image.colors
					},
*/
					page: {
						id: image.id,
						side: image.type
					},
					image: 'gub-'+file.meta.mets_ID+'-'+image.id
				};

				var imagePath = config.gub_image_path+'/'+file.meta.mets_ID+'/web/'+image.id.replace('web', '')+'.jpg';

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

				imageDocument.color = colorData;

				client.bulk({
					body: [
						{
							create: {
								_index: 'arosenius',
								_type: 'artwork'
							}
						},
						imageDocument
					]
				});

//				dbData.push(imageDocument);
			});
		})
	});
/*
	var bulkBody = [];

	_.each(dbData, function(item, index) {
		bulkBody.push({
			create: {
				_index: 'arosenius',
				_type: 'artwork'
			}
		});
		bulkBody.push(item);
	});

	client.bulk({
		body: bulkBody
	});
*/
}, this));
