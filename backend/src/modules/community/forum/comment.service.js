
const CommunityPost = require("./post.model");
const CommunityComment = require("./comment.model");
const commentRepository = require("./comment.repository");

const createComment = async (data) => {

    if (!data.postId) {
        throw new Error("postId is required");
    }

    if (!data.userId) {
        throw new Error("userId is required");
    }

    if (!data.content || data.content.trim() === "") {
        throw new Error("Comment content is required");
    }

    const post = await CommunityPost.findByPk(
        data.postId
    );

    if (!post) {
        throw new Error("Post not found");
    }

    if (post.status !== "PUBLISHED") {
        throw new Error(
            "Comments are allowed only on published posts"
        );
    }

    if (post.isLocked) {
        throw new Error("This post is locked");
    }

    if (data.parentCommentId) {

        const parentComment =
            await commentRepository.findById(
                data.parentCommentId
            );

        if (!parentComment) {
            throw new Error(
                "Parent comment not found"
            );
        }

        if (parentComment.postId !== data.postId) {
            throw new Error(
                "Parent comment belongs to another post"
            );
        }

        if (parentComment.status === "DELETED") {
            throw new Error(
                "Cannot reply to a deleted comment"
            );
        }
    }

    return await commentRepository.create({
        ...data,
        content: data.content.trim()
    });
};


const getComments = async (postId, filters = {}) => {

    const post = await CommunityPost.findByPk(postId);

    if (!post) {
        throw new Error("Post not found");
    }

    const where = {
        postId
    };

    if (filters.userId) {
        where.userId = filters.userId;
    }

    if (filters.status) {
        where.status = filters.status;
    } else {
        where.status = "PUBLISHED";
    }

    if (filters.parentCommentId === "null") {
        where.parentCommentId = null;
    }

    if (filters.parentCommentId) {
        where.parentCommentId = filters.parentCommentId;
    }

    return await commentRepository.findAll(where);
};


const getCommentById = async (postId, commentId) => {

    const comment = await commentRepository.findById(
        commentId
    );

    if (
        !comment ||
        comment.postId !== postId
    ) {
        throw new Error("Comment not found");
    }

    return comment;
};


const updateComment = async (
    postId,
    commentId,
    data
) => {

    const comment = await getCommentById(
        postId,
        commentId
    );

    if (data.content !== undefined) {

        if (!data.content.trim()) {
            throw new Error(
                "Comment content cannot be empty"
            );
        }

        data.content = data.content.trim();
    }

    if (data.status) {

        const validStatuses = [
            "PUBLISHED",
            "HIDDEN",
            "DELETED"
        ];

        if (!validStatuses.includes(data.status)) {
            throw new Error(
                "Invalid comment status"
            );
        }
    }

    return await commentRepository.update(
        comment,
        data
    );
};


const deleteComment = async (
    postId,
    commentId
) => {

    const comment = await getCommentById(
        postId,
        commentId
    );

    await commentRepository.update(
        comment,
        {
            status: "DELETED"
        }
    );

    return {
        message: "Comment deleted successfully"
    };
};


module.exports = {
    createComment,
    getComments,
    getCommentById,
    updateComment,
    deleteComment
};

