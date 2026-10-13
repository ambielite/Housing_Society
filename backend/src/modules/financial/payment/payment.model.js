const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Payment = sequelize.define(
    "Payment",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        societyId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "society_id"
        },

        invoiceId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "invoice_id"
        },

        unitId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "unit_id"
        },

        memberId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "member_id"
        },

        ledgerAccountId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "ledger_account_id"
        },

        paymentReference: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "payment_reference"
        },

        paymentMethod: {
            type: DataTypes.ENUM(
                "ONLINE",
                "CHEQUE",
                "NEFT",
                "RTGS",
                "BANK_TRANSFER",
                "CASH"
            ),
            allowNull: false,
            field: "payment_method"
        },

        paymentChannel: {
            type: DataTypes.ENUM(
                "GATEWAY",
                "OFFLINE"
            ),
            allowNull: false,
            defaultValue: "OFFLINE",
            field: "payment_channel"
        },

        amount: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: false,
            validate: {
                min: 0.01
            }
        },

        paymentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "payment_date"
        },

        status: {
            type: DataTypes.ENUM(
                "INITIATED",
                "PENDING",
                "SUCCESS",
                "FAILED",
                "CANCELLED",
                "REFUNDED",
                "VERIFICATION_PENDING",
                "VERIFIED"
            ),
            allowNull: false,
            defaultValue: "INITIATED"
        },

        gatewayName: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: "gateway_name"
        },

        gatewayOrderId: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "gateway_order_id"
        },

        gatewayTransactionId: {
            type: DataTypes.STRING(150),
            allowNull: true,
            field: "gateway_transaction_id"
        },

        gatewaySignature: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "gateway_signature"
        },

        idempotencyKey: {
            type: DataTypes.STRING(150),
            allowNull: false,
            field: "idempotency_key"
        },

        receiptNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: "receipt_number"
        },

        journalId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "journal_id"
        },

        verificationRemarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "verification_remarks"
        },

        verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "verified_by"
        },

        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "verified_at"
        },

        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "created_at"
        },

        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "updated_at"
        }
    },
    {
        tableName: "payments",
        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: [
                    "society_id",
                    "idempotency_key"
                ]
            },

            {
                unique: true,
                fields: [
                    "society_id",
                    "payment_reference"
                ]
            },

            {
                unique: true,
                fields: [
                    "receipt_number"
                ]
            },

            {
                fields: [
                    "invoice_id"
                ]
            },

            {
                fields: [
                    "status"
                ]
            },

            {
                fields: [
                    "payment_date"
                ]
            }
        ]
    }
);

module.exports = Payment;