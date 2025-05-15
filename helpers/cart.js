const Product = require("../models/product.model");
const productsHelper = require("./products");

async function cartHelper(products) {
    const enriched = [];
    for (let i=0; i < products.length; i++) {
      const item = products[i].toObject ? products[i].toObject() : products[i];
      const productQuery = {
        _id: item.product_id,
        $or: [
          { color: item.color },
          { "variant.color": item.color },
        ],
      };
  
      const product = await Product.findOne(productQuery).select("title thumbnail price discountPercentage color variant");

      if (!product) continue;

      let productInfo = {
        title: product.title
      }

      if(product.color == item.color) {
        productInfo.price = product.price;
        productInfo.discountPercentage = product.discountPercentage;
        productInfo.thumbnail = product.thumbnail;
      }
      else {
        const variantMatch = product.variant.find(v => v.color === item.color);
        if(!variantMatch) continue;

        productInfo.price = variantMatch.price;
        productInfo.discountPercentage = variantMatch.discountPercentage;
        productInfo.thumbnail = variantMatch.thumbnail;
      }
  
      productInfo.priceNew = productsHelper.priceNewProduct(productInfo);
      item.productInfo = productInfo;
      item.totalPrice = productInfo.priceNew * item.quantity;
      enriched.push(item);

    }
  
    return enriched;
};

module.exports = cartHelper;