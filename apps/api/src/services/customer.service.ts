
import customerRepository, {
    type CreateCustomerData,
} from "../repositories/customer.repository.js";
import { AppError } from "../utils/app-error.js";

class CustomerService {
    async createCustomer(data: CreateCustomerData) {
        try {
            return await customerRepository.create(data);
        } catch (error: unknown) {
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "23505"
            ) {
                throw new AppError(409, "Email already exists");
            }

            throw error;
        }
    }

    async getCustomers() {
        return customerRepository.findAll();
    }

    async getCustomerById(id: string) {
        return customerRepository.findById(id);
    }
}

export default new CustomerService();
