import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const JobMatching = () => {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [notes, setNotes] = useState('');
  const { user } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/jobSearch', { keywords, location });
      setJobs(response.data.jobs || []);
    } catch (err) {
      setError('Failed to fetch jobs. Please try again.');
      console.error('Job search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setNotes('');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    
    try {
      await api.post('/applications', {
        user: user.id,
        job: {
          title: selectedJob.title,
          company: selectedJob.company,
          location: selectedJob.location,
          description: selectedJob.snippet,
          applicationUrl: selectedJob.link
        },
        status: 'Applied',
        timeline: [{
          status: 'Applied',
          notes: notes || 'Applied through CareerLens'
        }],
        notes: notes ? [{
          content: notes,
          createdAt: new Date().toISOString()
        }] : []
      });

      // Show success message
      alert('Job application saved successfully!');
      handleModalClose();
      
      // Open the job application URL in a new tab
      if (selectedJob.link) {
        window.open(selectedJob.link, '_blank');
      }
    } catch (err) {
      console.error('Error saving application:', err);
      alert('Failed to save application. Please try again.');
    }
  };

  return (
    <div className="job-matching-container">
      <h2>Job Matching</h2>
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <input
            type="text"
            placeholder="Job title, keywords, or company"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="form-control"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="jobs-list">
        {jobs.map((job, index) => (
          <div key={index} className="job-card">
            <h3>{job.title}</h3>
            <p className="company">{job.company}</p>
            <p className="location">{job.location}</p>
            <div className="description" dangerouslySetInnerHTML={{ __html: job.snippet }} />
            <div className="job-actions">
              <a href={job.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                View Job
              </a>
              <button 
                onClick={() => handleApplyClick(job)} 
                className="btn btn-primary ml-2"
              >
                Apply & Track
              </button>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && !loading && !error && (
        <p className="no-results">No jobs found. Try different keywords or location.</p>
      )}
      
      {/* Application Modal */}
      {showModal && selectedJob && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Save Job Application</h3>
              <button className="close-button" onClick={handleModalClose}>×</button>
            </div>
            <div className="modal-content">
              <h4>{selectedJob.title}</h4>
              <p className="company">{selectedJob.company}</p>
              
              <div className="form-group">
                <label htmlFor="notes">Add notes about this application:</label>
                <textarea
                  id="notes"
                  className="form-control"
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this application..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-primary" onClick={handleModalClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleApply}>
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatching;
