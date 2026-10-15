import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
//import "./index.css";
import "./styles/themes/light.css";
import "./styles/themes/dark.css";
import "./styles/global.css"; 
import { AuthProvider } from "./app/providers/AuthProvider";
import { SocietyProvider } from "./app/store/ui.store.jsx";
import { ThemeProvider } from "./app/providers/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <SocietyProvider>
                    <App />
                </SocietyProvider>
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);
