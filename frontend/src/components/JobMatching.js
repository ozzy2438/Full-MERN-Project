import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const JobMatching = () => {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const handleApply = async (job) => {
    try {
      await api.post('/applications', {
        user: user.id,
        job: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.snippet,
          applicationUrl: job.link
        },
        status: 'Applied',
        timeline: [{
          status: 'Applied',
          notes: 'Applied through CareerLens'
        }]
      });

      // Show success message
      alert('Job application saved successfully!');
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
                onClick={() => handleApply(job)} 
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
    </div>
  );
};

export default JobMatching;
