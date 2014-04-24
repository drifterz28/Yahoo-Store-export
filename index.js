/* global require, console, response, process */
// test site yhst-136468114953641
// Module dependencies
var fs = require('fs');
var http = require('http');
var _ = require('underscore');
var parseString = require('xml2js').parseString;
var prettyjson = require('prettyjson');
var watcher;
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

    var request = http.get(url, function(err, response) {
        if(err){
            console.log(err);
        }
        console.log(chunk);
        response.pipe(file);
        file.on('finish', function() {
            console.log('File downloaded to '+ dest);
            if(typeof callback !== 'undefined'){
                file.close(callback);
            }
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
        imageJson(imageFields);
    });
}

function imageJson(filedNames) {
    var items = storeID + '/items.json';
    fs.readFile(items, 'utf8', function (err, data){
        var json = JSON.parse(data);
        var newJson = {};
        newJson.itemimages = [];
        newJson.images = []
        for (var x = 0; x < json.length; x++){
            var itemID = json[x].$.ID;
            var imageInfo = {};
            var justImages = [];
            var hasImage = false;
            imageInfo.images = {};
            imageInfo.id = itemID;
            _.each(json[x].ItemField, function (item){
                if (item.$.TableFieldID === 'name') {
                    imageInfo.name = item.$.Value;
                }
                if (filedNames.indexOf(item.$.TableFieldID) >= 0 && item.$.Value.length > 0) {
                    var clean_image = cleanImage(item.$.Value);
                    imageInfo.images[item.$.TableFieldID] = clean_image;
                    newJson.images.push(clean_image);
                    hasImage = true;
                }
            });
            if (hasImage) {
                newJson.itemimages.push(imageInfo);
            }
        }
        createFile('images.json', JSON.stringify(newJson));
    });
}

function downloadImages() {
    console.log('images dl!');
    var images = storeID + '/images.json';
    var file = fs.createWriteStream(storeID+'/images/');
    //watcher.close(); // close as I dont need to watch images be downloaded.
    fs.readFile(images, 'utf8', function (err, data){
        if(err){
            console.log(err);
        }
        var json = JSON.parse(data).images;
        for(var x = 0; x < json.length; x++){
            http.get(json[x], function(err, response) {
                if(err){
                    console.log(err);
                }
                response.pipe(file);
                file.on('finish', function() {
                    console.log('File downloaded');
                });
            });
        }
    });
}

function cleanImage(dirty) {
    var clean = dirty.match(/http:\/\/[a-z\.\/0-9-]+/i);
    return clean[0];
}

function startWatch(){
    watcher = fs.watch(storeID, function (event, filename) {
        switch (filename) {
            case 'items.json':
                grabImageFields();
                break;
            case 'images.json':
                downloadImages();
                break;
        }
    });
}

var buildActions = {
    newXML: function (){
        createDIR(storeID);
        createDIR(storeID + '/images');
        startWatch();
        getFile(url, storeID + '/catalog.xml', startXmlParse);
    },
    updateXML: function (){
        this.new();
    },
    rebuildXML: function () {
        if (fs.existsSync(storeID)) {
            startXmlParse();
            startWatch();
        } else {
            console.log('Running new as ' + storeID + '\'s folder does not exist');
            this.new();
        }
    },
    imagesXML: function () {
        //grabImageFields();
        //startWatch();
        downloadImages();
    }
}

buildActions[actions+'XML']();














