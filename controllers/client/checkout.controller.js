const Cart = require("../../models/cart.model");
const Coupon = require("../../models/coupon.model");
const User = require("../../models/user.model");
const Product = require("../../models/product.model");
const SettingFee = require("../../models/setting-fees.model");
const md5 = require("md5");
const Order = require("../../models/order.model");
const sendMailHelper = require("../../helpers/sendMail");

//[POST] /checkout/
module.exports.index = async (req, res) => {

    const tokenId = req.body.tokenId;

    const user = await User.findOne({ token: tokenId });

    if(!user) {
        return res.status(400).json({ error: "Không tồn tại người dùng" });
    }

    const orders = await Order.find({ userId: user.id }).sort({ createdAt: -1 });

    const orderInfo = [];

    for(const order of orders) {
        let total = 0;
        for (const item of order.products) {
            const discountedPrice = item.price - (item.price * item.discountPercentage / 100);
            total += (discountedPrice * item.quantity);
        }

        if((total + ((total*order.taxes)/100) + order.shippingFee) > order.loyaltyPoint) {
            total = total + ((total*order.taxes)/100) + order.shippingFee - order.loyaltyPoint;
        }
        else {
            total = 0;
        }

        if(order.couponPoint > 0) {
            total = total - order.couponPoint;
        }

        let latestStatus = null;
        if (order.history && order.history.length > 0) {
            const sortedHistory = order.history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            latestStatus = sortedHistory[0];
        }

    const enrichedProducts = [];

    for (const product of order.products) {
        const productInfo = await Product.findOne({
            _id: product.product_id,
        }).select("price discountPercentage color variant title thumbnail");

        let thumbnail = productInfo.thumbnail;

        if (productInfo.color !== product.color) {
            const variantMatch = productInfo.variant.find(v => v.color == product.color);
            if (variantMatch) {
                thumbnail = variantMatch.thumbnail;
            }
        }

        enrichedProducts.push({
            ...product.toObject(), 
            title: productInfo.title,
            thumbnail: thumbnail
        });
    }

        const orderObject = {
            orderId: order.id,
            product: enrichedProducts,
            totalAmount: total,
            latestStatus: latestStatus?.status || 'Unknown',
            latestUpdatedAt: latestStatus?.updatedAt || null,
        };

        orderInfo.push(orderObject);
    }


    return res.status(200).json({
        order: orderInfo
    });

}

//[GET] /checkout/:id 
module.exports.detail = async (req, res) => {

    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId });

    let total = 0;

    for (const item of order.products) {
        let discountedPrice;

        if(item.discountPercentage > 0) {
            discountedPrice = item.price - (item.price * item.discountPercentage / 100);
        }
        else {
            discountedPrice = item.price;
        }

        total += (discountedPrice * item.quantity);
    }

    const enrichedProducts = [];

    for (const product of order.products) {
        const productInfo = await Product.findOne({
            _id: product.product_id,
        }).select("price discountPercentage color variant title thumbnail");

        let thumbnail = productInfo.thumbnail;
        let discountedPrice = product.price - (product.price * product.discountPercentage / 100);

        if (productInfo.color !== product.color) {
            const variantMatch = productInfo.variant.find(v => v.color == product.color);
            if (variantMatch) {
                thumbnail = variantMatch.thumbnail;
            }
        }

        enrichedProducts.push({
            ...product.toObject(), 
            title: productInfo.title,
            thumbnail: thumbnail,
            priceNew: discountedPrice
        });
    }

    return res.status(200).json({
        order: {
            orderId: order.id,
            totalPrice: total,
            products: enrichedProducts,
            userInfo: order.userInfo,
            taxes: order.taxes,
            shippingFee: order.shippingFee,
            loyaltyPoint: order.loyaltyPoint,
            couponPoint: order.couponPoint,
            createdDate: order.createdAt
        }
    });

}

//[GET] /checkout/status/:id 
module.exports.status = async (req, res) => {

    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId });

    if (!order) {
        return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    const sortedHistory = order.history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({
        status: sortedHistory
    });

}

