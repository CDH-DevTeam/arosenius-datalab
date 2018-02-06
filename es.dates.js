var elasticsearch = require('elasticsearch');
var _ = require('underscore');

var config = require('./config');

var client = new elasticsearch.Client({
	host: config.host,
//	log: 'trace'
});

client.search({
		index: 'arosenius',
		type: 'artwork',
		query: '*',
		body: {
			size: 10000
		}
	}).then(function (resp) {
		var hits = resp.hits.hits;

		console.log(hits.length);

		var hitCount = 0;

		var bulkBody = [];

		_.each(hits, function(hit) {
			var itemDate = '';

			if (new Date(hit._source.item_date_str).toString() == 'Invalid Date') {
//				console.log('Invalid date: '+hit._source.item_date_str);
			}
			else {
				console.log('Valid date: '+hit._source.item_date_str);
				console.log('Id: '+hit._id);
				console.log('------');

				hit._source.item_date_string = hit._source.item_date_str;

				bulkBody.push({
					update: {
						_index: 'arosenius',
						_type: 'artwork',
						_id: hit._id
					}
				});
				bulkBody.push({
					doc: hit._source
				});

				hitCount++;
			}
		});

		client.bulk({
			body: bulkBody
		}, function (err, resp) {
			if (err) {
				console.log(err);
			}
		});

		console.log(hitCount);
	}, function (err) {
 		console.log(err.message);
	}
);
