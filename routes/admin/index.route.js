const systemConfig = require("../../config/system");
const couponRoutes = require("./coupon.route");
const orderRoutes = require("./order.route");
const userRoutes = require("./user.route");
const dashboardRoutes = require("./dashboard.route");


module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    app.use( PATH_ADMIN + "/coupon",couponRoutes);

    app.use( PATH_ADMIN + "/order",orderRoutes);

    app.use( PATH_ADMIN + "/user",userRoutes);

    app.use( PATH_ADMIN + "/dashboard",dashboardRoutes);
}