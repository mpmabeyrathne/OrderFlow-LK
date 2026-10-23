
import productRepository, {
    type CreateProductData,
    type UpdateProductData,
} from "../repositories/product.repository.js";
import { AppError } from "../utils/app-error.js";

class ProductService {
    createProduct(data: CreateProductData) {
        return productRepository.create(data);
    }

    getProducts() {
        return productRepository.findAll();
    }

    getProductById(id: string) {
        return productRepository.findById(id);
    }

    updateProduct(id: string, data: UpdateProductData) {
        return productRepository.updateProduct(id, data);
    }

    async updateStock(id: string, stockQuantity: number, expectedStockQuantity: number) {
        const product = await productRepository.updateStock(id, stockQuantity, expectedStockQuantity);
      
        if (!product) {
          // Failed compare-and-swap: product was deleted or stock changed after the client read it.
          const existing = await productRepository.findById(id);
          if (!existing) throw new AppError(404, "Product not found");
          throw new AppError(409, "Stock has changed. Refresh the product and retry.");
        }
      
        return product;
      }
}

export default new ProductService();
