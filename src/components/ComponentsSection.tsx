import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Section = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 2rem auto 3rem;
`;

const Title = styled.h2`
  color: #32a852;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
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

const ListContent = styled.div`
  min-height: 400px;
  display: flex;
  flex-direction: column;
  color: #666;
  font-size: 0.9rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
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

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  padding: 1rem;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
  font-weight: 600;
  color: #333;
  align-items: center;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
  align-items: center;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

interface Component {
  id: string;
  name: string;
  description: string;
  owner: string;
}

interface ComponentsSectionProps {
  components: Component[];
  loading: boolean;
  username: string;
  userEmail: string;
  onAddComponent: (componentName: string, description: string) => void;
  onDeleteComponent: (componentId: string) => void;
}

const ComponentsSection: React.FC<ComponentsSectionProps> = ({
  components,
  loading,
  username,
  userEmail,
  onAddComponent,
  onDeleteComponent
}) => {
  const [isAddComponentModalOpen, setIsAddComponentModalOpen] = useState(false);
  const [newComponent, setNewComponent] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const openAddComponentModal = () => {
    setNewComponent('');
    setComponentDescription('');
    setIsAddComponentModalOpen(true);
  };

  const closeAddComponentModal = () => {
    setIsAddComponentModalOpen(false);
    setNewComponent('');
    setComponentDescription('');
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComponent.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      onAddComponent(newComponent.trim(), componentDescription.trim());
      
      closeAddComponentModal();
      
    } catch (error) {
      console.error('Error adding component:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredComponents = useMemo(() => {
    return components.filter(component => 
      component.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [components, searchTerm]);

  return (
    <Section>
      <Title>
        Components
        <AddButton onClick={openAddComponentModal}>Add Component</AddButton>
      </Title>
      
      <SearchContainer>
        <SearchIcon>🔍</SearchIcon>
        <SearchInput 
          type="text" 
          placeholder="Search components..." 
          value={searchTerm}
          onChange={handleSearch}
        />
      </SearchContainer>
      
      <ListContent>
        {loading ? (
          <EmptyMessage>Loading components...</EmptyMessage>
        ) : filteredComponents.length > 0 ? (
          <>
            <TableHeader>
              <div>Component Name</div>
              <div></div>
              <div></div>
            </TableHeader>
            {filteredComponents.map(component => (
              <TableRow key={component.id}>
                <div>{component.name}</div>
                <div>{component.description}</div>
                <DeleteButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                >
                  🗑️
                </DeleteButton>
              </TableRow>
            ))}
          </>
        ) : (
          <EmptyMessage>No components found</EmptyMessage>
        )}
      </ListContent>

      {isAddComponentModalOpen && (
        <ModalOverlay onClick={closeAddComponentModal}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalTitle>Add New Component</ModalTitle>
            <form onSubmit={handleAddComponent}>
              <FormGroup>
                <Label htmlFor="componentName">Component Name</Label>
                <Input
                  id="componentName"
                  type="text"
                  value={newComponent}
                  onChange={(e) => setNewComponent(e.target.value)}
                  placeholder="Enter component name"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="componentDescription">Description (optional)</Label>
                <TextArea
                  id="componentDescription"
                  value={componentDescription}
                  onChange={(e) => setComponentDescription(e.target.value)}
                  placeholder="Enter component description"
                />
              </FormGroup>
              <ModalButtons>
                <CancelButton type="button" onClick={closeAddComponentModal}>
                  Cancel
                </CancelButton>
                <SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Component'}
                </SubmitButton>
              </ModalButtons>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </Section>
  );
};

export default ComponentsSection; 