import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import WorkshopPoolSection from '../components/WorkshopPoolSection';

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

const NavLink = styled(Button)`
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 0 0 2rem 0;
  width: 100%;
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

  const handleAddPool = (poolName: string) => {
    // Create new pool item
    const newItem: PoolItem = {
      id: Date.now().toString(), // Simple way to generate a unique ID
      pool: poolName,
      owner: userEmail
    };
    
    // Add to items list
    setPools([...pools, newItem]);
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <ButtonGroup>
          <NavLink as="a" href="/components">Components</NavLink>
          <Button onClick={handleLogout}>Logout</Button>
        </ButtonGroup>
      </Header>
      
      <Divider />

      <WorkshopPoolSection
        pools={pools}
        loading={loading}
        username={username}
        userEmail={userEmail}
        onAddPool={handleAddPool}
      />
    </DashboardContainer>
  );
};

export default DashboardPage; 