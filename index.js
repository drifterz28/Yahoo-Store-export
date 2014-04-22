/* global require, console, response, process */
// Module dependencies
var fs = require('fs');
var http = require('http');
var xml2js = require('xml2js');
var prettyjson = require('prettyjson');

// xml2js parser instance
var parser = new xml2js.Parser();
var storeID = process.argv[2];

// abort if missing store id
if(storeID === undefined) {
    console.log('missing store id!');
    process.exit();
}
// build catalog url
var url = 'store.yahoo.com/' + storeID + '/catalog.xml';

// functions
function createDIR(foldername){
    if(!fs.existsSync(foldername)){
        fs.mkdirSync(foldername, 0766, function(err){
            if(err){
                console.log(err);
            } else {
                console.log('Created ' + foldername);
            }
        });
    } else {
        console.log('Folder ' + foldername + ' exists');
    }
}
function createFile(filename, content) {
    fs.writeFile(storeID + '/' + filename, content, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log(filename + ' was created and saved!');
        }
    });
}

function betterJson(obj, key, value) {
    var json = {};
    for(var y in obj){
        for(var x = 0; x < obj[y].length; x++){
            var newObj = {'name': obj[y][x].$[value]};
            if(obj[y][x].ArrayValue ||  obj[y][x].ItemFieldOptions){
                newObj.options = obj[y][x].ArrayValue;
            }
            json[obj[y][x].$[key]] = newObj;
        }
    }

    return json;
}


createDIR(storeID);
createDIR(storeID + '/images');
createFile('catalog.xml', '');
//
http.get('http://store.yahoo.com/' + storeID + '/catalog.xml', function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk){
        fs.appendFile(storeID + '/catalog.xml', chunk, function(err){
            if(err) {
                console.log(err);
            }
        });
    });
    console.log('catalog.xml done saving!');
});

/*
request.get(url, function(error, request, body) {
    // Parse XML data from body
    parser.parseString(body, function(err, parsedXml) {
        var catalog = parsedXml.Catalog;
        //console.log(catalog);
        var storeInfo = catalog.$;
        var table = catalog.Table;
        var items = catalog.Item;
        //console.log(storeInfo);
        createJson('storeinfo.json', storeInfo);
        createJson('tables.json', table);
        createJson('items.json', items);

        //var tablename = table[0].$.ID.replace('.', '');
        ////for(){
        ////    console.log(prettyjson.render(items[0]));
        ////}
        ////console.log(prettyjson.render(table[0].TableFieldArray));
        ////console.log(table[0].TableFieldArray);
        ////createJson(tablename + '.json', betterJson(table[0], 'ID', 'Type'));
        //console.log(prettyjson.render(betterJson(table[0], 'ID', 'Type')));

    });
});
*/












