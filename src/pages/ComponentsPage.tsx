import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import ComponentsSection from '../components/ComponentsSection';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
`;

const Title = styled.h1`
  color: #32a852;
  margin: 0;
  text-align: center;
  flex-grow: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  position: absolute;
  left: -3rem;
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

const BackIcon = styled.span`
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ComponentItem {
  id: string;
  name: string;
  description: string;
  owner: string;
}

const ComponentsPage: React.FC = () => {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get user info from localStorage
    const storedUsername = localStorage.getItem('username') || '';
    const storedEmail = localStorage.getItem('userEmail') || '';
    
    setUsername(storedUsername);
    setUserEmail(storedEmail);
    
    // Fetch components
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const componentsCollection = collection(db, 'components');
      const componentsSnapshot = await getDocs(componentsCollection);
      const componentsList = componentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          owner: data.owner || ''
        };
      }) as ComponentItem[];
      
      setComponents(componentsList);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = async (componentName: string, description: string = '') => {
    try {
      const componentsCollection = collection(db, 'components');
      await addDoc(componentsCollection, {
        name: componentName,
        description: description,
        owner: userEmail,
        createdAt: new Date()
      });
      
      // Refresh the components list
      fetchComponents();
    } catch (error) {
      console.error('Error adding component:', error);
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    try {
      await deleteDoc(doc(db, 'components', componentId));
      
      // Refresh the components list
      fetchComponents();
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  };

  return (
    <PageContainer>
      <Header>
        <ButtonGroup>
          <NavLink as="a" href="/dashboard">
            <BackIcon>←</BackIcon>
          </NavLink>
        </ButtonGroup>
        <Title>Components</Title>
      </Header>
      <ComponentsSection
        components={components}
        loading={loading}
        username={username}
        userEmail={userEmail}
        onAddComponent={handleAddComponent}
        onDeleteComponent={handleDeleteComponent}
      />
    </PageContainer>
  );
};

export default ComponentsPage; 