// [POST] /checkout/order
module.exports.order = async (req, res) => {

    const cartId = req.body.cartId;
    const email = req.body.email;
    const fullName = req.body.fullName;
    const phone = req.body.phone;
    const city = req.body.city;
    const district = req.body.district;
    const ward = req.body.ward;
    const address = req.body.address;
    const loyaltyPointUsed = req.body.loyaltyPointUsed;
    const couponValue = req.body.couponValue;
    const couponId = req.body.couponId;

    let userId = null;

    const isUserExist = await User.findOne({ email: email });

    if(!isUserExist) {

        let password = email.split('@')[0];

        let newUser = {
            email: email,
            fullName: fullName,
            password: md5(password),
            shippingAddress: 
            {
                city: city,
                district: district,
                ward: ward,
                address: address
            },
        }

        const user = new User(newUser);
        userId = user.id;
        await user.save();
    }
    else {
        userId = isUserExist.id;
    }

    const cart = await Cart.findOne({
        _id: cartId
    });

    const products = [];
    const productEmailInfo = [];

    let total = 0;

    for(const product of cart.products) {
        const objectProduct = {
            product_id: product.product_id,
            color: product.color,
            price: 0,
            discountPercentage: 0,
            quantity: product.quantity
        };

        const productInfo = await Product.findOne({
            _id: product.product_id,
        }).select("price discountPercentage color variant title stock");

        if(productInfo.color == product.color) {
            objectProduct.price = productInfo.price;
            objectProduct.discountPercentage = productInfo.discountPercentage;

            if (productInfo.stock >= product.quantity) {
                productInfo.stock -= product.quantity;
            } else {
                return res.status(400).json({ message: `Sản phẩm ${productInfo.title} không đủ hàng.` });
            }

            if(productInfo.discountPercentage <= 0) {
                total = total + (productInfo.price * product.quantity);
            }
            else {
                total = total + ((productInfo.price - ((productInfo.price * productInfo.discountPercentage)/100)) * product.quantity);
            }
        }
        else {
            const variantMatch = productInfo.variant.find(v => v.color == product.color);
            objectProduct.price = variantMatch.price;
            objectProduct.discountPercentage = variantMatch.discountPercentage;

            if (variantMatch.stock >= product.quantity) {
                variantMatch.stock -= product.quantity;
            } else {
                return res.status(400).json({ message: `Sản phẩm ${productInfo.title} - màu ${product.color} không đủ hàng.` });
            }

            if(variantMatch.discountPercentage <= 0) {
                total = total + (variantMatch.price * product.quantity);
            }
            else {
                total = total + ((variantMatch.price - ((variantMatch.price * variantMatch.discountPercentage)/100)) * product.quantity);
            }
        }
      
        products.push(objectProduct);

        objectProduct.name = productInfo.title;

        productEmailInfo.push(objectProduct);

        await productInfo.save();
    }

    const settingFee = await SettingFee.findOne({ deleted: false });

    let totalOrderAmount = total + settingFee.shippingFee + ((total * settingFee.taxes)/100);

    if(couponId != "") {
        totalOrderAmount = totalOrderAmount - couponValue;
    }

    let newLoyaltyPoint;

    let currentLoyaltyPoint;

    const client = await User.findOne({ _id: userId });

    if(loyaltyPointUsed) {

        currentLoyaltyPoint = client.loyaltyPoint;

        if(client.loyaltyPoint > totalOrderAmount) {
            client.loyaltyPoint = client.loyaltyPoint - totalOrderAmount;
        }
        else if(client.loyaltyPoint < totalOrderAmount){
            totalOrderAmount = totalOrderAmount - client.loyaltyPoint;
            newLoyaltyPoint = Math.floor((totalOrderAmount * 10) / 100);
            client.loyaltyPoint = 0;
            client.loyaltyPoint = client.loyaltyPoint + newLoyaltyPoint;
        }
        else {
            client.loyaltyPoint = 0;
        }
    }
    else {
        newLoyaltyPoint = Math.floor((totalOrderAmount * 10) / 100);
        client.loyaltyPoint = client.loyaltyPoint + newLoyaltyPoint;
    }

    await client.save();

    const userInfo = 
    {
        fullName: fullName,
        email: email,
        phone: phone,
        city: city,
        district: district,
        ward: ward,
        address: address
    };

    const historyInfo = 
    [
        {
            status: "Pending",
            updateAt: Date.now()
        }
    ];

    const orderInfo = {
        userId: userId,
        userInfo: userInfo,
        products: products,
        taxes: settingFee.taxes,
        shippingFee: settingFee.shippingFee,
        loyaltyPoint: loyaltyPointUsed ? currentLoyaltyPoint : 0,
        couponPoint: couponValue,
        history: historyInfo
    };

    const order = new Order(orderInfo);
    await order.save();

    await Cart.updateOne({
        _id: cartId
    }, {
        products: []
    });

    if(couponId != "") {
        const coupon = await Coupon.findOne({ code: couponId });

        coupon.stock = coupon.stock - 1;
        coupon.numberUsed = coupon.numberUsed + 1;
        coupon.orderUsed.push(order._id);

        await coupon.save();
    }

    const createdAt = new Date(order.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    let productInfoHtml = '';
    let loyaltyPointHtml = "";
    let couponHtml = "";

    if (loyaltyPointUsed) {
        loyaltyPointHtml = `<li><b>Điểm thưởng sử dụng:</b> ${currentLoyaltyPoint.toLocaleString()} VND</li>`;
    }

    if (couponId != "") {
        couponHtml = `<li><b>Giảm giá bằng mã:</b> ${couponValue.toLocaleString()} VND</li>`;
    }

    for (const p of productEmailInfo) {
        if(p.discountPercentage > 0) {
            productInfoHtml += `
            <li>
            <b>Product ID:</b> ${p.product_id} <br />
            <b>Product Name:</b> ${p.name} <br />
            <b>Quantity:</b> ${p.quantity} <br />
            <b>Price:</b> ${(p.price - (p.price * p.discountPercentage)/100).toLocaleString()} VND <br />
            <b>Discount:</b> ${p.discountPercentage}%
            </li><br/>
        `;
        }
        else {
            productInfoHtml += `
            <li>
            <b>Product ID:</b> ${p.product_id} <br />
            <b>Product Name:</b> ${p.name} <br />
            <b>Quantity:</b> ${p.quantity} <br />
            <b>Price:</b> ${p.price.toLocaleString()} đ <br />
            </li><br/>
        `;
        }
    }

    const subject = "Xác nhận đơn hàng của bạn đã được tạo thành công!";
    const html = `
    <h2>Xin chào ${fullName},</h2>
    <p>Đơn hàng của bạn đã được tạo thành công với các thông tin sau:</p>
    <ul>
        <li><b>Họ và tên:</b> ${fullName}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Số điện thoại:</b> ${phone}</li>
        <li><b>Địa chỉ:</b> ${address}, ${ward}, ${district}, ${city}</li>
        <li><b>Mã giỏ hàng:</b> ${cartId}</li>
        <li><b>Ngày đặt hàng:</b> ${createdAt}</li>
    </ul>
    <h3>Sản phẩm:</h3>
    <ul>
        ${productInfoHtml}
    </ul>
    <h3>Thông tin thanh toán</h3>
    <ul>
        <li><b>Phí shipping</b> ${settingFee.shippingFee.toLocaleString()} VND</li>
        <li><b>Thuế</b> ${settingFee.taxes} %</li>
        ${loyaltyPointHtml}
        ${couponHtml}
        <li><b>Tổng tiền</b> ${totalOrderAmount.toLocaleString()} VND</li>
    </ul>
    <p style="color: green;"><b>Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi!</b></p>
    `;

    await sendMailHelper.sendMail(email, subject, html);


    return res.status(201).json({ message: "Đặt hàng thành công!!!" });
}

//[PATCH] /checkout/changeStatus/:id/:status
module.exports.changeStatus = async (req, res) => {

    const orderId = req.params.id;
    const status = req.params.status;

    const order = await Order.findOne({ _id: orderId });

    if(!order) {
        return res.status(400).json({ error: "Không tồn tại đơn hàng" });
    }

    order.history.push({
        status: status,
        updatedAt: new Date()
    });

    await order.save();


    return res.status(200).json({
        message: "Cập nhật trạng thái đơn hàng thành công"
    });

}
