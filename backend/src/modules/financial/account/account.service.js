const repository =
    require("./account.repository");

const {
    validateCreateAccount
} =
    require("./account.validation");


const createAccount = async (data) => {

    const errors =
        validateCreateAccount(data);

    if (errors.length > 0) {

        throw new Error(
            errors.join(", ")
        );
    }


    /*
     * Check duplicate account code
     */

    const existingByCode =
        await repository.findByCode(
            data.societyId,
            data.accountCode
        );

    if (existingByCode) {

        throw new Error(
            "Account code already exists for this society"
        );
    }


    /*
     * Check duplicate account name
     */

    const existingByName =
        await repository.findByName(
            data.societyId,
            data.accountName
        );

    if (existingByName) {

        throw new Error(
            "Account name already exists for this society"
        );
    }


    /*
     * Validate parent account
     */

    if (data.parentAccountId) {

        const parent =
            await repository.findById(
                data.parentAccountId
            );

        if (!parent) {

            throw new Error(
                "Parent account not found"
            );
        }


        if (
            parent.societyId !==
            data.societyId
        ) {

            throw new Error(
                "Parent account belongs to another society"
            );
        }
    }


    return await repository.create(data);
};


const getAllAccounts = async (
    societyId
) => {

    return await repository.findAll(
        societyId
    );
};


const getAccountById = async (
    id
) => {

    const account =
        await repository.findById(id);

    if (!account) {

        throw new Error(
            "Account not found"
        );
    }

    return account;
};


const getByType = async (
    societyId,
    accountType
) => {

    return await repository.findByType(
        societyId,
        accountType
    );
};


const getChildren = async (
    parentAccountId
) => {

    const parent =
        await repository.findById(
            parentAccountId
        );

    if (!parent) {

        throw new Error(
            "Parent account not found"
        );
    }

    return await repository.findChildren(
        parentAccountId
    );
};


const updateAccount = async (
    id,
    data
) => {

    const account =
        await repository.findById(id);

    if (!account) {

        throw new Error(
            "Account not found"
        );
    }


    /*
     * Account code validation
     */

    if (data.accountCode) {

        const duplicate =
            await repository.findByCode(
                account.societyId,
                data.accountCode
            );

        if (
            duplicate &&
            duplicate.id !== id
        ) {

            throw new Error(
                "Account code already exists"
            );
        }
    }


    /*
     * Parent validation
     */

    if (data.parentAccountId) {

        if (
            data.parentAccountId === id
        ) {

            throw new Error(
                "An account cannot be its own parent"
            );
        }


        const parent =
            await repository.findById(
                data.parentAccountId
            );

        if (!parent) {

            throw new Error(
                "Parent account not found"
            );
        }


        if (
            parent.societyId !==
            account.societyId
        ) {

            throw new Error(
                "Parent account belongs to another society"
            );
        }
    }


    return await repository.update(
        id,
        data
    );
};


const deactivateAccount = async (
    id
) => {

    const account =
        await repository.findById(id);

    if (!account) {

        throw new Error(
            "Account not found"
        );
    }


    if (!account.isActive) {

        throw new Error(
            "Account is already inactive"
        );
    }


    return await repository.update(
        id,
        {
            isActive: false
        }
    );
};


const activateAccount = async (
    id
) => {

    const account =
        await repository.findById(id);

    if (!account) {

        throw new Error(
            "Account not found"
        );
    }


    return await repository.update(
        id,
        {
            isActive: true
        }
    );
};


const deleteAccount = async (
    id
) => {

    const account =
        await repository.findById(id);

    if (!account) {

        throw new Error(
            "Account not found"
        );
    }


    /*
     * System accounts should never
     * be deleted.
     */

    if (account.isSystemAccount) {

        throw new Error(
            "System account cannot be deleted"
        );
    }


    /*
     * Accounts with child accounts
     * cannot be deleted.
     */

    const children =
        await repository.findChildren(id);

    if (children.length > 0) {

        throw new Error(
            "Account cannot be deleted because it has child accounts"
        );
    }


    await repository.deleteById(id);

    return true;
};


module.exports = {

    createAccount,

    getAllAccounts,

    getAccountById,

    getByType,

    getChildren,

    updateAccount,

    deactivateAccount,

    activateAccount,

    deleteAccount
};