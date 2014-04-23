/* global require, console, response, process */
// test site yhst-136468114953641
// Module dependencies
var fs = require('fs');
var http = require('http');
var _ = require('underscore');
var parseString = require('xml2js').parseString;
var prettyjson = require('prettyjson');
// pretty json example
//console.log(prettyjson.render(json[x]));
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

function getFile(url, dest, callback) {
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            console.log('File downloaded to '+ dest);
            file.close(callback);
        });
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
            var storeInfo = catalog.$;
            var table = catalog.Table;
            var items = catalog.Item;
            createFile('catalog.json', JSON.stringify(parsedXml));
            createFile('storeinfo.json', JSON.stringify(storeInfo));
            createFile('tables.json', JSON.stringify(table));
            createFile('items.json', JSON.stringify(items));
        });
    });
}

function grabImageFields() {
    var tables = storeID + '/tables.json';
    fs.readFile(tables, 'utf8', function (err, data){
        var json = JSON.parse(data);
        var imageFields = [];

        for (var x = 0; x < json.length; x++){
            _.each(json[x].TableField, function (field){
                if (field.$.Type === 'image'){
                    imageFields.push(field.$.ID);
                }
            });
        }
        console.log(imageFields.join(' '));
    });
}

buildActions = {
    newXML: function (){
        createDIR(storeID);
        createDIR(storeID + '/images');
        getFile(url, storeID + '/catalog.xml', startXmlParse);
    },
    updateXML: function (){
        this.new();
    },
    rebuildXML: function () {
        startXmlParse();
    },
    imagesXML: function () {
        grabImageFields();
    }
}

buildActions[actions+'XML']();














