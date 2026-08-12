import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AppShell from "./components/layout/AppShell.jsx";
import AuthPage from "./components/layout/AuthPage.jsx";
import { getMe, logoutUser } from "./api/authentication.js";

function App() {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        await getMe();
        if (active) {
          setIsAuth(true);
        }
      } catch {
        if (active) {
          setIsAuth(false);
        }
      }
    }

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const logIn = () => {
    setIsAuth(true);
  };

  const logOut = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Failed to log out cleanly:", error);
    } finally {
      setIsAuth(false);
    }
  }

  if (isAuth === null) {
    return null;
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