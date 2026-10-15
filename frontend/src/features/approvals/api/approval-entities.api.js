import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

export const listVendorInvoices = (params = {}) => api.get('/vendor-invoices', { params }).then(unwrap);
