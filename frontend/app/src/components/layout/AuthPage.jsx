import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../api/authentication.js";

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
`;

export const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #202324;
  border: 1px solid #161819;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
`;

export const Logo = styled.div`
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
`;

export const Title = styled.h1`
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-muted);
  margin-bottom: 6px;
`;

export const Subtitle = styled.p`
  text-align: center;
  font-size: 13px;
  color: var(--color-text);
  margin-bottom: 22px;
  line-height: 1.4;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Input = styled.input`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--color-bg);
  color: var(--color-text-muted);
  outline: none;
  transition: 0.2s ease;

  &::placeholder {
    color: var(--color-text);
  }

  &:focus {
    border-color: var(--color-accent);
  }
`;

export const PrimaryButton = styled.button`
  margin-top: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  border: none;
  background: var(--color-accent);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const TextButton = styled.button`
  margin-top: 14px;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: var(--color-text-muted);
  }
`;

export const Footer = styled.div`
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text);
`;

export const ErrorText = styled.p`
  margin-top: -2px;
  min-height: 18px;
  font-size: 13px;
  color: #ff8a8a;
`;

export const Accent = styled.span`
  margin-left: 6px;
  color: var(--color-accent);
  cursor: pointer;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

function LoginView({ setView, onLogin, values, onChange, error, loading }) {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
	e.preventDefault();
	await onLogin(values.email, values.password);
	navigate("/app");
  };

  return (
    <>
      <Subtitle>Sign in to continue.</Subtitle>

      <Form onSubmit={handleLogin}>
        <Input
          type="text"
          placeholder="Email or username"
          required
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          required
          value={values.password}
          onChange={(e) => onChange("password", e.target.value)}
        />

        <ErrorText>{error}</ErrorText>

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </PrimaryButton>
      </Form>

      <TextButton type="button" onClick={() => setView("forgot")}>
        Forgot Password?
      </TextButton>

      <Footer>
        Don't have an account?
        <Accent onClick={() => setView("signup")}>Sign Up</Accent>
      </Footer>
    </>
  );
}

function SignupView({ setView, onSignup, values, onChange, error, loading }) {
  const navigate = useNavigate();

  const handleSignup = async (e) => {
	e.preventDefault();
	await onSignup(values.username, values.email, values.password, values.confirmPassword);
	navigate("/app");
  };

  return (
    <>
      <Subtitle>Create an account to get started.</Subtitle>

      <Form onSubmit={handleSignup}>
        <Input
          placeholder="Username"
          required
          value={values.username}
          onChange={(e) => onChange("username", e.target.value)}
        />
        <Input
          type="text"
          placeholder="Email or username"
          required
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          required
          value={values.password}
          onChange={(e) => onChange("password", e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          required
          value={values.confirmPassword}
          onChange={(e) => onChange("confirmPassword", e.target.value)}
        />

        <ErrorText>{error}</ErrorText>

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </PrimaryButton>
      </Form>

      <Footer>
        Already have an account?
        <Accent onClick={() => setView("login")}>Login</Accent>
      </Footer>
    </>
  );
}

function ForgotView({ setView }) {
  return (
    <>
      <Subtitle>
        Enter your email and we'll send you a reset link.
      </Subtitle>

      <Form>
        <Input type="email" placeholder="Email" required />
        <PrimaryButton type="submit">Send Reset Link</PrimaryButton>
      </Form>

      <Footer>
        Remember your password?
        <Accent onClick={() => setView("login")}>Login</Accent>
      </Footer>
    </>
  );
}

function AuthPage( { onLogin } ) {
  const [view, setView] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError("");

    try {
      await loginUser(email, password);
      onLogin();
    } catch (err) {
		if (err?.response?.status >= 500) {
			setError("Something went wrong. Please try again later.");
		} else {
			setError(err.message);
		}
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (username, email, password, confirmPassword) => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerUser(username, email, password);
      onLogin();
    } catch (err) {
      if (err?.response?.status >= 500) {
        setError("Something went wrong. Please try again later.");
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch (view) {
      case "signup":
        return (
          <SignupView
            setView={setView}
            onSignup={handleSignup}
            values={form}
            onChange={updateField}
            error={error}
            loading={loading}
          />
        );
      // case "forgot":
      //   return <ForgotView setView={setView} />;
      default:
        return (
          <LoginView
            setView={setView}
            onLogin={handleLogin}
            values={form}
            onChange={updateField}
            error={error}
            loading={loading}
          />
        );
    }
  };

  return (
    <Container>
      <Card>
        <Logo>CHATAPP</Logo>
        <Title>
          {view === "login"
            ? "Welcome Back"
            : view === "signup"
            /*? "Create Account"
            : "Reset Password"*/}
        </Title>

        {renderView()}
      </Card>
    </Container>
  );
}

export default AuthPage;