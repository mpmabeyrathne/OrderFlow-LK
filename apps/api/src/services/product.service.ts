
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

    async updateStock(id: string, stockQuantity: number) {
        const product = await productRepository.updateStock(id, stockQuantity);
      
        if (!product) {
          throw new AppError(404,"Product not found");
        }
      
        return product;
      }
}

export default new ProductService();
