const service =
    require("./account.service");


const create = async (
    req,
    res
) => {

    try {

        const result =
            await service.createAccount(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Account created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAll = async (
    req,
    res
) => {

    try {

        const result =
            await service.getAllAccounts(
                req.query.societyId
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getById = async (
    req,
    res
) => {

    try {

        const result =
            await service.getAccountById(
                req.params.id
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getByType = async (
    req,
    res
) => {

    try {

        const result =
            await service.getByType(
                req.params.societyId,
                req.params.accountType
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getChildren = async (
    req,
    res
) => {

    try {

        const result =
            await service.getChildren(
                req.params.parentAccountId
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const update = async (
    req,
    res
) => {

    try {

        const result =
            await service.updateAccount(
                req.params.id,
                req.body
            );

        res.json({
            success: true,
            message:
                "Account updated successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivate = async (
    req,
    res
) => {

    try {

        const result =
            await service.deactivateAccount(
                req.params.id
            );

        res.json({
            success: true,
            message:
                "Account deactivated successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activate = async (
    req,
    res
) => {

    try {

        const result =
            await service.activateAccount(
                req.params.id
            );

        res.json({
            success: true,
            message:
                "Account activated successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const remove = async (
    req,
    res
) => {

    try {

        await service.deleteAccount(
            req.params.id
        );

        res.json({
            success: true,
            message:
                "Account deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {

    create,

    getAll,

    getById,

    getByType,

    getChildren,

    update,

    deactivate,

    activate,

    remove
};