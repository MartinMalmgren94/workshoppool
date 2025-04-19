import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';

const DashboardContainer = styled.div`
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

const ListContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 0 auto;
`;

const ListTitle = styled.h2`
  color: #32a852;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
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
  min-height: 200px;
  display: flex;
  flex-direction: column;
  color: #666;
  font-size: 0.9rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 0.75rem;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const SortButton = styled.button`
  background: none;
  border: none;
  color: #32a852;
  cursor: pointer;
  padding: 0;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #999;
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

const PoolLink = styled(Link)`
  color: #32a852;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

// Pool data type
interface PoolItem {
  id: string;
  pool: string;
  owner: string;
}

// Firestore pool type
interface FirestorePool {
  id: string;
  name: string;
  owner: string;
  members: string[];
}

const DashboardPage: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<keyof PoolItem>('pool');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPool, setNewPool] = useState('');
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get user data from localStorage
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userDataString = localStorage.getItem('userData');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const username = userData?.username || userEmail.split('@')[0];
  
  // Fetch pools from Firestore
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        
        // Create a query to get pools where the user is either the owner or a member
        const poolsQuery = query(
          collection(db, 'pools'),
          where('owner', '==', userEmail)
        );
        
        // Execute the query
        const querySnapshot = await getDocs(poolsQuery);
        
        // Convert Firestore documents to PoolItem format
        const fetchedPools: PoolItem[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as FirestorePool;
          return {
            id: doc.id,
            pool: data.name,
            owner: data.owner
          };
        });
        
        // Update state with fetched pools
        setPools(fetchedPools);
      } catch (error) {
        console.error('Error fetching pools:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPools();
  }, [userEmail]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Clear entire localStorage on logout
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSort = (field: keyof PoolItem) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const openModal = () => {
    // Reset form fields
    setNewPool('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form fields
    setNewPool('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new pool item
    const newItem: PoolItem = {
      id: Date.now().toString(), // Simple way to generate a unique ID
      pool: newPool,
      owner: userEmail // Use the email from localStorage instead of username
    };
    
    // Add to items list
    setPools([...pools, newItem]);
    
    // Close modal and reset form
    closeModal();
  };

  const filteredAndSortedItems = useMemo(() => {
    // First filter the items based on search term
    const filtered = pools.filter(item => 
      item.pool.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Then sort the filtered items
    return [...filtered].sort((a, b) => {
      const aValue = a[sortField].toString().toLowerCase();
      const bValue = b[sortField].toString().toLowerCase();
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [pools, searchTerm, sortField, sortDirection]);

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <ButtonGroup>
          <AddButton onClick={openModal}>Add Pool</AddButton>
          <Button onClick={handleLogout}>Logout</Button>
        </ButtonGroup>
      </Header>
      <ListContainer>
        <ListTitle>Workshop Pool</ListTitle>
        
        {userData && (
          <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#666' }}>
            Welcome, {username}!
          </div>
        )}
        
        <SearchContainer>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput 
            type="text" 
            placeholder="Search pools, owners..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </SearchContainer>
        
        <ListContent>
          {loading ? (
            <EmptyMessage>Loading pools...</EmptyMessage>
          ) : filteredAndSortedItems.length > 0 ? (
            <>
              <TableHeader>
                <SortButton onClick={() => handleSort('pool')}>
                  Pool {sortField === 'pool' && (sortDirection === 'asc' ? '↑' : '↓')}
                </SortButton>
                <SortButton onClick={() => handleSort('owner')}>
                  Owner {sortField === 'owner' && (sortDirection === 'asc' ? '↑' : '↓')}
                </SortButton>
              </TableHeader>
              
              {filteredAndSortedItems.map(item => (
                <TableRow 
                  key={item.id} 
                  onClick={() => navigate(`/dashboard/pool/${item.id}`)}
                >
                  <div>{item.pool}</div>
                  <div>{item.owner}</div>
                </TableRow>
              ))}
            </>
          ) : (
            <EmptyMessage>No pools found</EmptyMessage>
          )}
        </ListContent>
      </ListContainer>
      
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
    </DashboardContainer>
  );
};

export default DashboardPage; 