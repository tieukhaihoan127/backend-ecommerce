const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'https://3e902680249044959f2991c03f6fd546.us-central1.gcp.cloud.es.io:443',
  auth: {
    apiKey: 'TUFBejA1WUJkSHprbG45d3RBTlc6aGhkVlVFdlFVYU9QUkJTbk1nV3NTQQ=='
  }
});

const index = "products";
const mapping = {
  properties: {
    title: { type: "text" },
    price: { type: "float" },
    discountPercentage: { type: "float" },
    featured: { type: "boolean" },
    bestSellers: { type: "boolean" },
    brand: { type: "text", fields: {
    keyword: {
      type: "keyword"
    }
  } },
    category: { type: "keyword" }
  }
};

(async () => {
  const exists = await client.indices.exists({ index });
  if (!exists) {
    await client.indices.create({ index });
  }

  await client.indices.putMapping({
    index,
    body: mapping
  });

  console.log("✅ Mapping đã được thiết lập!");
})();