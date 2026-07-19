import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import AppShell from "./components/layout/AppShell.jsx";
import AuthPage from "./components/layout/AuthPage.jsx";

function App() {
  const [isAuth, setisAuth] = useState(() => Boolean(localStorage.getItem("token")));

  const logIn = () => {
    setisAuth(Boolean(localStorage.getItem("token")));
  };

  const logOut = () => {
    localStorage.removeItem("token");
    setisAuth(false);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            isAuth
              ? <Navigate to="/app" replace />
              : <AuthPage onLogin={logIn} />
          }
        />
      
        <Route
          path="/app/*"
          element={
            isAuth
              ? <AppShell onLogout={logOut} />
              : <Navigate to="/auth" replace />
          }
        />
      
        <Route
          path="*"
          element={<Navigate to={isAuth ? "/app" : "/auth"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;