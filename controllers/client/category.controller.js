const Category = require("../../models/category.model");
const Product = require("../../models/product.model");

// [GET] /categories/
module.exports.index = async (req, res) => {
    try {
        const categories = await Category.find({ deleted: false });
        
        const categoriesWithCount = await Promise.all(
            categories.map(async (item) => {
                const productCount = await Product.countDocuments({ category: item.id });
                return {
                    ...item.toObject(),
                    productCount: productCount
                };
            })
        );

        res.status(200).json({
            categories: categoriesWithCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server, vui lòng thử lại!" });
    }
};
