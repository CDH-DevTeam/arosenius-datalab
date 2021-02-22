var _ = require('underscore');
var fs = require('fs');
var elasticsearch = require('elasticsearch');

var request = require("request");
var http = require('http');
var path = require('path');
var parser = require('xml-js');

const argv = require('minimist')(process.argv.slice(2));

if (process.argv.length < 2) {
	console.log('node insertImageByFiles --metadataPath')

	return;
}

var imageMetadata = {
	'NM 2643': '19703',
	'NM 2644': '19704',
	'NM 6235': '23284',
	'NMB 365': '24307',
	'NMB 498': '24438',
	'NMB 499': '24439',
	'NMB 500': '24440',
	'NMB 1230': '25196',
	'NMB 1492': '25462',
	'NMB 1493': '25463',
	'NMB 2103': '26039',
	'NMB 2105': '26041',
	'NMSk 1245': '27512',
	'NMSk 1330': '27587',
	'NM 6972': '32535',
	'NMH 64/1923': '36650',
	'NMH 67/1977': '36651',
	'NMH A 1/2004': '36888',
	'NMH 68/1977': '36889',
	'NMH 169/1978': '36891',
	'NMH 61/1923': '36892',
	'NMH 48/1981': '36894',
	'NMH 49/1981': '36895',
	'NMH 50/1981': '36897',
	'NMH 51/1981': '36898',
	'NMH 52/1981': '36899',
	'NMH 53/1981': '36900',
	'NMH 54/1981': '36901',
	'NMH 55/1981': '36902',
	'NMH 1454/1973:13': '40501',
	'NMH 1454/1973:14': '40502',
	'NMH 330/2000': '41224',
	'NMH 331/2000': '41225',
	'NMH 332/2000 recto': '41226',
	'NMH 333/2000': '41227',
	'NMH 334/2000': '41228',
	'NMH 335/2000 recto': '41229',
	'NMH 332/2000 verso': '41946',
	'NMH 335/2000 verso': '41948',
	'NMH 63/1923': '48041',
	'NMH 212/1970': '48056',
	'NMH 9A/1972': '48058',
	'NMH 1454/1973:1': '48061',
	'NMH 1454/1973:2': '48066',
	'NMH 1454/1973:3': '48068',
	'NMH 1454/1973:4': '48070',
	'NMH 1454/1973:5': '48074',
	'NMH 1454/1973:6': '48078',
	'NMH 1454/1973:7': '48082',
	'NMH 1454/1973:8': '48085',
	'NMH 1454/1973:9': '48086',
	'NMH 1454/1973:10': '48087',
	'NMH 1454/1973:11': '48105',
	'NMH 1454/1973:12': '48107',
	'NMH 1454/1973:15': '48111',
	'NMH 1454/1973:16 recto': '48112',
	'NMH 1454/1973:16 verso': '48113',
	'NMH 276/1974': '48138',
	'NMH 139/1975': '48141',
	'NMH 140/1975': '48142',
	'NMH 141/1975': '48143',
	'NMH 142/1975': '48144',
	'NMH 156/1975:1': '48149',
	'NMH 157/1975': '48150',
	'NMH 158/1975': '48152',
	'NMH 161/1975': '48154',
	'NMH 159/1975': '48155',
	'NMH 160/1975': '48163',
	'NMH 162/1975': '48170',
	'NMH 163/1975': '48173',
	'NMH 164/1975': '48174',
	'NMH 165/1975': '48176',
	'NMH 166/1975:1': '48177',
	'NMH 167/1975': '48178',
	'NMH 69/1977 recto': '48188',
	'NMH 70/1977': '48191',
	'NMH 71/1977': '48192',
	'NMH 72/1977': '48195',
	'NMH 73/1977': '48197',
	'NMH 74/1977': '48200',
	'NMH 75/1977': '48201',
	'NMH 76/1977': '48202',
	'NMH 77/1977': '48203',
	'NMH 78/1977': '48204',
	'NMH 79/1977': '48208',
	'NMH 80/1977': '48209',
	'NMH 81/1977': '48210',
	'NMH 196/1977': '48228',
	'NMH 197/1977': '48229',
	'NMH 1/1978': '48232',
	'NMH 2/1978': '48243',
	'NMH 3/1978': '48246',
	'NMH 166/1978': '48249',
	'NMH 167/1978': '48250',
	'NMH 168/1978': '48251',
	'NMH 176/1978': '48256',
	'NMH 177/1978': '48262',
	'NMH 178/1978': '48265',
	'NMH 179/1978': '48266',
	'NMH 1/1979': '48268',
	'NMH 12/1981': '48271',
	'NMH 13/1981': '48273',
	'NMH 14/1981': '48276',
	'NMH 15/1981': '48278',
	'NMH 16/1981': '48280',
	'NMH 17/1981': '48283',
	'NMH 18/1981': '48285',
	'NMH 19/1981': '48287',
	'NMH 20/1981': '48289',
	'NMH 21/1981': '48292',
	'NMH 22/1981': '48296',
	'NMH 23/1981': '48298',
	'NMH 24/1981': '48300',
	'NMH 25/1981': '48301',
	'NMH 26/1981 recto': '48304',
	'NMH 26/1981 verso': '48306',
	'NMH 143/1987': '48315',
	'NMH 161/1990': '48318',
	'NMH 40/1994': '48319',
	'NMH A 1/2008': '122557',
	'NMH A 2/2008': '122558',
	'NMH A 3/2008': '122559',
	'NMH A 4/2008': '122560',
	'NMH A 5/2008': '122561',
	'NMH A 6/2008': '122562',
	'NMH A 7/2008': '122563',
	'NMH A 8/2008': '122564',
	'NMH A 9/2008': '122565',
	'NMH A 10/2008': '122566',
	'NMH A 11/2008': '122567',
	'NMH A 12/2008': '122568',
	'NMSk 2348a': '150177',
	'NMH 13/2014': '156451',
	'NMH 61/2014': '174257',
	'NMH 62/2014': '174258',
	'NMGrh 4966': '174287',
	'NMH 3/2011': '175230',
	'NMH 123/2003': '181587',
	'NMB 2710': '182865',
	'NMSk 2348b': '183090',
	'NMKA 37': '183266',
	'NMH 41/1979': '183276',
	'NMKA 39': '183387',
	'NMKA 38': '183389',
	'NMKA 40': '183390',
	'NMKA 41': '183391',
	'NMKA 43': '183392',
	'NMKA 42': '183393',
	'NMKA 44': '183394',
	'NMKA 45': '183395',
	'NMKA 46': '183396',
	'NMKA 47': '183397',
	'NMKA 48': '183398',
	'NMKA 49': '183399',
	'NMKA 50': '183400',
	'NMKA 51': '183401',
	'NMKA 52': '183402',
	'NMH 156/1975:2': '210192',
	'NMH 156/1975:3': '210193',
	'NMH 156/1975:4': '210194',
	'NMH 156/1975:5': '210196',
	'NMH 156/1975:6': '210197',
	'NMH 156/1975:7': '210198',
	'NMH 156/1975:8': '210199',
	'NMH 156/1975:9': '210200',
	'NMH 156/1975:10': '210201',
	'NMH 156/1975:11': '210202',
	'NMH 156/1975:12': '210203',
	'NMH 156/1975:13': '210204',
	'NMH 156/1975:14': '210205',
	'NMH 156/1975:15': '210206',
	'NMH 156/1975:16': '210207',
	'NMH 156/1975:17': '210208',
	'NMH 156/1975:18': '210209',
	'NMH 156/1975:19': '210210',
	'NMH 156/1975:20': '210211',
	'NMH 156/1975:21': '210212',
	'NMH 156/1975:22': '210213',
	'NMH 156/1975:23': '210214',
	'NMH 156/1975:24': '210215',
	'NMH 156/1975:25': '210216',
	'NMH 156/1975:26': '210217',
	'NMH 156/1975:27': '210218',
	'NMH 156/1975:28': '210219',
	'NMH 156/1975:29': '210220',
	'NMH 156/1975:30': '210221',
	'NMH 156/1975:31': '210222',
	'NMH 156/1975:32': '210223',
	'NMH 156/1975:33': '210224',
	'NMH 156/1975:34': '210225',
	'NMH 156/1975:35': '210226',
	'NMH 156/1975:36': '210227',
	'NMH 166/1975:2': '210228',
	'NMH 166/1975:3': '210229',
	'NMH 166/1975:4': '210230',
	'NMH 166/1975:5': '210231',
	'NMH 166/1975:6': '210232',
	'NMH 166/1975:7': '210233'
}

