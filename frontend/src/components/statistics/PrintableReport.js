import React from 'react';

/**
 * Component to render the printable report for rating statistics
 */
const PrintableReport = ({ stats, periodTitle, filters }) => {
  if (!stats) return null;
  
  // Filter targets based on selected filters
  const filteredTargets = stats.targets?.filter(target => {
    // Filter by target type
    if (filters.targetType !== 'all' && target.targetType !== filters.targetType) {
      return false;
    }
    return true;
  }) || [];
  
  return (
    <div style={{ padding: '20px', maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>Rating Statistics Report</h1>
        <h2>{periodTitle || 'All Periods'}</h2>
        <p>Generated on: {new Date().toLocaleString()}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Summary</h3>
        <p>Total Ratings: {stats.totalRatings || 0}</p>
      </div>
      
      {filteredTargets.length > 0 && (
        <div>
          <h3>Targets Overview</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Type</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Total Ratings</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Average Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredTargets.map((target, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {target.targetType === 'teacher' ? 'Teacher' : 'Subject'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{target.name || 'Unknown'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{target.totalRatings || 0}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{(target.averageRating || 0).toFixed(1)}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTargets.map((target, tIndex) => (
            <div key={tIndex} style={{ marginBottom: '30px', breakInside: 'avoid' }}>
              <h3>{target.targetType === 'teacher' ? 'Teacher' : 'Subject'}: {target.name}</h3>
              
              <h4>Questions Detail</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Question</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Type</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Rating/Responses</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(target.questionStats) && target.questionStats.map((qStat, qIndex) => (
                    <tr key={qIndex}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{qStat.questionText || 'Unknown Question'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{qStat.questionType === 'text' ? 'Text' : 'Rating'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                        {qStat.questionType === 'text' ? 
                          'Text Responses' : 
                          `${(qStat.average || 0).toFixed(1)}/5`
                        }
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{qStat.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* School and Direction Breakdown */}
              {Array.isArray(target.questionStats) && target.questionStats.some(q => q.schools && Object.keys(q.schools).length > 0) && (
                <div>
                  <h4>Response Distribution by School</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Question</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>School</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {target.questionStats.flatMap((qStat, qIndex) => 
                        qStat.schools ? 
                          Object.entries(qStat.schools).map(([schoolId, schoolData], sIndex) => (
                            <tr key={`${qIndex}-${sIndex}`}>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{qStat.questionText}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{schoolData.name}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{schoolData.count}</td>
                            </tr>
                          ))
                        : []
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {Array.isArray(target.questionStats) && target.questionStats.some(q => q.directions && Object.keys(q.directions).length > 0) && (
                <div>
                  <h4>Response Distribution by Direction</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Question</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Direction</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {target.questionStats.flatMap((qStat, qIndex) => 
                        qStat.directions ? 
                          Object.entries(qStat.directions).map(([directionId, directionData], dIndex) => (
                            <tr key={`${qIndex}-${dIndex}`}>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{qStat.questionText}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{directionData.name}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{directionData.count}</td>
                            </tr>
                          ))
                        : []
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Display text responses if available */}
              {Array.isArray(target.questionStats) && target.questionStats.some(q => q.questionType === 'text' && q.responses && q.responses.length > 0) && (
                <div>
                  <h4>Text Responses</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Question</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {target.questionStats
                        .filter(q => q.questionType === 'text' && q.responses && q.responses.length > 0)
                        .flatMap((qStat, qIndex) => 
                          qStat.responses.map((response, rIndex) => (
                            <tr key={`${qIndex}-${rIndex}`}>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{qStat.questionText}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{response}</td>
                            </tr>
                          ))
                        )
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrintableReport;
