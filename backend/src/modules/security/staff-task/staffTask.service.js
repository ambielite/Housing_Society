const Society = require("../../societies/society/society.model");
const Staff = require("../staff/staff.model");

const StaffTaskRepository =
    require("./staffTask.repository");

const {
    validateCreate,
    validateUpdate
} = require("./staffTask.validation");


// CREATE TASK
const createTask = async (data) => {

    validateCreate(data);

    // Check society
    const society =
        await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }


    // Check staff
    const staff =
        await Staff.findByPk(data.staffId);

    if (!staff) {
        throw new Error("Staff not found");
    }


    // Staff must belong to same society
    if (staff.societyId !== data.societyId) {

        throw new Error(
            "Staff does not belong to this society"
        );

    }


    // Only active staff can receive tasks
    if (staff.status !== "ACTIVE") {

        throw new Error(
            "Only active staff can be assigned tasks"
        );

    }


    // Default status
    if (!data.status) {

        data.status = "ASSIGNED";

    }


    return await StaffTaskRepository.create(data);
};


// GET TASK BY ID
const getTaskById = async (id) => {

    const task =
        await StaffTaskRepository.findById(id);

    if (!task) {

        throw new Error("Staff task not found");

    }

    return task;
};


// GET ALL TASKS
const getAllTasks = async (filters = {}) => {

    return await StaffTaskRepository.findAll(filters);

};


// GET STAFF TASKS
const getTasksByStaff = async (staffId) => {

    return await StaffTaskRepository.findByStaffId(
        staffId
    );

};


// UPDATE TASK
const updateTask = async (id, data) => {

    validateUpdate(data);

    const task =
        await StaffTaskRepository.findById(id);

    if (!task) {

        throw new Error("Staff task not found");

    }


    // Do not allow normal update after completion
    if (task.status === "COMPLETED") {

        throw new Error(
            "Completed task cannot be updated"
        );

    }


    return await StaffTaskRepository.update(
        task,
        data
    );

};


// START TASK
const startTask = async (id) => {

    const task =
        await StaffTaskRepository.findById(id);

    if (!task) {

        throw new Error("Staff task not found");

    }


    if (task.status === "COMPLETED") {

        throw new Error(
            "Completed task cannot be started"
        );

    }


    if (task.status === "CANCELLED") {

        throw new Error(
            "Cancelled task cannot be started"
        );

    }


    return await StaffTaskRepository.update(
        task,
        {
            status: "IN_PROGRESS",
            startedAt: new Date()
        }
    );

};


// COMPLETE TASK
const completeTask = async (id, completionRemarks) => {

    const task =
        await StaffTaskRepository.findById(id);

    if (!task) {

        throw new Error("Staff task not found");

    }


    if (task.status === "CANCELLED") {

        throw new Error(
            "Cancelled task cannot be completed"
        );

    }


    if (task.status === "COMPLETED") {

        throw new Error(
            "Task is already completed"
        );

    }


    return await StaffTaskRepository.update(
        task,
        {
            status: "COMPLETED",
            completedAt: new Date(),
            completionRemarks:
                completionRemarks || null
        }
    );

};


// CANCEL TASK
const cancelTask = async (id, remarks) => {

    const task =
        await StaffTaskRepository.findById(id);

    if (!task) {

        throw new Error("Staff task not found");

    }


    if (task.status === "COMPLETED") {

        throw new Error(
            "Completed task cannot be cancelled"
        );

    }


    return await StaffTaskRepository.update(
        task,
        {
            status: "CANCELLED",
            remarks: remarks || task.remarks
        }
    );

};


// MARK OVERDUE
const markOverdue = async (id) => {

    const task =
        await StaffTaskRepository.findById(id);

    if (!task) {

        throw new Error("Staff task not found");

    }


    if (
        task.status === "COMPLETED" ||
        task.status === "CANCELLED"
    ) {

        throw new Error(
            "Completed or cancelled task cannot be marked overdue"
        );

    }


    return await StaffTaskRepository.update(
        task,
        {
            status: "OVERDUE"
        }
    );

};


// DELETE TASK
const deleteTask = async (id) => {

    const task =
        await StaffTaskRepository.findById(id);

    if (!task) {

        throw new Error("Staff task not found");

    }


    await StaffTaskRepository.remove(task);

    return {
        message: "Staff task deleted successfully"
    };

};


module.exports = {

    createTask,
    getTaskById,
    getAllTasks,
    getTasksByStaff,
    updateTask,
    startTask,
    completeTask,
    cancelTask,
    markOverdue,
    deleteTask

};