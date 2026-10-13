const repository =
    require("./ledgerAccount.repository");

const Account =
    require("../account/account.model");


// ========================================
// CREATE LEDGER ACCOUNT
// ========================================

const createLedgerAccount = async (data) => {

    const {
        societyId,
        unitId,
        memberId,
        accountId,
        ledgerCode,
        ledgerName,
        openingBalance = 0,
        balanceType = "DEBIT",
        description,
        remarks
    } = data;


    // ----------------------------------------
    // Basic validation
    // ----------------------------------------

    if (!societyId) {
        throw new Error(
            "societyId is required"
        );
    }

    if (!accountId) {
        throw new Error(
            "accountId is required"
        );
    }

    if (!ledgerCode) {
        throw new Error(
            "ledgerCode is required"
        );
    }

    if (!ledgerName) {
        throw new Error(
            "ledgerName is required"
        );
    }


    if (!unitId && !memberId) {
        throw new Error(
            "Either unitId or memberId is required"
        );
    }


    if (
        !["DEBIT", "CREDIT"].includes(
            balanceType
        )
    ) {
        throw new Error(
            "Invalid balanceType"
        );
    }


    const opening =
        Number(openingBalance);


    if (
        Number.isNaN(opening) ||
        opening < 0
    ) {
        throw new Error(
            "Opening balance must be a valid non-negative number"
        );
    }


    // ----------------------------------------
    // Check Chart of Accounts account
    // ----------------------------------------

    const account =
        await Account.findOne({
            where: {
                id: accountId,
                societyId,
                isActive: true
            }
        });


    if (!account) {
        throw new Error(
            "Invalid, inactive, or unauthorized account"
        );
    }


    // ----------------------------------------
    // Check duplicate ledger code
    // ----------------------------------------

    const existingCode =
        await repository.findByCode(
            societyId,
            ledgerCode
        );


    if (existingCode) {
        throw new Error(
            "Ledger code already exists in this society"
        );
    }


    // ----------------------------------------
    // Check duplicate unit + account
    // ----------------------------------------

    if (unitId) {

        const existingLedger =
            await repository.findByUnitAndAccount(
                societyId,
                unitId,
                accountId
            );

        if (existingLedger) {
            throw new Error(
                "Ledger account already exists for this unit and account"
            );
        }
    }


    // ----------------------------------------
    // Create ledger
    // ----------------------------------------

    const ledger =
        await repository.create({

            societyId,

            unitId:
                unitId || null,

            memberId:
                memberId || null,

            accountId,

            ledgerCode,

            ledgerName,

            openingBalance:
                opening.toFixed(2),

            currentBalance:
                opening.toFixed(2),

            balanceType,

            isActive: true,

            description,

            remarks
        });


    return ledger;
};


// ========================================
// GET ALL
// ========================================

const getAll = async (filters) => {

    return await repository.findAll(
        filters
    );
};


// ========================================
// GET BY ID
// ========================================

const getById = async (id) => {

    const ledger =
        await repository.findById(id);

    if (!ledger) {
        throw new Error(
            "Ledger account not found"
        );
    }

    return ledger;
};


// ========================================
// GET BY UNIT
// ========================================

const getByUnit = async (
    societyId,
    unitId
) => {

    return await repository.findByUnit(
        societyId,
        unitId
    );
};


// ========================================
// GET BY MEMBER
// ========================================

const getByMember = async (
    societyId,
    memberId
) => {

    return await repository.findByMember(
        societyId,
        memberId
    );
};


// ========================================
// ACTIVATE
// ========================================

const activate = async (id) => {

    const ledger =
        await repository.findById(id);

    if (!ledger) {
        throw new Error(
            "Ledger account not found"
        );
    }

    await ledger.update({
        isActive: true
    });

    return ledger;
};


// ========================================
// DEACTIVATE
// ========================================

const deactivate = async (id) => {

    const ledger =
        await repository.findById(id);

    if (!ledger) {
        throw new Error(
            "Ledger account not found"
        );
    }

    await ledger.update({
        isActive: false
    });

    return ledger;
};


// ========================================
// UPDATE
// ========================================

const update = async (
    id,
    data
) => {

    const ledger =
        await repository.findById(id);

    if (!ledger) {
        throw new Error(
            "Ledger account not found"
        );
    }


    // Do not allow accounting identity changes
    delete data.societyId;
    delete data.accountId;
    delete data.unitId;
    delete data.memberId;
    delete data.currentBalance;
    delete data.openingBalance;


    await ledger.update(data);

    return ledger;
};


// ========================================
// DELETE
// ========================================

const deleteLedgerAccount = async (id) => {

    const ledger =
        await repository.findById(id);

    if (!ledger) {
        throw new Error(
            "Ledger account not found"
        );
    }


    // Do not delete ledger if it has
    // financial history in future implementation.

    await repository.deleteById(id);

    return true;
};


module.exports = {
    createLedgerAccount,
    getAll,
    getById,
    getByUnit,
    getByMember,
    activate,
    deactivate,
    update,
    deleteLedgerAccount
};