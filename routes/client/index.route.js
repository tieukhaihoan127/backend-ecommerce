const userRoutes = require("../../routes/client/user.route");
const productRoutes = require("../../routes/client/product.route");
const categoryRoutes = require("../../routes/client/category.route");
const cartRoutes = require("./cart.route");
const checkoutRoutes = require("./checkout.route");
const couponRoutes = require("./coupon.route");
const reviewRoutes = require("./review.route");
const ratingRoutes = require("./rating.route");
const chatRoutes = require("./chat.route");

module.exports = (app) => {

    app.use('/users',userRoutes);

    app.use( '/products',productRoutes);

    app.use( '/categories',categoryRoutes);

    app.use('/cart', cartRoutes);
    
    app.use('/checkout', checkoutRoutes);

    app.use('/coupon', couponRoutes);

    app.use('/review', reviewRoutes);

    app.use('/rating', ratingRoutes);

    app.use('/chat', chatRoutes);

}