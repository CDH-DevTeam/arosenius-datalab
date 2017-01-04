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
			if (hit._source.date) {
				var dateFrom = '';
				var dateTo = '';
				var itemDate = '';

				if (hit._source.date.day_from) {
					dateFrom = hit._source.date.year_from+'-'+hit._source.date.month_from+'-'+hit._source.date.day_from;
					dateTo = hit._source.date.year_to+'-'+hit._source.date.month_to+'-'+hit._source.date.day_to;
					console.log('-- exact date range --');
					console.log(hit._source.date);
					console.log(dateFrom);
				}
				else if (hit._source.date.date && hit._source.date.date.match(/[0-9]{4}-[0-9]{4}/g)) {
//					console.log('-- year range --');

					dateFrom = hit._source.date.date.substr(0, 4);
					dateTo = hit._source.date.date.substr(5, 4);
				}
				else if (hit._source.date.date && hit._source.date.date.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g)) {
					dateFrom = hit._source.date.date;
					dateTo = hit._source.date.date;
//					console.log('-- exact date --');
				}
				else if (hit._source.date.date && hit._source.date.date.match(/[0-9]{4}/g)) {
					dateFrom = hit._source.date.date.substr(0, 4);
					dateTo = hit._source.date.date.substr(0, 4);
//					console.log('-- exact year --');
				}
				else {
//					console.log('-- another pattern --');
//					console.log(hit._source.date);
				}

				if (dateFrom != '' && dateTo != '') {
//					console.log(dateFrom+' - '+dateTo);
//					console.log(hit._id);

					hit._source.item_date = dateFrom;
					hit._source.date_from = dateFrom;
					hit._source.date_to = dateTo;

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