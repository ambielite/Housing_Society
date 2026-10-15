import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AdminLayout = () => {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="admin-layout">

            <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="main-wrapper">

                <Topbar
                    onMenuClick={() =>
                        setSidebarOpen(!sidebarOpen)
                    }
                />

                <main className="main-content">
                    <Outlet />
                </main>

            </div>

        </div>
    );
};

export default AdminLayout;
