import {
    Bell,
    ChevronDown,
    Menu,
    Moon,
    Sun
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../../app/providers/useAuth";
import { useSociety } from "../../app/store/useSociety";
import { useTheme } from "../../app/providers/useTheme";
import societyApi from "../../features/societies/api/society.api";

const normalizeSocietyId = (value) => String(value ?? "").replace(/^:+/, "").trim();

const Topbar = ({ onMenuClick }) => {

    const { user } = useAuth();
    const { selectedSociety, selectSociety } = useSociety();
    const { theme, toggleTheme } = useTheme();
    const [societies, setSocieties] = useState([]);

    useEffect(() => {
        const loadSocieties = async () => {
            try {
                const response = await societyApi.getAll();
                const list = Array.isArray(response) ? response : response?.data || response?.societies || [];
                setSocieties(Array.isArray(list) ? list : []);
            } catch {
                setSocieties([]);
            }
        };

        loadSocieties();
    }, []);

    useEffect(() => {
        if (!selectedSociety && societies.length > 0) {
            selectSociety(societies[0]);
        }
    }, [selectedSociety, societies, selectSociety]);

    const handleSocietyChange = (event) => {
        const selected = societies.find((society) => normalizeSocietyId(society.id) === normalizeSocietyId(event.target.value));
        selectSociety(selected || null);
    };

    return (
        <header className="topbar">

            {/* Left Side */}
            <div className="topbar-left">

                <button
                    className="mobile-menu-button"
                    onClick={onMenuClick}
                    type="button"
                    aria-label="Open menu"
                >
                    <Menu size={22} />
                </button>

                <div className="current-society">

                    <span className="topbar-label">
                        Current Society
                    </span>

                    <select
                        className="society-topbar-select"
                        value={selectedSociety?.id ?? ""}
                        onChange={handleSocietyChange}
                        aria-label="Select society"
                    >
                        <option value="">Select Society</option>
                        {societies.map((society) => (
                            <option key={society.id} value={society.id}>{society.name}</option>
                        ))}
                    </select>

                </div>

            </div>


            {/* Right Side */}
            <div className="topbar-right">

                {/* Theme Toggle */}
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={toggleTheme}
                    title={
                        theme === "light"
                            ? "Switch to Dark Mode"
                            : "Switch to Light Mode"
                    }
                    aria-label={
                        theme === "light"
                            ? "Switch to Dark Mode"
                            : "Switch to Light Mode"
                    }
                >
                    {theme === "light" ? (
                        <Moon size={19} />
                    ) : (
                        <Sun size={19} />
                    )}
                </button>


                {/* Notifications */}
                <button
                    type="button"
                    className="notification-button"
                    title="Notifications"
                >
                    <Bell size={20} />

                    <span className="notification-dot"></span>
                </button>


                {/* User Menu */}
                <div className="user-menu">

                    <div className="avatar">
                        {user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "A"}
                    </div>

                    <div className="user-info">

                        <strong>
                            {user?.name ||
                                "Administrator"}
                        </strong>

                        <span>
                            {user?.role ||
                                "Admin"}
                        </span>

                    </div>

                    <ChevronDown size={17} />

                </div>

            </div>

        </header>
    );
};

export default Topbar;

