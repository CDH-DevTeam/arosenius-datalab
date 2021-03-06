var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var colors = require('./arosenius.color_utils');
var config = require('./config');

var data = [];

var insertCounter = 3295;
var batchNumber = 2;

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
				bundle: file.meta.mets_ID+(imagePack.metadata && imagePack.metadata.hd_id ? '-'+imagePack.metadata.hd_id : ''),
				title: imagePack.metadata.physdesc,
				description: imagePack.metadata.note,//
				collection: {
					museum: 'Göteborgs universitetsbibliotek',
					archive_item: {
						title: file.meta.archive_unit_title,
						archive_physloc: file.meta.archive_physloc
					}
				}
			});
			_.each(imagePack.images, function(image) {
				var imageDocument = {
					bundle: file.meta.mets_ID+(imagePack.metadata && imagePack.metadata.hd_id ? '-'+imagePack.metadata.hd_id : ''), //
					type: [
						file.meta.letter_sender_name_given && file.meta.letter_sender_name_given != '' ? 'brev' : 
						file.meta.document_unittitle.toLowerCase().indexOf('fotograf') > -1 ? 'fotografi' :
						''
					],
					sender: file.meta.letter_sender_name_given && file.meta.letter_sender_name_given != '' ? {
//						firstname: file.meta.letter_sender_name_given,
//						surname: file.meta.letter_sender_name_family,
						name: file.meta.letter_sender_name_given+' '+file.meta.letter_sender_name_family,
						birth_year: senderBirthYear,
						death_year: senderDeathYear
					} : null,
					recipient: file.meta.letter_recipient_name_given && file.meta.letter_sender_name_given != '' ? {
//						firstname: file.meta.letter_recipient_name_given,
//						surname: file.meta.letter_recipient_name_family,
						name: file.meta.letter_recipient_name_given+' '+file.meta.letter_recipient_name_family,
						birth_year: recipientBirthYear,
						death_year: recipientDeathYear
					} : null,
					date: file.meta.letter_recipient_name_given && file.meta.letter_sender_name_given && imagePack.metadata.searchdate && imagePack.metadata.searchdate != '' ?
						{
							date: imagePack.metadata.searchdate
						} :	file.meta.letter_image_unitdate && file.meta.letter_image_unitdate != '' ? {
							date: file.meta.letter_image_unitdate
						} : file.meta.letter_image_searchdate && file.meta.letter_image_searchdate != '' ? {
							date: file.meta.letter_image_searchdate
						} : file.meta.document_unitdate && file.meta.document_unitdate != '' ? {
							date: file.meta.document_unitdate
						} : {
							date: file.meta.document_searchdate
						},
					title: file.meta.document_unittitle, //
					subtitle: imagePack.metadata.physdesc,
					description: imagePack.metadata.note,//
					serie: '',
					format: {},
					persons: [],
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
						side: image.type,
						order: image.order
					},
					image: file.meta.mets_ID+'-'+image.id.replace('web', ''),
					insert_id: insertCounter,
					batchnumber: batchNumber
				};

				if (imageDocument.sender && imageDocument.sender.name) {
					imageDocument.persons.push(imageDocument.sender.name);
				}
				if (imageDocument.recipient && imageDocument.recipient.name) {
					imageDocument.persons.push(imageDocument.recipient.name);
				}

				console.log(imageDocument.date);

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
