import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const PoolContainer = styled.div`
  min-height: 100vh;
  background-color: #32a852;
  padding: 2rem;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: white;
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  background-color: white;
  color: #32a852;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const AddButton = styled(Button)`
  background-color: #32a852;
  color: white;
  
  &:hover {
    background-color: #2a8a45;
  }
`;

const ContentContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 0 auto;
`;

const PoolTitle = styled.h2`
  color: #32a852;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
`;

const InfoSection = styled.div`
  margin-bottom: 2rem;
`;

const InfoTitle = styled.h3`
  color: #32a852;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AddIconButton = styled.button`
  background: none;
  border: none;
  color: #32a852;
  font-size: 2rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  padding-left: 0.3em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s;
  line-height: 1;
  
  &:hover {
    background-color: rgba(50, 168, 82, 0.1);
  }
`;

const InfoItem = styled.p`
  margin: 0.5rem 0;
`;

const MembersList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const MemberItem = styled.li`
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const RemoveIconButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.2s;
  line-height: 1;
  
  &:hover {
    background-color: rgba(231, 76, 60, 0.1);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #999;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #e74c3c;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h2`
  color: #32a852;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #32a852;
    box-shadow: 0 0 0 2px rgba(50, 168, 82, 0.2);
  }
`;

const ErrorText = styled.p`
  color: #e74c3c;
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const CancelButton = styled(Button)`
  background-color: #f5f5f5;
  color: #666;
  
  &:hover {
    background-color: #e9e9e9;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #32a852;
  color: white;
  
  &:hover {
    background-color: #2a8a45;
  }
`;

interface PoolData {
  name: string;
  owner: string;
  members: string[];
}

const PoolPage: React.FC = (): React.ReactElement => {
  const { poolId } = useParams<{ poolId: string }>();
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get user data from localStorage
  const userEmail = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    const fetchPoolData = async () => {
      if (!poolId) {
        setError('Pool ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const poolDoc = await getDoc(doc(db, 'pools', poolId));
        
        if (poolDoc.exists()) {
          setPoolData(poolDoc.data() as PoolData);
        } else {
          setError('Pool not found');
        }
      } catch (err) {
        console.error('Error fetching pool data:', err);
        setError('Failed to load pool data');
      } finally {
        setLoading(false);
      }
    };

    fetchPoolData();
  }, [poolId]);

  const openAddMemberModal = () => {
    setNewMemberEmail('');
    setEmailError(null);
    setIsAddMemberModalOpen(true);
  };

  const closeAddMemberModal = () => {
    setIsAddMemberModalOpen(false);
    setNewMemberEmail('');
    setEmailError(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setNewMemberEmail(email);
    
    // Remove real-time validation
    // We'll only validate when the form is submitted
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email is empty
    if (!newMemberEmail.trim()) {
      setEmailError('Please enter an email address');
      return;
    }
    
    // Validate email only when form is submitted
    if (!validateEmail(newMemberEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (!poolId || !poolData) {
      setError('Pool data is missing');
      return;
    }
    
    // Check if the user is already a member
    if (poolData.members.includes(newMemberEmail)) {
      setEmailError('This user is already a member of the pool');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the pool document in Firestore
      const poolRef = doc(db, 'pools', poolId);
      await updateDoc(poolRef, {
        members: arrayUnion(newMemberEmail)
      });
      
      // Update local state
      setPoolData({
        ...poolData,
        members: [...poolData.members, newMemberEmail]
      });
      
      // Close modal and reset form
      closeAddMemberModal();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member to the pool');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!poolId || !poolData) {
      setError('Pool data is missing');
      return;
    }
    
    // Don't allow removing the owner
    if (memberEmail === poolData.owner) {
      setError('Cannot remove the pool owner');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the pool document in Firestore
      const poolRef = doc(db, 'pools', poolId);
      await updateDoc(poolRef, {
        members: arrayRemove(memberEmail)
      });
      
      // Update local state
      setPoolData({
        ...poolData,
        members: poolData.members.filter(member => member !== memberEmail)
      });
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member from the pool');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PoolContainer>
      <Header>
        <Title>Pool Details</Title>
        <ButtonGroup>
          <Button onClick={() => window.history.back()}>Back to Dashboard</Button>
        </ButtonGroup>
      </Header>
      
      <ContentContainer>
        {loading ? (
          <LoadingMessage>Loading pool data...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : poolData ? (
          <>
            <PoolTitle>Pool: {poolData.name}</PoolTitle>
            <InfoSection>
              <InfoTitle>Pool Information</InfoTitle>
              <InfoItem><strong>Owner:</strong> {poolData.owner}</InfoItem>
            </InfoSection>
            
            <InfoSection>
              <InfoTitle>
                Members ({poolData.members?.length || 0})
                {poolData.owner === userEmail && (
                  <AddIconButton onClick={openAddMemberModal} title="Add Member">
                    +
                  </AddIconButton>
                )}
              </InfoTitle>
              {poolData.members && poolData.members.length > 0 ? (
                <MembersList>
                  {poolData.members.map((member, index) => (
                    <MemberItem key={index}>
                      <span>{member}</span>
                      {poolData.owner === userEmail && member !== poolData.owner && (
                        <RemoveIconButton 
                          onClick={() => handleRemoveMember(member)} 
                          title="Remove Member"
                          disabled={isSubmitting}
                        >
                          -
                        </RemoveIconButton>
                      )}
                    </MemberItem>
                  ))}
                </MembersList>
              ) : (
                <InfoItem>No members in this pool</InfoItem>
              )}
            </InfoSection>
          </>
        ) : null}
      </ContentContainer>
      
      {isAddMemberModalOpen && (
        <ModalOverlay onClick={closeAddMemberModal}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalTitle>Add Member to Pool</ModalTitle>
            <form onSubmit={handleAddMember}>
              <FormGroup>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email"
                  value={newMemberEmail}
                  onChange={handleEmailChange}
                  placeholder="Enter member's email"
                />
                {emailError && <ErrorText>{emailError}</ErrorText>}
              </FormGroup>
              <ModalButtons>
                <CancelButton type="button" onClick={closeAddMemberModal}>Cancel</CancelButton>
                <SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </SubmitButton>
              </ModalButtons>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </PoolContainer>
  );
};

export default PoolPage; 