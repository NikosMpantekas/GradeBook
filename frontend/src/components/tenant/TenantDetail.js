import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Container, Row, Col, Card, Button, Alert, Form,
  Spinner, ListGroup, Badge
} from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// TenantDetail component to allow school owners to manage their tenant
const TenantDetail = () => {
  const { user } = useSelector(state => state.auth);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSchools: 0
  });
  
  // Form state for editing tenant details
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });
  
  // Fetch tenant details on component mount
  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        setLoading(true);
        
        if (!user || !user.tenantId) {
          setError('No tenant information available');
          setLoading(false);
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/tenants/${user.tenantId}`, config);
        setTenant(response.data);
        
        // Initialize form data with tenant details
        setFormData({
          name: response.data.name || '',
          contactEmail: response.data.contactEmail || '',
          contactPhone: response.data.contactPhone || '',
          address: response.data.address || ''
        });
        
        // Also fetch statistics
        if (user.role === 'school_owner' || user.role === 'admin') {
          const statsResponse = await axios.get(`${API_URL}/tenants/${user.tenantId}/stats`, config);
          setStats(statsResponse.data);
        }
        
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching tenant details');
        console.error('Error fetching tenant details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if user is school owner or admin
    if (user && (user.role === 'school_owner' || user.role === 'admin')) {
      fetchTenantDetails();
    } else {
      setError('Unauthorized: Only school owners and admins can access this page');
      setLoading(false);
    }
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle form submission to update tenant
  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.put(`${API_URL}/tenants/${user.tenantId}`, formData, config);
      
      // Update local tenant state
      setTenant({ ...tenant, ...formData });
      setEditing(false);
      
      // Show success message
      alert('Tenant details updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating tenant');
      console.error('Error updating tenant:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Not authorized if not school owner or admin
  if (user && !(user.role === 'school_owner' || user.role === 'admin')) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          You are not authorized to access this page. Only school owners and admins can manage tenant details.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <h1>School Tenant Management</h1>
      <p className="lead">View and manage your school tenant settings.</p>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      ) : tenant ? (
        <>
          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">School Information</h5>
                  {!editing && (
                    <Button 
                      variant="primary" 
                      onClick={() => setEditing(true)}
                      disabled={user.role !== 'school_owner'}
                    >
                      <i className="fas fa-edit"></i> Edit Details
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  {editing ? (
                    <Form onSubmit={handleUpdateTenant}>
                      <Form.Group className="mb-3">
                        <Form.Label>School Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter school name"
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          placeholder="Enter contact email"
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Contact Phone</Form.Label>
                        <Form.Control
                          type="text"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          placeholder="Enter contact phone"
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>School Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter school address"
                        />
                      </Form.Group>
                      
                      <div className="d-flex justify-content-end">
                        <Button 
                          variant="secondary" 
                          onClick={() => setEditing(false)} 
                          className="me-2"
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="success" 
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? <Spinner size="sm" animation="border" /> : 'Save Changes'}
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <strong>School Name:</strong> {tenant.name}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Status:</strong>{' '}
                        <Badge bg={tenant.status === 'active' ? 'success' : 'danger'}>
                          {tenant.status}
                        </Badge>
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Contact Email:</strong>{' '}
                        {tenant.contactEmail || 'Not set'}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Contact Phone:</strong>{' '}
                        {tenant.contactPhone || 'Not set'}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Address:</strong>{' '}
                        {tenant.address || 'Not set'}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Created:</strong>{' '}
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </ListGroup.Item>
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Statistics</h5>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      Total Users
                      <Badge bg="primary" pill>{stats.totalUsers}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      Students
                      <Badge bg="info" pill>{stats.totalStudents}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      Teachers
                      <Badge bg="warning" pill>{stats.totalTeachers}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                      Schools
                      <Badge bg="success" pill>{stats.totalSchools}</Badge>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Account Information</h5>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <strong>Owner:</strong> {tenant.ownerName || user.name}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Email:</strong> {tenant.ownerEmail || user.email}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Role:</strong> {user.role}
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Alert variant="warning">
          No tenant information available. Please contact the system administrator.
        </Alert>
      )}
    </Container>
  );
};

export default TenantDetail;
