import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

export const listPurchaseOrders = (params) => api.get('/purchase-orders', { params: clean(params) }).then(unwrap);
export const getPurchaseOrder = (id) => api.get(`/purchase-orders/${id}`).then(unwrap);
export const createPurchaseOrder = (payload) => api.post('/purchase-orders', payload).then(unwrap);
export const updatePurchaseOrderStatus = (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }).then(unwrap);
export const addPurchaseOrderLine = (id, payload) => api.post(`/purchase-orders/${id}/lines`, payload).then(unwrap);
export const listPurchaseOrderLines = (id) => api.get(`/purchase-orders/${id}/lines`).then(unwrap);

export const createGoodsReceipt = (payload) => api.post('/purchase-orders/goods-receipts', payload).then(unwrap);
export const listGoodsReceipts = (poId) => api.get(`/purchase-orders/${poId}/goods-receipts`).then(unwrap);
export const getGoodsReceipt = (receiptId) => api.get(`/purchase-orders/goods-receipts/${receiptId}`).then(unwrap);
