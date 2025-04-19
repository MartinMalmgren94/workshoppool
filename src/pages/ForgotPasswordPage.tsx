import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #32a852;
`;

const Card = styled.div`
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

const Title = styled.h1`
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

const BackButton = styled(Button)`
  background-color: transparent;
  color: #32a852;
  border: 1px solid #32a852;
  margin-top: 1rem;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  color: #32a852;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const ValidationMessage = styled.div`
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
`;

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <LogoContainer>
          <Logo src="/icon.svg" alt="WorkshopPool Logo" />
          <Title>Reset Password</Title>
        </LogoContainer>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading || resetSent}
            className={emailError ? 'invalid' : ''}
          />
          {emailError && <ValidationMessage>{emailError}</ValidationMessage>}
          <Button type="submit" disabled={loading || resetSent}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <BackButton type="button" onClick={() => navigate('/login')}>
            Back to Login
          </BackButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {resetSent && (
            <SuccessMessage>
              Password reset email sent! Please check your inbox.
            </SuccessMessage>
          )}
        </Form>
      </Card>
    </Container>
  );
};

export default ForgotPassword; 