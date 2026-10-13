const service = require("./occupancy.service");

const createOccupancy = async (
    req,
    res
) => {
    try {
        const occupancy =
            await service.createOccupancy(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Occupancy created successfully",
            data: occupancy
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getOccupancies = async (
    req,
    res
) => {
    try {
        const occupancies =
            await service.getOccupancies();

        return res.status(200).json({
            success: true,
            data: occupancies
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getOccupancy = async (
    req,
    res
) => {
    try {
        const occupancy =
            await service.getOccupancy(
                req.params.id
            );

        if (!occupancy) {
            return res.status(404).json({
                success: false,
                message: "Occupancy not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: occupancy
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getCurrentOccupancyByUnit =
    async (req, res) => {
        try {
            const occupancy =
                await service
                    .getCurrentOccupancyByUnit(
                        req.params.unitId
                    );

            if (!occupancy) {
                return res.status(404).json({
                    success: false,
                    message:
                        "No current occupancy found for this unit"
                });
            }

            return res.status(200).json({
                success: true,
                data: occupancy
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

const getOccupancyHistoryByUnit =
    async (req, res) => {
        try {
            const occupancies =
                await service
                    .getOccupancyHistoryByUnit(
                        req.params.unitId
                    );

            return res.status(200).json({
                success: true,
                data: occupancies
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

const getOccupancyHistoryByResident =
    async (req, res) => {
        try {
            const occupancies =
                await service
                    .getOccupancyHistoryByResident(
                        req.params.residentId
                    );

            return res.status(200).json({
                success: true,
                data: occupancies
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

const closeOccupancy = async (
    req,
    res
) => {
    try {
        const occupancy =
            await service.closeOccupancy(
                req.params.id,
                req.body.endDate
            );

        if (!occupancy) {
            return res.status(404).json({
                success: false,
                message: "Occupancy not found"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Occupancy closed successfully",
            data: occupancy
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const transferOccupancy = async (
    req,
    res
) => {
    try {
        const occupancy =
            await service.transferOccupancy(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Occupancy transferred successfully",
            data: occupancy
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createOccupancy,
    getOccupancies,
    getOccupancy,
    getCurrentOccupancyByUnit,
    getOccupancyHistoryByUnit,
    getOccupancyHistoryByResident,
    closeOccupancy,
    transferOccupancy
};