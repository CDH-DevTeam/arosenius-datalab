var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: config.host,
	log: 'trace'
});

fs.readFile(process.argv[2], 'utf8', function (err, fileData) {
	if (err) throw err;

	var output = [];

	var data = JSON.parse(fileData);

	var insertCount = process.argv[4];

	var bulkBody = [];

	_.each(data, function(item, index) {
		item['insert_id'] = insertCount;

		bulkBody.push({
			create: {
				_index: process.argv[3] || 'arosenius',
				_type: 'artwork'
			}
		});
		bulkBody.push(item);

		insertCount++;
	});

	client.bulk({
		body: bulkBody
	});
});

