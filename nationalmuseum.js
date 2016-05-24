var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: '127.0.0.1:9200',
	log: 'trace'
});

fs.readFile('input/nationalmuseum.json', 'utf8', function (err, fileData) {
	if (err) throw err;

	var data = JSON.parse(fileData);

	var dbData = _.map(data.files, function(file) {
		/*
			Type of document (konstverk, manuskript/brev, fotografi, trycksak, artefakt)
			Upphovsman/avsändare
			Mottagare (manuskript/brev)
			Date
			Title
			Seria
			Format (mått)
			Teknik
			Material
			Samling (museum/collection)
			Museum artwork ID
			Licence
		*/

		var innerDimensions = {};
		var outerDimensions = {};

		if (file.dimensions[0]) {
			innerDimensions = {
				width: file.dimensions[0].width,
				height: file.dimensions[0].height,
				unit: file.dimensions[0].unit
			};
		}

		if (file.dimensions[1]) {
			outerDimensions = {
				width: file.dimensions[1].width,
				height: file.dimensions[1].height,
				unit: file.dimensions[1].unit
			};
		}

		var imageDate = {};

		if (file.date) {
			imageDate = {
				day_from: file.date.day_from,
				month_from: file.date.month_from,
				year_from: file.date.year_from,
				day_to: file.date.day_to,
				month_to: file.date.month_to,
				year_to: file.date.year_to,
				signature: file.date.sign_date
			};
		}

		return {
			type: '',
			sender: '',
			receiver: '',
			date: imageDate,
			title: file.title_se,
			serie: '',
			format: {
				inner: innerDimensions,
				outer: outerDimensions
			},
			technic: _.map(_.filter(file.attributes, function(attrib) {
				return attrib.label == 'Teknik';
			}), function(item) {
				return {
					value: item.value,
					comment: item.comment
				}
			})[0],
			material: _.map(_.filter(file.attributes, function(attrib) {
				return attrib.label == 'Material';
			}), function(item) {
				return item.value
			}),
			collection: [
				'Nationalmuseum',
				file.enhet
			],
			museum_id: file.inventarienr,
			licence: '',
			acquisition: file.acquisition,
			signature: {
				author_signature: file.remark,
				signature: file.signature
			},
			color: {
				dominant: file.dominantColor,
				colors: file.colors
			},
			image: 'nationalmuseum-'+file.obj_id
		};
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

	bulkBody.push({
		mapping: {
			_index: 'arosenius',
			_type: 'artwork'
		}
	});

	var mapping = {
		title: {
			type: 'string'
		}
	};

	bulkBody.push(mapping);

	client.bulk({
		body: bulkBody
	});
});
