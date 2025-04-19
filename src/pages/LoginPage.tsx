import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #32a852;
`;

const LoginCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`;

const Logo = styled.img`
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
`;

const AppName = styled.h1`
  color: #32a852;
  text-align: center;
  font-weight: 600;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #32a852;
  }
  
  &.invalid {
    border-color: #ff4444;
  }
`;

const ValidationMessage = styled.div`
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  background-color: #32a852;
  color: white;
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2a8a45;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const GoogleButton = styled(Button)`
  background-color: white;
  color: #757575;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 0.5rem;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 0.5rem 0;
  color: #757575;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #ddd;
  }

  &::before {
    margin-right: 0.5rem;
  }

  &::after {
    margin-left: 0.5rem;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const ForgotPasswordLink = styled(Link)`
  color: #32a852;
  text-decoration: none;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SuccessMessage = styled.div`
  color: #32a852;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const extractAndStoreUsername = (email: string) => {
    const username = email.split('@')[0];
    
    localStorage.setItem('username', username);
    
    localStorage.setItem('userEmail', email);
    
    console.log('Username stored:', username);
  };

  const fetchAndStoreUserData = async (email: string) => {
    try {
      const userDocRef = doc(db, 'users', email);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('User data stored:', userData);
      } else {
        const defaultUserData = {
          email: email,
          username: email.split('@')[0],
          createdAt: new Date().toISOString(),
          pools: []
        };
        localStorage.setItem('userData', JSON.stringify(defaultUserData));
        console.log('Default user data stored:', defaultUserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      extractAndStoreUsername(email);
      await fetchAndStoreUserData(email);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : 'An error occurred during login'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user && result.user.email) {
        extractAndStoreUsername(result.user.email);
        await fetchAndStoreUserData(result.user.email);
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError('An error occurred during Google sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <Logo src="/icon.svg" alt="WorkshopPool Logo" />
          <AppName>Workshop Pool</AppName>
        </LogoContainer>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
            className={emailError ? 'invalid' : ''}
          />
          {emailError && <ValidationMessage>{emailError}</ValidationMessage>}
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !!emailError}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <ForgotPasswordLink to="/forgot-password">
            Forgot Password?
          </ForgotPasswordLink>
          <Divider>or</Divider>
          <GoogleButton type="button" onClick={handleGoogleSignIn} disabled={loading}>
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              style={{ width: '18px', height: '18px' }} 
            />
            Continue with Google
          </GoogleButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {resetSent && (
            <SuccessMessage>
              Password reset email sent! Please check your inbox.
            </SuccessMessage>
          )}
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login; 