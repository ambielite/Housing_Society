const PaymentService =
    require("./payment.service");


const initiateOnlinePayment = async (
    req,
    res
) => {

    try {

        const result =
            await PaymentService
                .initiateOnlinePayment(
                    req.body
                );

        return res.status(
            result.duplicate
                ? 200
                : 201
        ).json({
            success: true,

            message:
                result.duplicate
                    ? "Existing payment returned"
                    : "Online payment initiated successfully",

            duplicate:
                result.duplicate,

            data:
                result.payment
        });

    } catch (error) {

        console.error(
            "Initiate payment error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const createOfflinePayment = async (
    req,
    res
) => {

    try {

        const result =
            await PaymentService
                .createOfflinePayment(
                    req.body
                );

        return res.status(
            result.duplicate
                ? 200
                : 201
        ).json({
            success: true,

            message:
                result.duplicate
                    ? "Existing payment returned"
                    : "Offline payment created successfully",

            duplicate:
                result.duplicate,

            data:
                result.payment
        });

    } catch (error) {

        console.error(
            "Offline payment error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const verifyOfflinePayment = async (
    req,
    res
) => {

    try {

        const result =
            await PaymentService
                .verifyOfflinePayment(
                    req.params.id,
                    req.body
                );

        return res.status(200).json({
            success: true,

            message:
                result.duplicate
                    ? "Payment already verified"
                    : "Payment verified successfully",

            duplicate:
                result.duplicate,

            data:
                result.payment
        });

    } catch (error) {

        console.error(
            "Payment verification error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const webhook = async (
    req,
    res
) => {

    try {

        const result =
            await PaymentService
                .processWebhook(
                    req.body
                );

        return res.status(200).json({
            success: true,

            message:
                result.duplicate
                    ? "Duplicate webhook ignored"
                    : "Webhook processed successfully",

            duplicate:
                result.duplicate,

            data:
                result.payment
        });

    } catch (error) {

        console.error(
            "Payment webhook error:",
            error
        );

        return res.status(400).json({
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

        const payment =
            await PaymentService.getById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error) {

        return res.status(404).json({
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

        const payments =
            await PaymentService.getAll({
                societyId:
                    req.query.societyId,

                status:
                    req.query.status,

                paymentMethod:
                    req.query.paymentMethod,

                invoiceId:
                    req.query.invoiceId
            });

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const cancelPayment = async (
    req,
    res
) => {

    try {

        const payment =
            await PaymentService
                .cancelPayment(
                    req.params.id,
                    req.body.remarks
                );

        return res.status(200).json({
            success: true,

            message:
                "Payment cancelled successfully",

            data:
                payment
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    initiateOnlinePayment,
    createOfflinePayment,
    verifyOfflinePayment,
    webhook,
    getById,
    getAll,
    cancelPayment
};