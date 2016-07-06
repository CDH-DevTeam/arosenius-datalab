var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: config.host
});

client.indices.create({
	index: 'arosenius',
	body: {
		mappings: {
			artwork: {
				properties: {
					type: {
						type: 'string',
						index: 'not_analyzed'
					},
					bundle: {
						type: 'string',
						index: 'not_analyzed'
					},
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
