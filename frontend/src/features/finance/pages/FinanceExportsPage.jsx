import { useEffect, useState } from "react";
import { Download, FileDown } from "lucide-react";
import accountingExportApi from "../api/accountingExport.api";

const createDownload = (response, defaultName) => {
    const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "application/octet-stream"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const contentDisposition = response.headers?.["content-disposition"] || "";
    const match = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    const fileName = match ? match[1] : defaultName;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const FinanceExportsPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadBusy, setDownloadBusy] = useState(false);

    const handleExport = async (type) => {
        try {
            setDownloadBusy(true);
            setError("");

            const rawSocietyId = localStorage.getItem("selectedSocietyId");
            const societyId = String(rawSocietyId ?? "").replace(/^:+/, "").trim();

            if (!societyId) {
                throw new Error("Please select a society before downloading an export.");
            }

            const params = { societyId };

            let response;
            if (type === "journal") {
                response = await accountingExportApi.exportJournal(params);
            } else if (type === "trial-balance") {
                response = await accountingExportApi.exportTrialBalance(params);
            } else {
                response = await accountingExportApi.exportGeneralLedger(params);
            }

            createDownload(response, `${type}.csv`);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to generate export.");
        } finally {
            setDownloadBusy(false);
        }
    };

    return (
        <section className="society-dashboard">
            <header className="society-heading">
                <div>
                    <div className="society-eyebrow"><span className="society-eyebrow-dot" /> FINANCE</div>
                    <h1>Exports</h1>
                    <p>Download accounting exports for journals, trial balance, and ledger.</p>
                </div>
            </header>

            {error && <div className="society-error" role="alert">{error}</div>}

            <section className="society-list-panel">
                <div className="society-list-heading">
                    <div><h2>Export templates</h2><p>Generate export files using the active society data.</p></div>
                </div>

                <div className="society-table-wrap">
                    <table className="society-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Journal</td>
                                <td>Posted entries with account details.</td>
                                <td><button className="society-workflow-action" onClick={() => handleExport("journal")} disabled={downloadBusy}><Download size={16} /> {downloadBusy ? "Preparing..." : "Download"}</button></td>
                            </tr>
                            <tr>
                                <td>Trial balance</td>
                                <td>Account balances by category.</td>
                                <td><button className="society-workflow-action" onClick={() => handleExport("trial-balance")} disabled={downloadBusy}><Download size={16} /> {downloadBusy ? "Preparing..." : "Download"}</button></td>
                            </tr>
                            <tr>
                                <td>General ledger</td>
                                <td>Detailed account movements and balance.</td>
                                <td><button className="society-workflow-action" onClick={() => handleExport("general-ledger")} disabled={downloadBusy}><Download size={16} /> {downloadBusy ? "Preparing..." : "Download"}</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    );
};

export default FinanceExportsPage;
