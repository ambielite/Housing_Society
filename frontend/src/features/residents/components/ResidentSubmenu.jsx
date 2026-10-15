import { NavLink } from "react-router-dom";
import { BarChart3, Building2, ClipboardCheck, KeyRound, Users } from "lucide-react";

const residentSubmenu = [
    {
        label: "Overview",
        path: "/residents",
        icon: BarChart3
    },
    {
        label: "Residents",
        path: "/residents/list",
        icon: Users
    },
    {
        label: "Ownership",
        path: "/residents/ownership",
        icon: KeyRound
    },
    {
        label: "Verification",
        path: "/residents/verification",
        icon: ClipboardCheck
    },
    {
        label: "Non-members",
        path: "/residents/non-members",
        icon: Building2
    }
];

const ResidentSubmenu = () => {
    return (
        <div className="sidebar-subnav">
            {residentSubmenu.map(({ label, path, icon: Icon }) => (
                <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) => `sidebar-subnav-item${isActive ? " active" : ""}`}
                >
                    <Icon size={16} />
                    <span>{label}</span>
                </NavLink>
            ))}
        </div>
    );
};

export default ResidentSubmenu;