// Should we scan metadata and update imageMetadata?
if (argv.metadataPath) {
	var metadataFiles = fs.readdirSync(argv.metadataPath);

	_.each(metadataFiles, function(fileName) {
		if (path.extname(fileName).toLowerCase() == '.xml') {
			var fileContent = fs.readFileSync(argv.metadataPath+fileName, {
				encoding: 'utf8'
			});

			var json = JSON.parse(parser.xml2json(fileContent, {
				compact: true
			}));

			var invNr = json['lido:lidoWrap']
				['lido:lido']
				['lido:descriptiveMetadata']
				['lido:objectIdentificationWrap']
				['lido:repositoryWrap']
				['lido:repositorySet']
				['lido:workID']._text;

			var intId = json['lido:lidoWrap']
				['lido:lido']
				['lido:administrativeMetadata']
				['lido:recordWrap']
				['lido:recordID']._text;

			imageMetadata[invNr] = intId;
		}
	});
}

var config = require('./config');

var client = new elasticsearch.Client({
	host: config.host,
//	log: 'trace'
});

var hits = [];

client.search({
	index: argv.index || 'arosenius_v4',
	type: 'artwork',
	q: 'collection.museum: Nationalmuseum',
	size: 10000
}, function(err, response) {
	hits = response.hits.hits;

	processItem();

});

var hitIndex = 0;
var processItem = function() {
	var hit = hits[hitIndex];

	if (imageMetadata[hit._source.museum_int_id]) {
		console.log(hit._source.title+': '+imageMetadata[hit._source.museum_int_id])

		var link = 'http://collection.nationalmuseum.se/eMP/eMuseumPlus?service=ExternalInterface&module=collection&objectId='+imageMetadata[hit._source.museum_int_id]+'&viewType=detailView';

		hit._source.museumLink = link;
		hit._source.museum_int_id = [
			hit._source.museum_int_id,
			imageMetadata[hit._source.museum_int_id]
		];

		console.log(hit._source)
	}

	var options = {
		host: '127.0.0.1',
		port: 9200,
		path: '/'+(argv.index || 'arosenius_v4')+'/artwork/'+hit._id+'/_update',
		method: 'POST'
	};

	var req = http.request(options, function(resp) {
		console.log('update '+hit._id);
		resp.on('data', function(chunk){
			console.log('resp.on: data');
			console.log('hitIndex: '+hitIndex+', hits.length: '+hits.length);
		
			if (hitIndex < hits.length-1) {
				hitIndex++;
				processItem();
			}
		});
	}).on("error", function(e){
		console.log("Got error: " + e.message);
	});

	req.write(JSON.stringify({
		doc: hit._source
	}));
	req.write('\n');
	req.end();
};


