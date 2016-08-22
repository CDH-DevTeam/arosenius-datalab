var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');
var Canvas = require('canvas');
var colorThief = require('thief');

var colors = require('./arosenius.color_utils');
var config = require('./config');

var data = [];

var insertCounter = 0;

fs.readdir(config.gub_json_path, _.bind(function(err, files) {
	_.each(files, function(file) {
		var fileData = fs.readFileSync(config.gub_json_path+'/'+file, 'utf8');
		data.push(JSON.parse(fileData));
	});

	var bundleData = [];

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

		console.log(file.letter_sender_name_given);

		_.each(file.files, function(imagePack) {
			bundleData.push({
				bundle: file.meta.mets_ID+'-'+imagePack.metadata.hd_id,
				title: imagePack.metadata.physdesc,
				description: imagePack.metadata.note,//
				collection: {
					museum: 'Göteborgs universitetbibliotek',
					archive_item: {
						title: file.meta.archive_unit_title,
						archive_physloc: file.meta.archive_physloc
					}
				}
			});
			_.each(imagePack.images, function(image) {
				var imageDocument = {
					bundle: file.meta.mets_ID+'-'+imagePack.metadata.hd_id, //
					type: file.meta.letter_sender_name_given && file.meta.letter_sender_name_given != '' ? 'letter' : '',
					sender: file.meta.letter_sender_name_given && file.meta.letter_sender_name_given != '' ? {
						firstname: file.meta.letter_sender_name_given,
						surname: file.meta.letter_sender_name_family,
						birth_year: senderBirthYear,
						death_year: senderDeathYear
					} : null,
					recipient: file.meta.letter_recipient_name_given && file.meta.letter_sender_name_given != '' ? {
						firstname: file.meta.letter_recipient_name_given,
						surname: file.meta.letter_recipient_name_family,
						birth_year: recipientBirthYear,
						death_year: recipientDeathYear
					} : null,
					date: file.meta.letter_image_unitdate && file.meta.letter_image_unitdate != '' ? {
							date: file.meta.letter_image_unitdate
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
					museum_int_id: [
						file.meta.mets_ID,
						imagePack.metadata.hd_id,
						image.id
					],
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
					image: file.meta.mets_ID+'-'+image.id.replace('web', '')
				};

				if (config.insert_limit) {
					if (insertCounter < 30) {
						dbData.push(imageDocument);
					}
				}
				else {
					dbData.push(imageDocument);
				}
				insertCounter++;
			});
		})
	});

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

	_.each(bundleData, function(item, index) {
		bulkBody.push({
			create: {
				_index: 'arosenius',
				_type: 'bundle'
			}
		});
		bulkBody.push(item);
	});

	var client = new elasticsearch.Client({
		host: config.host,
		log: 'trace'
	});

	client.bulk({
		body: bulkBody
	});

}, this));
