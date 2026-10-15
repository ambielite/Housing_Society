import { legacyApi as axiosClient } from "../../../lib/axios";

const payload = async (request) => (await request).data;
const multiSocietyApi = {
    organizations: () => payload(axiosClient.get("/organizations")),
    organization: (id) => payload(axiosClient.get(`/organizations/${id}`)),
    createOrganization: (data) => payload(axiosClient.post("/organizations", data)),
    updateOrganization: (id, data) => payload(axiosClient.put(`/organizations/${id}`, data)),
    organizationStatus: (id, status) => payload(axiosClient.post(`/organizations/${id}/${status.toLowerCase()}`)),
    deleteOrganization: (id) => payload(axiosClient.delete(`/organizations/${id}`)),
    clusters: () => payload(axiosClient.get("/clusters")),
    clustersByOrganization: (id) => payload(axiosClient.get(`/clusters/organization/${id}`)),
    createCluster: (data) => payload(axiosClient.post("/clusters", data)),
    updateCluster: (id, data) => payload(axiosClient.put(`/clusters/${id}`, data)),
    clusterStatus: (id, status) => payload(axiosClient.post(`/clusters/${id}/${status.toLowerCase()}`)),
    deleteCluster: (id) => payload(axiosClient.delete(`/clusters/${id}`)),
    societies: () => payload(axiosClient.get("/societies")),
    societiesByOrganization: (id) => payload(axiosClient.get(`/society-management/organization/${id}`)),
    societiesByCluster: (id) => payload(axiosClient.get(`/society-management/cluster/${id}`)),
    assignSociety: (data) => payload(axiosClient.post("/society-management/assign", data)),
    removeMapping: (id) => payload(axiosClient.delete(`/society-management/society/${id}/mapping`)),
    organizationHierarchy: (id) => payload(axiosClient.get(`/society-management/organization/${id}/hierarchy`)),
    clusterHierarchy: (id) => payload(axiosClient.get(`/society-management/cluster/${id}/hierarchy`)),
    societyHierarchy: (id) => payload(axiosClient.get(`/society-management/society/${id}`)),
    userAccess: (id) => payload(axiosClient.get(`/multi-society/access/user/${id}`)),
    activeUserAccess: (id) => payload(axiosClient.get(`/multi-society/access/user/${id}/active`)),
    checkSocietyAccess: (userId, societyId) => payload(axiosClient.get(`/multi-society/access/user/${userId}/society/${societyId}`)),
    createMultiAccess: (data) => payload(axiosClient.post("/multi-society/access", data)),
    multiAccessStatus: (id, status) => payload(axiosClient.post(`/multi-society/access/${id}/${status.toLowerCase()}`)),
    deleteMultiAccess: (id) => payload(axiosClient.delete(`/multi-society/access/${id}`)),
    createSocietyAccess: (data) => payload(axiosClient.post("/society-access", data)),
    userSocieties: (id) => payload(axiosClient.get(`/society-access/user/${id}`)),
    defaultSociety: (id) => payload(axiosClient.get(`/society-access/user/${id}/default`)),
    switchSociety: (data) => payload(axiosClient.post("/society-access/switch", data)),
    updateSocietyAccess: (id, data) => payload(axiosClient.put(`/society-access/${id}`, data)),
    deleteSocietyAccess: (id) => payload(axiosClient.delete(`/society-access/${id}`)),
    clusterDashboard: (id) => payload(axiosClient.get(`/cluster-reports/cluster/${id}/dashboard`)),
    clusterSummary: (id) => payload(axiosClient.get(`/cluster-reports/cluster/${id}/summary`)),
    clusterOperationsDashboard: (id) => payload(axiosClient.get(`/cluster-dashboard/${id}/dashboard`)),
    clusterSocieties: (id) => payload(axiosClient.get(`/cluster-dashboard/${id}/societies`)),
    organizationDashboard: (id) => payload(axiosClient.get(`/cluster-reports/organization/${id}/dashboard`))
};

export default multiSocietyApi;
