const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  // node: 'http://elasticsearch:9200',
  node: 'https://3e902680249044959f2991c03f6fd546.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: 'TUFBejA1WUJkSHprbG45d3RBTlc6aGhkVlVFdlFVYU9QUkJTbk1nV3NTQQ==',  
  }
});

module.exports = client;