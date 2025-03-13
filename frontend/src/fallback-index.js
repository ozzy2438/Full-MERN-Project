// This is a minimal fallback index.js file that doesn't rely on complex dependencies
// It will be used if the main build fails

// Create a simple app container
const appContainer = document.createElement('div');
appContainer.id = 'app';
document.body.appendChild(appContainer);

// Set page title
document.title = 'Job Portal - Maintenance Mode';

// Add some basic styles
const style = document.createElement('style');
style.textContent = `
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }
  h1 {
    color: #2c3e50;
    margin-top: 40px;
  }
  .container {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-top: 40px;
  }
  .message {
    font-size: 18px;
    margin: 20px 0;
  }
  .contact {
    margin-top: 30px;
    font-style: italic;
  }
  .status {
    display: inline-block;
    background-color: #e74c3c;
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-weight: bold;
  }
`;
document.head.appendChild(style);

// Create content
appContainer.innerHTML = `
  <h1>Job Portal</h1>
  <div class="container">
    <div class="status">Maintenance Mode</div>
    <p class="message">
      We're currently updating our system to serve you better. 
      The application will be back online shortly.
    </p>
    <p>
      Thank you for your patience as we work to improve your experience.
    </p>
    <p class="contact">
      If you need immediate assistance, please contact support.
    </p>
  </div>
`;

// Log a message to the console
console.log('Fallback UI loaded successfully');
