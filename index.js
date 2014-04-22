/* global require, console, response, process */
// Module dependencies
var fs = require('fs');
var http = require('http');
var request = require('request');
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
var url = 'http://store.yahoo.com/' + storeID + '/catalog.xml';

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
function createJson(filename, content) {
    fs.writeFile(storeID + '/' + filename, JSON.stringify(content), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log(filename + ' was saved!');
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

/*
function copyFile (url, ) {
    http.get('http://localhost/get', function (err, res) {
    if (err) {
        console.error(err);
        return;
    }

    console.log(res.code, res.headers, res.buffer.toString());
    });
}
*/


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












