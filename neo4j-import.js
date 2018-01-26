var request = require('request');
var _ = require('underscore');
var fetch = require('node-fetch');

var cypherUrl = 'http://neo4j:lcp010xx@localhost:7474/db/data/cypher';

var action = process.argv[2];

if (process.argv.length > 3) {
	console.log('node neo4j-import [records|persons|places|tags|person_relations|places_relations|tags_relations]')
}

function importNodes(fieldName, nodeType) {
	request({
		url: 'http://cdh-vir-1.it.gu.se:8004/artwork_relations',
		json: true
	}, function (error, response, body) {
		var index = 0;

		function importMetadata() {
			var artwork = body[index];

			console.log(artwork[fieldName]);

			if (!artwork[fieldName] || artwork[fieldName].length == 0) {
				index++;
				importMetadata();
					
				return;				
			}
			_.each(artwork[fieldName], function(item) {
				if (item == '') {
					return;
				}

				var itemName = fieldName == 'persons' ? item.split('"').join('').split('&quot;').join('') : item;

				var createNodeQuery = {
					query: 'CREATE (a:'+nodeType+' {name: "'+(itemName)+'"}) RETURN a',
				};

				fetch(cypherUrl, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(createNodeQuery)
				}).then(function(response) {
					if (index < body.length-1) {
						index++;

						importMetadata();
					}
					else {
						console.log('All done!')
					}
				});
			});
		}

		importMetadata();
	});
}

function importLinks(fieldName, nodeType) {
	request({
		url: 'http://cdh-vir-1.it.gu.se:8004/artwork_relations',
		json: true
	}, function (error, response, body) {
		var index = 0;

		function createLink() {
			var artwork = body[index];

			console.log(artwork[fieldName]);

			if (!artwork[fieldName] || artwork[fieldName].length == 0) {
				index++;
				createLink();
					
				return;				
			}
			_.each(artwork[fieldName], function(item) {
				if (item == '') {
					return;
				}

				var itemName = fieldName == 'persons' ? item.split('"').join('').split('&quot;').join('') : item;

				var createLinkQuery = {
					query: 'MATCH (a:Object {id: \''+artwork.id+'\'}), (b:'+nodeType+' {name: \''+itemName+'\'}) CREATE (a)<-[r:SUBJECT_OF]-(b)'
				};

				fetch(cypherUrl, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(createLinkQuery)
				}).then(function(response) {
					if (index < body.length-1) {
						index++;

						createLink();
					}
					else {
						console.log('All done!')
					}
				});
			});
		}

		createLink();
	});
}

if (action == 'records') {
	request({
		url: 'http://cdh-vir-1.it.gu.se:8004/artwork_relations',
		json: true
	}, function (error, response, body) {
		var index = 0;

		function importArtwork() {
			var artwork = body[index];

			var createArtworkQuery = {
				query: 'CREATE (a:Object {id: "'+artwork.id+'", title: "'+artwork.title+'", museum: "'+artwork.museum+'", type: "'+(artwork.type ? (artwork.type.join ? artwork.type[0] : artwork.type) : '')+'", image: "'+artwork.images[0]+'", dominant_1_h: '+artwork.dominant_1_h+', dominant_1_s: '+artwork.dominant_1_s+', dominant_1_v: '+artwork.dominant_1_v+', dominant_2_h: '+artwork.dominant_2_h+', dominant_2_s: '+artwork.dominant_2_s+', dominant_2_v: '+artwork.dominant_2_v+', dominant_3_h: '+artwork.dominant_3_h+', dominant_3_s: '+artwork.dominant_3_s+', dominant_3_v: '+artwork.dominant_3_v+'}) RETURN a',
			};

			console.log('Insert "'+artwork.title+'" ('+artwork.id+')');

			fetch(cypherUrl, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(createArtworkQuery)
			}).then(function(response) {
				if (index < body.length-1) {
					index++;

					importArtwork();
				}
				else {
					console.log('All done!')
				}
			});
		}

		importArtwork();
	});

}
if (action == 'persons') {
	importNodes('persons', 'Person');
}
if (action == 'places') {
	importNodes('places', 'Place');
}
if (action == 'tags') {
	importNodes('tags', 'Tag');
}
if (action == 'person_relations') {
	importLinks('persons', 'Person');
}
if (action == 'tags_relations') {
	importLinks('tags', 'Tag');
}
if (action == 'places_relations') {
	importLinks('places', 'Place');
}