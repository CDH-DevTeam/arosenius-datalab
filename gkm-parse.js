var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var RomanNumber = require('./lib/romans');

var client = new elasticsearch.Client({
	host: config.host,
	log: 'trace'
});

fs.readFile(process.argv[2], 'utf8', function (err, fileData) {
	if (err) throw err;

	var outputData = [];

	var data = JSON.parse(fileData);

	var gkmImages = fs.readdirSync(process.argv[3]);

	var notFoundLog = '';

	_.each(data, function(item, index) {
		var sizeStrings = item['Dimensioner'].split(';');

		var sizeObj = {};

		if (_.find(sizeStrings, function(sizeItem) {
			return sizeItem.indexOf('Mått:') > -1;
		})) {
			var sizeItem = _.find(sizeStrings, function(sizeItem) {
				return sizeItem.indexOf('Mått:') > -1;
			});
			var dimension = sizeItem.replace('Mått:', '')
				.split(',').join('.')
				.replace('cm', '')
				.split(' ').join('')
				.split('x');

			sizeObj['inner'] = {
				width: dimension[1],
				height: dimension[0]
			};
		}

		if (_.find(sizeStrings, function(sizeItem) {
			return sizeItem.indexOf('Ram:') > -1;
		})) {
			var sizeItem = _.find(sizeStrings, function(sizeItem) {
				return sizeItem.indexOf('Ram:') > -1;
			});
			var dimension = sizeItem.replace('Ram:', '')
				.split(',').join('.')
				.replace('cm', '')
				.split(' ').join('')
				.split('x');

			sizeObj['outer'] = {
				width: dimension[1],
				height: dimension[0]
			};

			if (dimension[2]) {
				sizeObj['outer']['depth'] = dimension[2];
			}
		}

		var dateString = item['Datering'];
		var dateParsed = null;

		if (!Number(dateString) && dateString != '') {				
			if (dateString.match(/[0-9]/)) {
				dateParsed = Number(dateString.replace('ca ', '')
					.replace('ev. ', '')
					.split(' ').join('')
					.split('-')[0]);
			}
		}
		else {
			dateParsed = Number(dateString);
		}

		var invNumberConverted = item['Inventarienummer'].split('/').join('-').split('  ').join(' ')+' ';

		var imageFiles = _.filter(gkmImages, function(image) {
			return image.split('  ').join(' ').indexOf(invNumberConverted) > -1;
		});

		if (imageFiles.length == 0) {
			notFoundLog += '"'+invNumberConverted+'";"'+item['Inventarienummer']+'";"'+item['Titel']+'"'+"\n\r";
		}

		var images = _.map(imageFiles, function(image) {
			return {
				image: image.split('.')[0]
			};
		});

		if (images.length > 1) {
			images = _.sortBy(images, function(image) {
				var parts = image.image.split(' ');

				var lastPart = parts[parts.length-1];
				var romanNumber = lastPart.replace(/a|b|c/, '');
				if (lastPart.indexOf('b') > -1) {
					console.log(image.image);
				}

				return RomanNumber(romanNumber).toInt()+(lastPart.indexOf('b') > -1 ? 0.5 : 0);
			});
		}

		images = _.map(images, function(image) {
			image.image = image.image;

			return image;
		})

		var insertItem = {
			type: '',
			title: item['Titel'],
			title_en: item['Titel (engelska)'],
			size: sizeObj,
			collection: {
				museum: 'Göteborgs konstmuseum'
			},
			material: [
				item['Teknik/Material']
			],
			genre: item['Sakord'].split(', '),
			technique_material: item['Teknik/Material utskriven'],
			persons: [
				item['Avbildad person/plats']
			],
			persons_analysed: [
				item['Avbildad person/plats']
			],
			museum_int_id: item['Inventarienummer'],
			signature: item['Signatur'],
			inscription: item['Påskrift'],
			acquisition: item['Förvärvsuppgifter'],
			images: images,
			item_date: dateParsed,
			item_date_str: item['Datering'],
			description: item['Beskrivning']
		};

		if (insertItem.images.length > 1) {
			console.log(insertItem.images);

			outputData.push(insertItem);
		}
	});

	fs.writeFile(process.argv[4], JSON.stringify(outputData, null, 2));

	fs.writeFile('not-found-gkm.csv', notFoundLog);
});

