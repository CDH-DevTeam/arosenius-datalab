var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: '127.0.0.1:9200',
	log: 'trace'
});

client.indices.create({
	index: 'arosenius',
	body: {
		mappings: {
			artwork: {
				properties: {
					collection: {
						properties: {
							museum: {
								type: 'string',
								index: 'not_analyzed'
							},
							department: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					}
				}
			}
		}
	}
}, function() {
});
