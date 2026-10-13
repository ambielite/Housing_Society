const repository =
    require("./billingResponsibility.repository");


const createBillingResponsibility = async (
    data
) => {

    const existing =
        await repository.findCurrentByUnit(
            data.unitId
        );

    if (existing) {
        throw new Error(
            "Unit already has a current billing responsibility"
        );
    }

    return await repository.create({
        societyId: data.societyId,

        unitId: data.unitId,

        residentId: data.residentId,

        responsibilityType:
            data.responsibilityType,

        startDate: data.startDate,

        endDate: null,

        isCurrent: true,

        billingAccountId:
            data.billingAccountId || null,

        remarks:
            data.remarks || null
    });
};


const getBillingResponsibilities =
    async () => {

        return await repository.findAll();
    };


const getBillingResponsibility =
    async (id) => {

        return await repository.findById(id);
    };


const getCurrentByUnit =
    async (unitId) => {

        return await repository.findCurrentByUnit(
            unitId
        );
    };


const getHistoryByUnit =
    async (unitId) => {

        return await repository.findByUnit(
            unitId
        );
    };


const getHistoryByResident =
    async (residentId) => {

        return await repository.findByResident(
            residentId
        );
    };


const getCurrentByResident =
    async (residentId) => {

        return await repository.findCurrentByResident(
            residentId
        );
    };


const closeResponsibility =
    async (id, endDate) => {

        const responsibility =
            await repository.findById(id);

        if (!responsibility) {
            throw new Error(
                "Billing responsibility not found"
            );
        }

        if (!responsibility.isCurrent) {
            throw new Error(
                "Billing responsibility is already closed"
            );
        }

        if (
            new Date(endDate) <
            new Date(responsibility.startDate)
        ) {
            throw new Error(
                "End date cannot be before start date"
            );
        }

        return await repository.closeResponsibility(
            id,
            endDate
        );
    };


const transferResponsibility =
    async (data) => {

        const {
            societyId,
            unitId,
            newResidentId,
            newResponsibilityType,
            transferDate,
            billingAccountId,
            remarks
        } = data;


        const current =
            await repository.findCurrentByUnit(
                unitId
            );


        if (current) {

            if (
                new Date(transferDate) <
                new Date(current.startDate)
            ) {
                throw new Error(
                    "Transfer date cannot be before current responsibility start date"
                );
            }

            await repository.closeResponsibility(
                current.id,
                transferDate
            );
        }


        return await repository.create({

            societyId,

            unitId,

            residentId: newResidentId,

            responsibilityType:
                newResponsibilityType,

            startDate:
                transferDate,

            endDate: null,

            isCurrent: true,

            billingAccountId:
                billingAccountId || null,

            remarks:
                remarks ||
                "Billing responsibility transferred"
        });
    };


const updateBillingResponsibility =
    async (id, data) => {

        const responsibility =
            await repository.findById(id);

        if (!responsibility) {
            throw new Error(
                "Billing responsibility not found"
            );
        }

        return await repository.update(
            id,
            data
        );
    };


const deleteBillingResponsibility =
    async (id) => {

        const responsibility =
            await repository.deleteById(id);

        if (!responsibility) {
            throw new Error(
                "Billing responsibility not found"
            );
        }

        return responsibility;
    };


module.exports = {
    createBillingResponsibility,
    getBillingResponsibilities,
    getBillingResponsibility,
    getCurrentByUnit,
    getHistoryByUnit,
    getHistoryByResident,
    getCurrentByResident,
    closeResponsibility,
    transferResponsibility,
    updateBillingResponsibility,
    deleteBillingResponsibility
};