// frontend/src/components/ResumeUpload.js
import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  CircularProgress,
  Stack,
  Paper,
  Fade,
  Zoom
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  FileUpload as FileUploadIcon,
  InsertDriveFile as FileIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import api from '../services/api';

const ResumeUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    setFileUploaded(false);
    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.filePath) {
        setFilePath(response.data.filePath);
        setFileUploaded(true);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = () => {
    if (filePath) {
      onUploadSuccess(filePath);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #60a5fa 30%, #f472b6 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3
        }}
      >
        Upload Resume
      </Typography>
      
      <Paper
        elevation={3}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 5,
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(96, 165, 250, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 4,
            padding: '2px',
            background: dragActive 
              ? 'linear-gradient(45deg, #60a5fa, #f472b6)'
              : 'linear-gradient(45deg, rgba(96, 165, 250, 0.3), rgba(244, 114, 182, 0.3))',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            pointerEvents: 'none',
            opacity: dragActive ? 1 : 0.5,
            transition: 'opacity 0.3s ease'
          }
        }}
        onClick={() => !fileUploaded && fileInputRef.current?.click()}
      >
        {uploading ? (
          <Fade in={uploading}>
            <Stack spacing={3} alignItems="center">
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{
                  color: 'primary.main',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Typography variant="h6" color="primary.light">
                Analyzing Your Resume...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This may take a moment
              </Typography>
            </Stack>
          </Fade>
        ) : (
          <Stack spacing={3} alignItems="center">
            <Zoom in={true}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(96, 165, 250, 0.1)',
                  mb: 2
                }}
              >
                {dragActive ? (
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                ) : fileUploaded ? (
                  <FileIcon sx={{ fontSize: 48, color: 'success.light' }} />
                ) : (
                  <FileUploadIcon sx={{ fontSize: 48, color: 'primary.light' }} />
                )}
              </Box>
            </Zoom>
            
            <Typography variant="h6" color="primary.light" fontWeight={600}>
              {dragActive 
                ? 'Drop Your Resume Here' 
                : fileUploaded 
                  ? 'Resume Uploaded Successfully' 
                  : 'Click to Upload or Drag & Drop'}
            </Typography>
            
            {fileName ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  borderRadius: 2,
                  background: 'rgba(96, 165, 250, 0.1)',
                }}
              >
                <FileIcon color="primary" />
                <Typography variant="body2" color="text.primary">
                  {fileName}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                PDF, DOC or DOCX (max. 10MB)
              </Typography>
            )}
          </Stack>
        )}
      </Paper>

      {fileUploaded && !uploading && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AnalyticsIcon />}
          onClick={handleAnalyze}
          sx={{ 
            mt: 3, 
            fontWeight: 600,
            textTransform: 'none',
            py: 1.5,
            px: 3,
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            background: 'linear-gradient(90deg, #60a5fa 0%, #f472b6 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #3b82f6 0%, #ec4899 100%)',
              boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          See Analysis
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mt: 3,
          maxWidth: '400px',
          mx: 'auto',
          lineHeight: 1.6
        }}
      >
        Your resume will be analyzed using AI to identify your skills, experience, and match you with relevant job opportunities.
      </Typography>
    </Box>
  );
};

export default ResumeUpload;
