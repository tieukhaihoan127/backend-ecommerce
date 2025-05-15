const Cart = require("../../models/cart.model");
const User = require("../../models/user.model");
const Product = require("../../models/product.model");
const cartHelper = require("../../helpers/cart");
const SettingFees = require("../../models/setting-fees.model");

//[POST]/cart/
module.exports.index = async (req, res) => {

    try {
        const sessionId = req.body.sessionId;

        const tokenId = req.body.tokenId;

        let sessionCart = null;

        let user = null;

        let cart = null;

        let settingFees = await SettingFees.findOne({ deleted: false });

        if (sessionId) {
            sessionCart = await Cart.findOne({
                session_id: sessionId
            });
        }

        if (tokenId) {
            user = await User.findOne({
                token: tokenId
            });

            if (user) {
                cart = await Cart.findOne({
                    user_id: user._id
                });
            }
        }

        if (!cart && !sessionCart) {
            let newCart;

            if (!tokenId && sessionId) {
                newCart = new Cart({
                    user_id: null,
                    session_id: sessionId,
                    products: []
                });
            }
            else {
                newCart = new Cart({
                    user_id: user ? user._id : null,
                    session_id: null,
                    products: []
                });
            }

            await newCart.save();

            return res.status(200).json({
                message: "Đã tạo giỏ hàng mới",
                cartId: newCart._id,
                cart: {
                    products: [],
                    totalPrice: 0,
                    taxes: 0,
                    shippingFee: 0
                }
            });
        }

        if (sessionCart && !cart) {
            const enrichedProducts = await cartHelper(sessionCart.products);
            const totalPrice = enrichedProducts.reduce((sum, item) => sum + item.totalPrice, 0);
            return res.status(200).json({
                cart: {
                    products: enrichedProducts,
                    totalPrice,
                    taxes: settingFees.taxes,
                    cartId: sessionCart.id,
                    shippingFee: settingFees.shippingFee,
                    loyaltyPoint: 0
                }
            });
        }

        if (!sessionCart && cart) {
            const enrichedProducts = await cartHelper(cart.products);
            const totalPrice = enrichedProducts.reduce((sum, item) => sum + item.totalPrice, 0);

            const user = await User.findOne({ token: tokenId });

            return res.status(200).json({
                cart: {
                    products: enrichedProducts,
                    totalPrice,
                    taxes: settingFees.taxes,
                    cartId: cart.id,
                    shippingFee: settingFees.shippingFee,
                    loyaltyPoint: user.loyaltyPoint
                }
            });
        }

        const isSameProduct = async (cartItem, sessionItem) => {
            if (cartItem.product_id.toString() !== sessionItem.product_id.toString()) return false;

            const product = await Product.findOne({ _id: sessionItem.product_id }).select("color variant");

            if (!product) return false;

            if (product.color === sessionItem.color && product.color === cartItem.color) return true;

            const variantMatch = product.variant.find(v => v.color === sessionItem.color && v.color === cartItem.color);

            return !!variantMatch;
        };

        if (sessionCart && cart) {
            for (const p of sessionCart.products) {
                let matchedIndex = -1;

                for (let i = 0; i < cart.products.length; i++) {
                    const isMatch = await isSameProduct(cart.products[i], p);
                    if (isMatch) {
                        matchedIndex = i;
                        break;
                    }
                }

                if (matchedIndex !== -1) {
                    cart.products[matchedIndex].quantity += p.quantity;
                } else {
                    cart.products.push(p);
                }
            }

            const enrichedProducts = await cartHelper(cart.products);
            const totalPrice = enrichedProducts.reduce((sum, item) => sum + item.totalPrice, 0);

            await cart.save();
            await Cart.deleteOne({
                session_id: sessionId
            });

            const user = await User.findOne({ token: tokenId });
            return res.status(200).json({
                cart: {
                    products: enrichedProducts,
                    totalPrice,
                    taxes: settingFees.taxes,
                    cartId: cart.id,
                    shippingFee: settingFees.shippingFee,
                    loyaltyPoint: user.loyaltyPoint
                }
            });
        }

        cart.totalPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0);

        return res.status(400).json({ message: "Không tìm thấy giỏ hàng" });
    } catch (error) {
        return res.status(400).json({ message: "Lỗi hệ thống, không tìm thấy thông tin" });
    }
}

