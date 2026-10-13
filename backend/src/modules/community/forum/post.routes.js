
const express = require("express");

const router = express.Router();

const postController = require("./post.controller");


// Create post
router.post(
    "/",
    postController.createPost
);


// Get posts
router.get(
    "/",
    postController.getPosts
);


// Get post
router.get(
    "/:id",
    postController.getPostById
);


// Update post
router.put(
    "/:id",
    postController.updatePost
);


// Pin post
router.post(
    "/:id/pin",
    postController.pinPost
);


// Unpin post
router.post(
    "/:id/unpin",
    postController.unpinPost
);


// Lock post
router.post(
    "/:id/lock",
    postController.lockPost
);


// Unlock post
router.post(
    "/:id/unlock",
    postController.unlockPost
);


// Increment view count
router.post(
    "/:id/view",
    postController.viewPost
);


// Soft delete post
router.delete(
    "/:id",
    postController.deletePost
);


module.exports = router;

