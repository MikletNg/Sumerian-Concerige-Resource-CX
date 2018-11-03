let fs = require('fs');
let path = require('path');
let AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
let ddb = new AWS.DynamoDB.DocumentClient();
let rek = new AWS.Rekognition();
let s3 = new AWS.S3();

const config = {
    collectionId: process.argv[2] + 'FaceCollection',
    image_bucket: process.argv[3],
    prefix: 'face/'
};

function readJson(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', function(err, data) {
            if (!err) {
                resolve(JSON.parse(data));
            }
            else {
                reject(err);
            }
        });
    });
}

function formatToParams(data) {
    let eachRequest;
    let params = {
        RequestItems: {}
    };
    for (let i in data) {
        params.RequestItems[i] = [];
        for (let j in data[i]) {
            eachRequest = {
                PutRequest: {
                    Item: data[i][j]
                }
            };
            params.RequestItems[i].push(eachRequest);
        }
    }
    return Promise.resolve(params);
}

function writeJson(json) {
    return new Promise((resolve, reject) => {
        fs.writeFile('function/params.json', JSON.stringify(json), 'utf8', (err, data) => {
            if (!err) {
                resolve(json);
            }
            else {
                reject(err);
            }
        });
    });
}

function writeToDynamoDb(params) {
    return ddb.batchWrite(params).promise();
}

function deleteRekCollection() {
    return new Promise((resolve, reject) => {
        rek.deleteCollection({ CollectionId: config.collectionId }, (err, data) => {
            if (err) {
                console.log('Operation returned Status Code ' + err.statusCode);
                console.log('Error message: ' + err.message);
            }
            else {
                console.log('Operation returned Status Code ' + data.StatusCode);
                console.log('Successfully delete collection ' + config.collectionId);
            }
            resolve();
        });
    });
}

function createRekCollection() {
    return rek.createCollection({ CollectionId: config.collectionId }).promise();
}

function listBucket() {
    return s3.listObjectsV2({ Bucket: config.image_bucket, Prefix: config.prefix }).promise();
}

function indexFaces(data) {
    return new Promise((resolve, reject) => {
        let fileName, params, request, requestList = [];
        for (let i in data.Contents) {
            fileName = path.parse(data.Contents[i].Key).name;
            fileName = fileName.replace(/\s+/g, '_');
            if (fileName !== 'face') {
                params = {
                    CollectionId: config.collectionId,
                    Image: {
                        S3Object: {
                            Bucket: config.image_bucket,
                            Name: data.Contents[i].Key
                        }
                    },
                    ExternalImageId: fileName,
                    DetectionAttributes: ['ALL']
                };
                request = rek.indexFaces(params).promise();
                requestList.push(request);
            }
        }
        Promise.all(requestList).then(response => {
            for (let record in response) {
                console.log(response[record]['FaceRecords'][0]['Face']['ExternalImageId'], response[record]['FaceRecords'][0]['Face']['FaceId']);
            }
            resolve(response);
        }).catch(reject);
    });
}

if (require.main === module) {
    readJson('function/data.json').then(formatToParams).then(writeJson).then(writeToDynamoDb).catch(console.error);
    deleteRekCollection().then(createRekCollection).then(listBucket).then(indexFaces).catch(console.error);
}