// [POST] /cart/add/:productId/
module.exports.addPost = async (req, res) => {
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity);
    const color = req.body.color;
    const sessionId = req.body.sessionId;
    const tokenId = req.body.tokenId;

    let sessionCart = null;

    let user = null;

    let isHaveCart = null;

    if (sessionId) {
        sessionCart = await Cart.findOne({
            session_id: sessionId
        });
    }

    if (tokenId) {
        user = await User.findOne({
            token: tokenId
        });

        if (user) {
            isHaveCart = await Cart.findOne({
                user_id: user._id
            });
        }
    }

    if (!isHaveCart && !sessionCart) {
        let newCart;

        if (!tokenId && sessionId) {
            newCart = new Cart({
                user_id: null,
                session_id: sessionId,
                products: []
            });
        }
        else {
            newCart = new Cart({
                user_id: user ? user._id : null,
                session_id: null,
                products: []
            });
        }

        await newCart.save();
    }

    let cart = null;

    if (user) {
        cart = await Cart.findOne({ user_id: user._id });
    }

    if (!cart && sessionId) {
        cart = await Cart.findOne({ session_id: sessionId });
    }

    const existProductInCart = cart.products.find(item => item.product_id == productId && item.color == color);

    if (existProductInCart) {

        const quantityNew = quantity + existProductInCart.quantity;

        await Cart.updateOne({
            _id: cart._id,
            "products.product_id": productId,
            "products.color": color
        }, {
            $set: {
                "products.$.quantity": quantityNew
            }
        });
    } else {
        const objectCart = {
            product_id: productId,
            color: color,
            quantity: quantity
        };

        await Cart.updateOne(
            {
                _id: cart._id
            },
            {
                $push: { products: objectCart }
            }
        );
    }

    return res.status(201).json({ message: "Đã thêm sản phẩm vào giỏ hàng!!!" });
}

// [POST] /cart/delete/:productId
module.exports.delete = async (req, res) => {
    const sessionId = req.body.sessionId;
    const tokenId = req.body.tokenId;
    const color = req.body.color;
    const productId = req.params.productId;

    let cart = null;

    let user = null;

    if (tokenId) {
        user = await User.findOne({
            token: tokenId
        });

        if (user) {
            isHaveCart = await Cart.findOne({
                user_id: user._id
            });
        }
    }

    if (user) {
        cart = await Cart.findOne({ user_id: user._id });
    }

    if (!cart && sessionId) {
        cart = await Cart.findOne({ session_id: sessionId });
    }

    if (!cart) {
        return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
    }

    const productInCart = cart.products.find(
        (p) => p.product_id === productId && p.color === color
    );

      
    if (!productInCart) {
        return res.status(404).json({ error: "Sản phẩm không tồn tại trong giỏ hàng" });
    }

    await Cart.updateOne({
        _id: cart._id,
        "products.product_id": productId,
        "products.color": color
    }, {
        $pull: { products: { product_id: productId, color: color } }
    });

    return res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng!!!" });
}

// [PATCH] /cart/update/:productId/:quantity/:color
module.exports.update = async (req, res) => {
    const sessionId = req.body.sessionId;
    const tokenId = req.body.tokenId;
    const color = req.query.color;
    const productId = req.params.productId;
    const quantity = req.params.quantity;

    let cart = null;

    let user = null;

    if (tokenId) {
        user = await User.findOne({
            token: tokenId
        });

        if (user) {
            isHaveCart = await Cart.findOne({
                user_id: user._id
            });
        }
    }

    if (user) {
        cart = await Cart.findOne({ user_id: user._id });
    }

    if (!cart && sessionId) {
        cart = await Cart.findOne({ session_id: sessionId });
    }

    if (!cart) {
        return res.status(404).json({ error: "Không tìm thấy giỏ hàng" });
    }

    const productInCart = cart.products.find(
        (p) => p.product_id === productId && p.color === color
    );

      
    if (!productInCart) {
        return res.status(404).json({ error: "Sản phẩm không tồn tại trong giỏ hàng" });
    }

    await Cart.updateOne(
        {
            _id: cart._id,
            "products.product_id": productId,
            "products.color": color
        },
        {
            $set: {
                "products.$.quantity": quantity,
            },
        }
    );

    return res.status(200).json({ message: "Đã cập nhật số lượng sản phẩm trong giỏ hàng!!!" });
}