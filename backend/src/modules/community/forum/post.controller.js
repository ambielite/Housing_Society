
const postService = require("./post.service");

const createPost = async (req, res) => {

    try {

        const post = await postService.createPost(
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: post
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getPosts = async (req, res) => {

    try {

        const posts = await postService.getPosts(
            req.query
        );

        res.status(200).json({
            success: true,
            count: posts.length,
            data: posts
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getPostById = async (req, res) => {

    try {

        const post = await postService.getPostById(
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: post
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updatePost = async (req, res) => {

    try {

        const post = await postService.updatePost(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Post updated successfully",
            data: post
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const pinPost = async (req, res) => {

    try {

        const post = await postService.pinPost(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Post pinned successfully",
            data: post
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const unpinPost = async (req, res) => {

    try {

        const post = await postService.unpinPost(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Post unpinned successfully",
            data: post
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const lockPost = async (req, res) => {

    try {

        const post = await postService.lockPost(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Post locked successfully",
            data: post
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const unlockPost = async (req, res) => {

    try {

        const post = await postService.unlockPost(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Post unlocked successfully",
            data: post
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const viewPost = async (req, res) => {

    try {

        const post = await postService.incrementViewCount(
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: post
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const deletePost = async (req, res) => {

    try {

        const result = await postService.deletePost(
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
    createPost,
    getPosts,
    getPostById,
    updatePost,
    pinPost,
    unpinPost,
    lockPost,
    unlockPost,
    viewPost,
    deletePost
};

