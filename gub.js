var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: config.host,
	log: 'trace'
});

var data = [];

fs.readdir(config.gub_folder, _.bind(function(err, files) {
	_.each(files, function(file) {
//		console.log('open input/gub/'+file);
		var fileData = fs.readFileSync(config.gub_folder+'/'+file, 'utf8');
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

				dbData.push({
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
					color: {
						dominant: image.dominantColor,
						colors: image.colors
					},
					page: {
						id: image.id,
						side: image.type
					},
					image: 'gub-'+image.id
				});
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

	client.bulk({
		body: bulkBody
	});

}, this));
