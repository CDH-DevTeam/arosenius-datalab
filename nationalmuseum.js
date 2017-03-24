var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: config.host,
	log: 'trace'
});

fs.readFile(config.nationalmuseum_json+'lido.json', 'utf8', function (err, fileData) {
	if (err) throw err;

	var data = JSON.parse(fileData);
	console.log(data.length);

	client.search({
		index: 'arosenius',
		type: 'artwork',
		query: '*'
	}).then(function (resp) {
		var insertCount = resp.hits.total+1;

		var bulkBody = [];

		_.each(data, function(item, index) {
			item.insert_id = insertCount;

			bulkBody.push({
				create: {
					_index: 'arosenius',
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
});

