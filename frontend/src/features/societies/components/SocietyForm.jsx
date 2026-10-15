
import { useState } from "react";
import { X } from "lucide-react";

import societyApi from "../api/society.api";

const createInitialForm = (society) => ({
    name: society?.name || "",
    reraNumber: society?.reraNumber || "",
    pan: society?.pan || "",
    gstin: society?.gstin || "",
    address: society?.address || "",
    structuralArea: society?.structuralArea || "",
    currency: society?.currency || "INR",
    timezone: society?.timezone || "Asia/Kolkata",
    taxConfiguration: society?.taxConfiguration || {}
});

const SocietyForm = ({ society, onClose, onSuccess }) => {
    const [formData, setFormData] = useState(() => createInitialForm(society));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (!formData.name.trim()) {
            setError("Society name is required.");
            return;
        }

        if (!formData.address.trim()) {
            setError("Address is required.");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ...formData,
                structuralArea:
                    formData.structuralArea === ""
                        ? null
                        : Number(formData.structuralArea)
            };

            if (society?.id) {
                await societyApi.update(society.id, payload);
            } else {
                await societyApi.create(payload);
            }

            await onSuccess();
        } catch (err) {
            console.error("Society save error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to save society. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="society-form-modal" role="dialog" aria-modal="true" aria-labelledby="society-form-title">

                {/* Header */}
                <div className="society-form-header">
                    <div>
                        <h2 id="society-form-title">
                            {society ? "Edit Society" : "Add Society"}
                        </h2>

                        <p>
                            {society
                                ? "Update society information and configuration."
                                : "Enter the basic details of the society."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close form"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>

                    <div className="society-form-body">

                        {error && (
                            <div className="form-error">
                                {error}
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="form-section">
                            <div className="form-section-title">
                                <h3>Basic Information</h3>
                                <span>Required society details</span>
                            </div>

                            <div className="form-grid">

                                <div className="form-group">
                                    <label>
                                        Society Name
                                        <span className="required">*</span>
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter society name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>RERA Number</label>

                                    <input
                                        type="text"
                                        name="reraNumber"
                                        value={formData.reraNumber}
                                        onChange={handleChange}
                                        placeholder="Enter RERA number"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>PAN</label>

                                    <input
                                        type="text"
                                        name="pan"
                                        value={formData.pan}
                                        onChange={handleChange}
                                        placeholder="Enter PAN number"
                                        maxLength={10}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>GSTIN</label>

                                    <input
                                        type="text"
                                        name="gstin"
                                        value={formData.gstin}
                                        onChange={handleChange}
                                        placeholder="Enter GSTIN"
                                        maxLength={15}
                                    />
                                </div>

                                <div className="form-group form-group-full">
                                    <label>
                                        Address
                                        <span className="required">*</span>
                                    </label>

                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter complete society address"
                                        rows="4"
                                        required
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Property Information */}
                        <div className="form-section">

                            <div className="form-section-title">
                                <h3>Property Information</h3>
                                <span>Society area details</span>
                            </div>

                            <div className="form-grid">

                                <div className="form-group">
                                    <label>Structural Area</label>

                                    <div className="input-with-suffix">
                                        <input
                                            type="number"
                                            name="structuralArea"
                                            value={formData.structuralArea}
                                            onChange={handleChange}
                                            placeholder="Enter area"
                                            min="0"
                                            step="0.01"
                                        />

                                        <span>sq. ft.</span>
                                    </div>
                                </div>

                            </div>

                        </div>

                        {/* Regional Configuration */}
                        <div className="form-section">

                            <div className="form-section-title">
                                <h3>Regional Configuration</h3>
                                <span>Currency and timezone settings</span>
                            </div>

                            <div className="form-grid">

                                <div className="form-group">
                                    <label>Currency</label>

                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                    >
                                        <option value="INR">
                                            INR - Indian Rupee
                                        </option>

                                        <option value="USD">
                                            USD - US Dollar
                                        </option>

                                        <option value="EUR">
                                            EUR - Euro
                                        </option>

                                        <option value="GBP">
                                            GBP - British Pound
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Timezone</label>

                                    <select
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleChange}
                                    >
                                        <option value="Asia/Kolkata">
                                            Asia/Kolkata
                                        </option>

                                        <option value="Asia/Dubai">
                                            Asia/Dubai
                                        </option>

                                        <option value="Asia/Singapore">
                                            Asia/Singapore
                                        </option>

                                        <option value="Europe/London">
                                            Europe/London
                                        </option>

                                        <option value="America/New_York">
                                            America/New_York
                                        </option>
                                    </select>
                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Footer */}
                    <div className="society-form-footer">

                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading
                                ? "Saving..."
                                : society
                                    ? "Update Society"
                                    : "Create Society"}
                        </button>

                    </div>

                </form>
        </div>
    );
};

export default SocietyForm;
