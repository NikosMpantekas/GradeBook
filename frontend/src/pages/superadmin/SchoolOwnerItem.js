import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { CheckCircle, Block, Edit, School, Email } from '@mui/icons-material';
import { updateSchoolOwnerStatus } from '../../features/superadmin/superAdminSlice';

function SchoolOwnerItem({ schoolOwner }) {
  const dispatch = useDispatch();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get school name safely
  const schoolName = schoolOwner.school ? 
    (typeof schoolOwner.school === 'object' ? schoolOwner.school.name : 'Unknown School') 
    : 'No School Assigned';
  
  // Handle status toggle
  const toggleStatus = () => {
    if (isUpdating) return; // Prevent multiple clicks
    
    setIsUpdating(true);
    
    dispatch(updateSchoolOwnerStatus({
      id: schoolOwner._id,
      statusData: { active: !schoolOwner.active }
    }))
      .unwrap()
      .then(() => {
        toast.success(`School owner ${schoolOwner.active ? 'disabled' : 'enabled'} successfully`);
        setIsUpdating(false);
      })
      .catch((error) => {
        toast.error(`Error: ${error}`);
        setIsUpdating(false);
      });
  };

  return (
    <div className={`school-owner-card ${!schoolOwner.active ? 'disabled' : ''}`}>
      <div className="owner-header">
        <h3>{schoolOwner.name}</h3>
        <span className={`status-badge ${schoolOwner.active ? 'active' : 'inactive'}`}>
          {schoolOwner.active ? 'Active' : 'Disabled'}
        </span>
      </div>
      <div className="owner-details">
        <p>
          <Email /> {schoolOwner.email}
        </p>
        <p>
          <School /> {schoolName}
        </p>
      </div>
      <div className="owner-actions">
        <button 
          className={`btn btn-sm ${schoolOwner.active ? 'btn-danger' : 'btn-success'}`}
          onClick={toggleStatus}
          disabled={isUpdating}
        >
          {schoolOwner.active ? (
            <>
              <Block /> Disable
            </>
          ) : (
            <>
              <CheckCircle /> Enable
            </>
          )}
        </button>
        <button 
          className="btn btn-sm"
          onClick={() => window.location.href = `/superadmin/school-owner/${schoolOwner._id}`}
        >
          <Edit /> Details
        </button>
      </div>
    </div>
  );
}

export default SchoolOwnerItem;
