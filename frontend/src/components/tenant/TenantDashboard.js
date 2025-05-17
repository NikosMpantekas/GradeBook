import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Container, Row, Col, Card, Button, Table, Badge,
  Modal, Form, Alert, Spinner
} from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// Tenant Dashboard Component - Only accessible to superadmin users
const TenantDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Form state for creating a new tenant
  const [newTenant, setNewTenant] = useState({
    name: '',
    dbUri: '',
    schoolName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    status: 'active'
  });
  
  // Get all tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/tenants`, config);
        setTenants(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching tenants');
        console.error('Error fetching tenants:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if user is superadmin
    if (user && user.role === 'superadmin') {
      fetchTenants();
    } else {
      setError('Unauthorized: Only superadmins can access this page');
    }
  }, [user, refreshTrigger]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTenant({ ...newTenant, [name]: value });
  };
  
  // Handle tenant creation
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/tenants`, newTenant, config);
      
      // Reset form and close modal
      setNewTenant({
        name: '',
        dbUri: '',
        schoolName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        status: 'active'
      });
      
      setShowAddModal(false);
      
      // Refresh the tenant list
      setRefreshTrigger(prev => prev + 1);
      
      alert('Tenant created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating tenant');
      console.error('Error creating tenant:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tenant status toggle
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.put(`${API_URL}/tenants/${id}`, { status: newStatus }, config);
      
      // Update local state
      setTenants(prevTenants => 
        prevTenants.map(tenant => 
          tenant._id === id ? { ...tenant, status: newStatus } : tenant
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating tenant status');
      console.error('Error updating tenant status:', err);
    }
  };
  
  // Handle tenant deletion (only disabled tenants can be deleted)
  const handleDeleteTenant = async (id) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        await axios.delete(`${API_URL}/tenants/${id}`, config);
        
        // Remove from local state
        setTenants(prevTenants => prevTenants.filter(tenant => tenant._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting tenant');
        console.error('Error deleting tenant:', err);
      }
    }
  };
  
  // Not authorized if not superadmin
  if (user && user.role !== 'superadmin') {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          You are not authorized to access this page. Only superadmins can manage tenants.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <h1>Tenant Management Dashboard</h1>
      <p className="lead">Manage school owner accounts and their tenant databases.</p>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">School Tenants</h5>
          <Button 
            variant="success" 
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-plus"></i> Add New School
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          ) : tenants.length === 0 ? (
            <Alert variant="info">
              No tenants found. Create your first tenant by clicking "Add New School".
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Owner Name</th>
                  <th>Owner Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant._id}>
                    <td>{tenant.name}</td>
                    <td>{tenant.ownerName}</td>
                    <td>{tenant.ownerEmail}</td>
                    <td>
                      <Badge bg={tenant.status === 'active' ? 'success' : 'danger'}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="sm"
                        variant={tenant.status === 'active' ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(tenant._id, tenant.status)}
                        className="me-2"
                      >
                        {tenant.status === 'active' ? 'Disable' : 'Activate'}
                      </Button>
                      
                      {tenant.status === 'disabled' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteTenant(tenant._id)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal for adding a new tenant */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New School Tenant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateTenant}>
            <Form.Group className="mb-3">
              <Form.Label>School Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newTenant.name}
                onChange={handleInputChange}
                required
                placeholder="Enter school name"
              />
              <Form.Text className="text-muted">
                This will be used as the tenant name.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Database URI (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="dbUri"
                value={newTenant.dbUri}
                onChange={handleInputChange}
                placeholder="mongodb://localhost:27017/my-tenant-db"
              />
              <Form.Text className="text-muted">
                If not provided, the system default database will be used.
              </Form.Text>
            </Form.Group>
            
            <hr />
            <h5>School Owner Account</h5>
            
            <Form.Group className="mb-3">
              <Form.Label>Owner Name</Form.Label>
              <Form.Control
                type="text"
                name="ownerName"
                value={newTenant.ownerName}
                onChange={handleInputChange}
                required
                placeholder="Enter owner's full name"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Owner Email</Form.Label>
              <Form.Control
                type="email"
                name="ownerEmail"
                value={newTenant.ownerEmail}
                onChange={handleInputChange}
                required
                placeholder="Enter owner's email"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Owner Password</Form.Label>
              <Form.Control
                type="password"
                name="ownerPassword"
                value={newTenant.ownerPassword}
                onChange={handleInputChange}
                required
                placeholder="Create a strong password"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={newTenant.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : 'Create Tenant'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TenantDashboard;
