import { legacyApi } from "../../../lib/axios";

const base = "/society-emergency-contacts";

const societyEmergencyContactApi = {
  list: async () => (await legacyApi.get(base)).data,
  create: async (data) => (await legacyApi.post(base, data)).data,
  update: async (id, data) => (await legacyApi.put(`${base}/${id}`, data)).data,
  remove: async (id) => (await legacyApi.delete(`${base}/${id}`)).data,
};

export default societyEmergencyContactApi;
