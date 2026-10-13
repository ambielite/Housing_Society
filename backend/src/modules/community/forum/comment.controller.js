
const commentService = require("./comment.service");

const createComment = async (req, res) => {

    try {

        const comment = await commentService.createComment(
            {
                ...req.body,
                postId: req.params.postId
            }
        );

        res.status(201).json({
            success: true,
            message: "Comment created successfully",
            data: comment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getComments = async (req, res) => {

    try {

        const comments = await commentService.getComments(
            req.params.postId,
            req.query
        );

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getCommentById = async (req, res) => {

    try {

        const comment = await commentService.getCommentById(
            req.params.postId,
            req.params.commentId
        );

        res.status(200).json({
            success: true,
            data: comment
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateComment = async (req, res) => {

    try {

        const comment = await commentService.updateComment(
            req.params.postId,
            req.params.commentId,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            data: comment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteComment = async (req, res) => {

    try {

        const result = await commentService.deleteComment(
            req.params.postId,
            req.params.commentId
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
    createComment,
    getComments,
    getCommentById,
    updateComment,
    deleteComment
};

