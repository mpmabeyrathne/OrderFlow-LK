import productRepository, { CreateProductData, UpdateProductData } from "../repositories/product.repository.js";

class ProductService {
    createProduct = async (data: CreateProductData) => {
        try {
            return await productRepository.create(data);
        } catch (error: unknown) {
            throw error;
        }
    }

    getProducts = async () => {
        return productRepository.findAll();
    }

    getProductById = async (id: string) => {
        return productRepository.findById(id);
    }

    updateProduct = async (id: string , data : UpdateProductData)=>{
        return productRepository.updateProduct(id, data);
    }
}

export default new ProductService();