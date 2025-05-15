const Product = require('../models/product.model');
const client = require('../config/elasticsearch');

async function indexProductsToElastic() {
  const products = await Product.find({ deleted: false });

  for (let product of products) {
    await client.index({
      index: 'products',
      id: product._id.toString(),
      document: {
        title: product.title,
        price: product.price,
        discountPercentage: product.discountPercentage,
        featured: product.featured,
        bestSellers: product.bestSellers,
        brand: product.brand,
        category: product.category
      }
    });
  }

  console.log("✅ Đã index dữ liệu lên Elasticsearch!");
}

module.exports = indexProductsToElastic;