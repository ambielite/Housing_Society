import { legacyApi as axiosClient } from "../../../lib/axios";

const residentKycApi = {
    getByResident: async (residentId) => {
        const response = await axiosClient.get(`/resident-kyc/stakeholder/${residentId}`);
        return response.data;
    },
    getFile: async (documentId) => {
        const response = await axiosClient.get(`/resident-kyc/${documentId}/file`, { responseType: "blob" });
        return response.data;
    },
    upload: async ({ societyId, stakeholderId, documentType, documentName, file }, config) => {
        const body = new FormData();
        body.append("societyId", societyId);
        body.append("stakeholderId", stakeholderId);
        body.append("documentType", documentType);
        body.append("documentName", documentName);
        body.append("file", file);
        const response = await axiosClient.post("/resident-kyc", body, {
            ...config,
            headers: { ...config?.headers, "Content-Type": "multipart/form-data" }
        });
        return response.data;
    }
};

export default residentKycApi;
