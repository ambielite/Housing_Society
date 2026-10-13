const StaffTaskService =
    require("./staffTask.service");


// CREATE
const createTask = async (req, res) => {

    try {

        const task =
            await StaffTaskService.createTask(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Staff task created successfully",
            data: task
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// GET ALL
const getAllTasks = async (req, res) => {

    try {

        const filters = {};

        if (req.query.societyId) {
            filters.societyId =
                req.query.societyId;
        }

        if (req.query.staffId) {
            filters.staffId =
                req.query.staffId;
        }

        if (req.query.status) {
            filters.status =
                req.query.status;
        }

        if (req.query.priority) {
            filters.priority =
                req.query.priority;
        }

        if (req.query.taskType) {
            filters.taskType =
                req.query.taskType;
        }


        const tasks =
            await StaffTaskService.getAllTasks(
                filters
            );

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// GET BY ID
const getTaskById = async (req, res) => {

    try {

        const task =
            await StaffTaskService.getTaskById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: task
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};


// GET STAFF TASKS
const getTasksByStaff = async (req, res) => {

    try {

        const tasks =
            await StaffTaskService.getTasksByStaff(
                req.params.staffId
            );

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// UPDATE
const updateTask = async (req, res) => {

    try {

        const task =
            await StaffTaskService.updateTask(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Staff task updated successfully",
            data: task
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// START
const startTask = async (req, res) => {

    try {

        const task =
            await StaffTaskService.startTask(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Task started successfully",
            data: task
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// COMPLETE
const completeTask = async (req, res) => {

    try {

        const task =
            await StaffTaskService.completeTask(
                req.params.id,
                req.body.completionRemarks
            );

        res.status(200).json({
            success: true,
            message: "Task completed successfully",
            data: task
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// CANCEL
const cancelTask = async (req, res) => {

    try {

        const task =
            await StaffTaskService.cancelTask(
                req.params.id,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message: "Task cancelled successfully",
            data: task
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// OVERDUE
const markOverdue = async (req, res) => {

    try {

        const task =
            await StaffTaskService.markOverdue(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Task marked as overdue",
            data: task
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// DELETE
const deleteTask = async (req, res) => {

    try {

        const result =
            await StaffTaskService.deleteTask(
                req.params.id
            );

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


module.exports = {

    createTask,
    getAllTasks,
    getTaskById,
    getTasksByStaff,
    updateTask,
    startTask,
    completeTask,
    cancelTask,
    markOverdue,
    deleteTask

};