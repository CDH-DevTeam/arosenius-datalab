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
					published: {
						type: 'boolean'
					},
					bundle: {
						type: 'string',
						index: 'not_analyzed'
					},
					date_from: {
						type: 'date'
					},
					date_to: {
						type: 'date'
					},
					item_date: {
						type: 'date'
					},
					creation_date: {
						type: 'date'
					},
					send_date: {
						type: 'date'
					},
					receive_date: {
						type: 'date'
					},
					alt_date1: {
						type: 'date'
					},
					alt_date2: {
						type: 'date'
					},
					sender: {
						properties: {
							date: {
								type: 'date'
							}
						}
					},
					recipient: {
						properties: {
							date: {
								type: 'date'
							}
						}
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
					},
					page: {
						properties: {
							order: {
								type: 'integer'
							}
						}
					},
					insert_id: {
						type: 'integer'
					},
					type: {
						type: 'string',
						index: 'not_analyzed'
					},
					tags: {
						type: 'string',
						index: 'not_analyzed'
					},
					persons: {
						type: 'string',
						index: 'not_analyzed'
					},
					places: {
						type: 'string',
						index: 'not_analyzed'
					},
					genre: {
						type: 'string',
						index: 'not_analyzed'
					},
					material: {
						type: 'string',
						index: 'not_analyzed'
					},
					color: {
						properties: {
							colors: {
								properties: {
									three: {
										type: 'nested'
									},
									five: {
										type: 'nested'
									},
									prominent: {
										type: 'nested'
									}
								}
							}
						}
					}
				}
			}
		}
	}
}, function() {
});
