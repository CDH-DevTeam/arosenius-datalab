var _ = require('underscore');
var config = require('./config');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: config.host
});

client.indices.create({
	index: process.argv[2] || 'arosenius',
	body: {
		settings: {
			analysis: {
				analyzer: {
					case_insensitive: {
						tokenizer: 'keyword',
						filter: [
							'lowercase'
						]
					}
				}
			}
		},
		mappings: {
			artwork: {
				properties: {
					date: {
						properties: {
							date: {
								type: 'string'
							}
						}
					},
					item_date_str: {
						type: 'string'
					},
					published: {
						type: 'boolean'
					},
					bundle: {
						type: 'string',
						index: 'not_analyzed'
					},
					title: {
						type: 'string',
						fields: {
							raw: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
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
								fields: {
									raw: {
										type: 'string',
										index: 'not_analyzed'
									}
								}
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
						fields: {
							raw: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					},
					tags: {
						type: 'string',
						fields: {
							raw: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					},
					persons: {
						type: 'string',
						fields: {
							raw: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					},
					places: {
						type: 'string',
						fields: {
							raw: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					},
					genre: {
						type: 'string',
						fields: {
							raw: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					},
					material: {
						type: 'string',
						index: 'not_analyzed'
					},
					exhibitions: {
						type: 'string',
						fields: {
							raw: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					},
					exhibitions_nested: {
						type: 'nested',
						properties: {
							place: {
								type: 'string',
								index: 'not_analyzed'
							},
							year: {
								type: 'date'
							}
						}
					},
					images: {
						type: 'nested',
						properties: {
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
					},
					googleVisionLabels: {
						type: 'nested',
						properties: {
							label: {
								type: 'string',
								index: 'not_analyzed'
							}
						}
					},
					googleVisionColors: {
						type: 'nested',
					}
				}
			}
		}
	}
}, function(err) {
	if (err) {
		console.log(err);
	}
});
