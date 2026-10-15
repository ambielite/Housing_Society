import axiosClient from "../../../lib/axios";

const request = async (promise) => (await promise).data;

const communityApi = {
    get: (path, config) => request(axiosClient.get(path, config)),
    post: (path, data = {}, config) => request(axiosClient.post(path, data, config)),
    put: (path, data = {}, config) => request(axiosClient.put(path, data, config)),
    delete: (path, config) => request(axiosClient.delete(path, config))
};

export default communityApi;
