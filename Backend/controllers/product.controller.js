import redis from "../lib/redis.js";
import Product from "../model/product.model.js";
import cloudinary from "../lib/cloudinary.js";
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    console.log("Error in GetAllProducts controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_Products");
    if (featuredProducts) {
      return res.status(200).json(JSON.parse(featuredProducts));
    }

    //    if it is not in redis, fetch from db
    // lean() is used to convert the mongoose document to a plain javascript object
    // this is done to avoid the overhead of mongoose document methods
    // and to improve performance when we don't need those methods
    featuredProducts = await Product.find({ isFeatured: true }).lean();

    // check if featuredProducts is empty
    if (!featuredProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }

    // set the data in redis

    await redis.set("featured_Products", JSON.stringify(featuredProducts));

    res.status(200).json(featuredProducts);
  } catch (error) {
    console.log("Error in GetFeaturedProducts controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;

    let cloudinaryResponse;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }
    const product = new Product({
      name,
      price,
      description,
      image: cloudinaryResponse ? cloudinaryResponse.secure_url : "",
      category,
    });

    await product.save(); // <-- This line saves the product to MongoDB

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in CreateProduct controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image deleted from cloudinary");
      } catch (error) {
        console.log("Error in deleting image from cloudinary", error);
        return res
          .status(500)
          .json({ message: "Error in deleting image from cloudinary" });
      }
    }
    await product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in DeleteProduct controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          description: 1,
          image: 1,
        },
      },
    ]);
    res.status(200).json(products); // <-- Add this line!
  } catch (error) {
    console.log("Error in GetRecommendedProducts controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    res.status(200).json({ products });
  } catch (error) {
    console.log("Error in GetProductsByCategory controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.log("Error in ToggleFeaturedProduct controller", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    // check if the cache is already set
    // lean is used to convert the mongoose document to a plain javascript object
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_Products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("Error in updating featured products cache", error);
  }
}
