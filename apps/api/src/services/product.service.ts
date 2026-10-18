
import productRepository, {
    type CreateProductData,
    type UpdateProductData,
} from "../repositories/product.repository.js";

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
}

export default new ProductService();
