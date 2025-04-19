import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Section = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: #32a852;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #32a852;
    box-shadow: 0 0 0 2px rgba(50, 168, 82, 0.2);
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.1rem;
`;

const ListContent = styled.div`
  min-height: 400px;
  display: flex;
  flex-direction: column;
  color: #666;
  font-size: 0.9rem;
  padding: 0.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const TableRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
  font-weight: 600;
  color: #333;
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: #666;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 0.5rem;
  
  &:hover {
    color: #ff4444;
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #999;
`;

const AddButton = styled.button`
  background-color: #32a852;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2a8a45;
  }
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

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
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

interface PoolItem {
  id: string;
  pool: string;
  owner: string;
}

interface WorkshopPoolSectionProps {
  pools: PoolItem[];
  loading: boolean;
  username: string;
  userEmail: string;
  onAddPool: (poolName: string) => void;
  onDeletePool?: (poolId: string) => void;
}

const WorkshopPoolSection: React.FC<WorkshopPoolSectionProps> = ({
  pools,
  loading,
  username,
  userEmail,
  onAddPool,
  onDeletePool
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPool, setNewPool] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const openModal = () => {
    setNewPool('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewPool('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPool(newPool);
    closeModal();
  };

  const handleDeletePool = async (e: React.MouseEvent, poolId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking delete button
    
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'pools', poolId));
      
      // Call the parent component's handler if provided
      if (onDeletePool) {
        onDeletePool(poolId);
      }
    } catch (error) {
      console.error('Error deleting pool:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return pools.filter(item => 
      item.pool.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pools, searchTerm]);

  return (
    <Section>
      <Title>
        Pools
        <AddButton onClick={openModal}>Add Pool</AddButton>
      </Title>
      
      <SearchContainer>
        <SearchIcon>🔍</SearchIcon>
        <SearchInput 
          type="text" 
          placeholder="Search pools..." 
          value={searchTerm}
          onChange={handleSearch}
        />
      </SearchContainer>
      
      <ListContent>
        {loading ? (
          <EmptyMessage>Loading pools...</EmptyMessage>
        ) : filteredItems.length > 0 ? (
          <>
            <TableHeader>
              <div>Pool Name</div>
              <div></div>
            </TableHeader>
            {filteredItems.map(item => (
              <TableRow 
                key={item.id} 
                onClick={() => navigate(`/dashboard/pool/${item.id}`)}
              >
                <div>{item.pool}</div>
                {item.owner === userEmail && (
                  <DeleteButton 
                    onClick={(e) => handleDeletePool(e, item.id)}
                    disabled={isDeleting}
                  >
                    🗑️
                  </DeleteButton>
                )}
              </TableRow>
            ))}
          </>
        ) : (
          <EmptyMessage>No pools found</EmptyMessage>
        )}
      </ListContent>

      {isModalOpen && (
        <ModalOverlay onClick={closeModal}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalTitle>Add New Pool</ModalTitle>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="pool">Pool Name</Label>
                <Input 
                  id="pool"
                  type="text"
                  value={newPool}
                  onChange={e => setNewPool(e.target.value)}
                  required
                  placeholder="Enter pool name"
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="owner">Owner</Label>
                <Input 
                  id="owner"
                  type="text"
                  value={userEmail}
                  disabled
                  placeholder="Your email"
                />
              </FormGroup>
              <ModalButtons>
                <CancelButton type="button" onClick={closeModal}>Cancel</CancelButton>
                <SubmitButton type="submit">Add Pool</SubmitButton>
              </ModalButtons>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </Section>
  );
};

export default WorkshopPoolSection; 