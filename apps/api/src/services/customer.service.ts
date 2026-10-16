
import customerRepository, {
    type CreateCustomerData,
} from "../repositories/customer.repository.js";

class CustomerService {
    async createCustomer(data: CreateCustomerData) {
        return customerRepository.create(data);
    }

    async getCustomers() {
        return customerRepository.findAll();
    }

    async getCustomerById(id: string) {
        return customerRepository.findById(id);
    }
}

export default new CustomerService();
