const repository = require("./nonMember.repository");
const assertUniqueEmail = require("../../../common/assertUniqueEmail");
const NonMember = require("./nonMember.model");

const createNonMember = async (data) => {
    if (data.email) data.email = data.email.trim().toLowerCase();
    const existing = await repository.findByMobile(
        data.mobile,
        data.societyId
    );

    if (existing) {
        throw new Error(
            "A non-member with this mobile number already exists in this society"
        );
    }

    await assertUniqueEmail({ model: NonMember, email: data.email, where: { societyId: data.societyId }, message: "A non-member with this email already exists in this society." });

    const nonMember = await repository.create({
        societyId: data.societyId,
        memberType: data.memberType,
        name: data.name,
        organizationName: data.organizationName || null,
        businessName: data.businessName || null,
        email: data.email || null,
        mobile: data.mobile,
        alternateMobile: data.alternateMobile || null,
        emergencyContactName:
            data.emergencyContactName || null,
        emergencyContactMobile:
            data.emergencyContactMobile || null,
        address: data.address || null,
        unitId: data.unitId || null,
        shopNumber: data.shopNumber || null,
        serviceDescription:
            data.serviceDescription || null,
        identityDocumentType:
            data.identityDocumentType || null,
        identityDocumentNumber:
            data.identityDocumentNumber || null,
        status: data.status || "PENDING",
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        remarks: data.remarks || null,
        customFields: data.customFields || {},
        metadata: data.metadata || {}
    });

    return nonMember;
};

const getById = async (id) => {
    const nonMember = await repository.findById(id);

    if (!nonMember) {
        throw new Error("Non-member not found");
    }

    return nonMember;
};

const getAll = async (filters = {}) => {
    return await repository.findAll(filters);
};

const getBySociety = async (societyId) => {
    return await repository.findBySociety(societyId);
};

const updateNonMember = async (id, data) => {
    const existing = await repository.findById(id);

    if (!existing) {
        throw new Error("Non-member not found");
    }

    if (data.mobile && data.mobile !== existing.mobile) {
        const duplicate = await repository.findByMobile(
            data.mobile,
            existing.societyId
        );

        if (duplicate && duplicate.id !== id) {
            throw new Error(
                "Another non-member with this mobile number already exists"
            );
        }
    }

    if (data.email !== undefined) {
        if (data.email) data.email = data.email.trim().toLowerCase();
        await assertUniqueEmail({ model: NonMember, email: data.email, where: { societyId: existing.societyId }, excludeId: id, message: "A non-member with this email already exists in this society." });
    }

    return await repository.update(id, data);
};

const updateStatus = async (
    id,
    status,
    remarks
) => {
    const nonMember = await repository.findById(id);

    if (!nonMember) {
        throw new Error("Non-member not found");
    }

    const updateData = {
        status
    };

    if (remarks !== undefined) {
        updateData.remarks = remarks;
    }

    if (status === "ACTIVE") {
        updateData.approvedAt = new Date();
    }

    return await repository.update(id, updateData);
};

const approve = async (
    id,
    approvedBy,
    remarks
) => {
    const nonMember = await repository.findById(id);

    if (!nonMember) {
        throw new Error("Non-member not found");
    }

    return await repository.update(id, {
        status: "ACTIVE",
        approvedBy,
        approvedAt: new Date(),
        remarks: remarks || nonMember.remarks
    });
};

const search = async (societyId, searchText) => {
    const records = await repository.findBySociety(societyId);

    if (!searchText) {
        return records;
    }

    const search = searchText.toLowerCase();

    return records.filter((item) => {
        return (
            item.name?.toLowerCase().includes(search) ||
            item.mobile?.toLowerCase().includes(search) ||
            item.email?.toLowerCase().includes(search) ||
            item.organizationName
                ?.toLowerCase()
                .includes(search) ||
            item.businessName
                ?.toLowerCase()
                .includes(search) ||
            item.shopNumber
                ?.toLowerCase()
                .includes(search)
        );
    });
};

const deleteNonMember = async (id) => {
    const nonMember = await repository.findById(id);

    if (!nonMember) {
        throw new Error("Non-member not found");
    }

    await repository.remove(id);

    return nonMember;
};

module.exports = {
    createNonMember,
    getById,
    getAll,
    getBySociety,
    updateNonMember,
    updateStatus,
    approve,
    search,
    deleteNonMember
};
