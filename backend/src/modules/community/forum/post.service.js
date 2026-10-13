
const { Op } = require("sequelize");

const CommunityForum = require("./forum.model");
const postRepository = require("./post.repository");

const createPost = async (data) => {

    if (!data.forumId) {
        throw new Error("forumId is required");
    }

    if (!data.userId) {
        throw new Error("userId is required");
    }

    if (!data.title || data.title.trim() === "") {
        throw new Error("Post title is required");
    }

    if (!data.content || data.content.trim() === "") {
        throw new Error("Post content is required");
    }

    const forum = await CommunityForum.findByPk(
        data.forumId
    );

    if (!forum) {
        throw new Error("Forum not found");
    }

    if (forum.status !== "ACTIVE") {
        throw new Error("Cannot create post in an inactive forum");
    }

    return await postRepository.create({
        ...data,
        title: data.title.trim(),
        content: data.content.trim()
    });
};


const getPosts = async (filters = {}) => {

    const where = {};

    if (filters.forumId) {
        where.forumId = filters.forumId;
    }

    if (filters.userId) {
        where.userId = filters.userId;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.search) {
        where.title = {
            [Op.iLike]: `%${filters.search}%`
        };
    }

    return await postRepository.findAll(where);
};


const getPostById = async (id) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    return post;
};


const updatePost = async (id, data) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    if (data.title !== undefined) {

        if (!data.title.trim()) {
            throw new Error("Post title cannot be empty");
        }

        data.title = data.title.trim();
    }

    if (data.content !== undefined) {

        if (!data.content.trim()) {
            throw new Error("Post content cannot be empty");
        }

        data.content = data.content.trim();
    }

    if (data.status) {

        const validStatuses = [
            "PENDING",
            "PUBLISHED",
            "HIDDEN",
            "DELETED"
        ];

        if (!validStatuses.includes(data.status)) {
            throw new Error("Invalid post status");
        }
    }

    return await postRepository.update(
        post,
        data
    );
};


const pinPost = async (id) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    return await postRepository.update(
        post,
        { isPinned: true }
    );
};


const unpinPost = async (id) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    return await postRepository.update(
        post,
        { isPinned: false }
    );
};


const lockPost = async (id) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    return await postRepository.update(
        post,
        { isLocked: true }
    );
};


const unlockPost = async (id) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    return await postRepository.update(
        post,
        { isLocked: false }
    );
};


const incrementViewCount = async (id) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    await postRepository.update(
        post,
        {
            viewCount: post.viewCount + 1
        }
    );

    return post;
};


const deletePost = async (id) => {

    const post = await postRepository.findById(id);

    if (!post) {
        throw new Error("Post not found");
    }

    await postRepository.update(
        post,
        {
            status: "DELETED"
        }
    );

    return {
        message: "Post deleted successfully"
    };
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
    incrementViewCount,
    deletePost
};

