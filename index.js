/* global require, console, response, process */
// test site yhst-136468114953641
// Module dependencies
var fs = require('fs');
var http = require('http');
var parseString = require('xml2js').parseString;
var prettyjson = require('prettyjson');

var storeID = process.argv[2];

// Action options
// new - starts everything from scratch
// update - same as new
// rebuld - will rebuild all files but not redownload catalog.xml
// images - will only download images from current files

var actions = process.argv[3] || 'new';

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

function get_file(file) {
    var filename = file.split('/').pop();


    http.get(file, destFolder + filename, function (error, result) {
        if (error) {
            console.error(error);
        } else {
            console.log('File downloaded at: ' + result.file);
        }
    });
}

function startXmlParse() {
    var xml = storeID + '/catalog.xml';
    fs.readFile(xml, 'utf8', function (err, data){
        parseString(data, function(err, parsedXml) {
            if(err){
                console.log(err);
            }
            var catalog = parsedXml.Catalog;
            console.log(catalog);
            //var storeInfo = catalog.$;
            //var table = catalog.Table;
            //var items = catalog.Item;
            //console.log(storeInfo);
            //createFile('storeinfo.json', JSON.stringify(storeInfo));
            //createFile('tables.json', JSON.stringify(table));
            //createFile('items.json', JSON.stringify(items));

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
}
function getCatalog(){
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
        startXmlParse();
    });
}

buildActions = {
    newXML: function (){
        createDIR(storeID);
        createDIR(storeID + '/images');
        createFile('catalog.xml', ''); // clear file to append new data
        getCatalog();
    },
    updateXML: function (){
        this.new();
    },
    rebuildXML: function () {
        startXmlParse();
    }
}

buildActions[actions+'XML']();














