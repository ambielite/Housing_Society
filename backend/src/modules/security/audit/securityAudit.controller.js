const auditService =
    require("./securityAudit.service");


const createAudit = async (
    req,
    res
) => {

    try {

        const audit =
            await auditService.createAudit(
                req.body
            );


        res.status(201).json({

            success: true,

            message:
                "Security audit created successfully",

            data: audit
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message
        });
    }
};


const getAllAudits = async (
    req,
    res
) => {

    try {

        const result =
            await auditService.getAllAudits(
                req.query
            );


        res.status(200).json({

            success: true,

            total: result.total,

            limit: result.limit,

            offset: result.offset,

            data: result.audits
        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message
        });
    }
};


const getAuditById = async (
    req,
    res
) => {

    try {

        const audit =
            await auditService.getAuditById(
                req.params.id
            );


        res.status(200).json({

            success: true,

            data: audit
        });

    } catch (error) {

        res.status(404).json({

            success: false,

            message: error.message
        });
    }
};


const deleteAudit = async (
    req,
    res
) => {

    try {

        await auditService.deleteAudit(
            req.params.id
        );


        res.status(200).json({

            success: true,

            message:
                "Security audit deleted successfully"
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message
        });
    }
};


module.exports = {
    createAudit,
    getAllAudits,
    getAuditById,
    deleteAudit
};