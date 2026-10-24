import { legacyApi } from "../../../lib/axios";

const documentBaseUrl = (import.meta.env.VITE_LEGACY_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api(?:\/v1)?\/?$/, "");

export async function openMoveInDocument(path) {
    if (!path) return;

    // Old uploads remain available at their existing server path. New uploads
    // are served by authenticated endpoints and returned as a Blob.
    if (!path.startsWith("/move-ins/") && !path.startsWith("/agreements/")) {
        window.open(/^https?:\/\//i.test(path) ? path : `${documentBaseUrl}${path}`, "_blank", "noopener,noreferrer");
        return;
    }

    const preview = window.open("about:blank", "_blank");
    if (!preview) throw new Error("Allow pop-ups to view this document.");
    try {
        preview.opener = null;
        const response = await legacyApi.get(path, { responseType: "blob" });
        const objectUrl = URL.createObjectURL(response.data);
        preview.location.href = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
    } catch (error) {
        preview.close();
        throw error;
    }
}
