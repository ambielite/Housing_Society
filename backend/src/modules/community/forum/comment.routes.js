
const express = require("express");

const router = express.Router();

const commentController = require("./comment.controller");


// Create comment
router.post(
    "/posts/:postId/comments",
    commentController.createComment
);


// Get comments
router.get(
    "/posts/:postId/comments",
    commentController.getComments
);


// Get specific comment
router.get(
    "/posts/:postId/comments/:commentId",
    commentController.getCommentById
);


// Update comment
router.put(
    "/posts/:postId/comments/:commentId",
    commentController.updateComment
);


// Delete comment
router.delete(
    "/posts/:postId/comments/:commentId",
    commentController.deleteComment
);


module.exports = router;

