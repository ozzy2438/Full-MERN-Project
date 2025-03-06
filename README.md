# 🚀 CareerLens Project

Welcome to CareerLens - Your AI-Powered Career Companion! 🌟

## 📚 Project Overview

This document provides a comprehensive overview of the CareerLens project, detailing the libraries and dependencies used, project management methodologies, and testing strategies implemented throughout the development process.

---

## 🛠️ Libraries & Dependencies

### 🎨 Frontend (Client)

- **@emotion/react, @emotion/styled**: These libraries are used for CSS-in-JS styling, allowing dynamic and scoped styling within React components.

- **@fullcalendar/daygrid, @fullcalendar/interaction, @fullcalendar/react**: These libraries provide interactive calendar functionalities, enabling users to track job application timelines visually.

- **@mui/icons-material, @mui/material**: Material UI libraries used for creating a consistent, responsive, and visually appealing user interface with pre-built React components and icons.

- **axios**: A promise-based HTTP client used to handle API requests between the frontend and backend, supporting asynchronous operations with async/await syntax.

- **dotenv**: Allows the frontend to securely manage environment variables, such as API endpoints, without exposing sensitive information.

- **react, react-dom**: Core libraries for building the frontend application using React, enabling component-based architecture and efficient DOM manipulation.

- **react-router-dom**: Enables client-side routing, allowing the application to behave as a single-page application (SPA) with dynamic navigation between different views.

- **react-scripts**: Provides scripts and configurations for running, building, and testing the React application, included by default with Create React App.

---

### ⚙️ Backend (Server)

- **express**: A minimal and flexible Node.js web application framework used to build the backend API, handling HTTP requests and responses efficiently.

- **axios**: Used on the backend to make external API calls (e.g., OpenAI, DeepSeek, Jooble APIs) for resume analysis and job search functionalities.

- **bcryptjs**: Provides hashing functionality for securely storing user passwords in the database.

- **cors**: Enables Cross-Origin Resource Sharing, allowing the frontend application to communicate securely with the backend API from different origins.

- **dotenv**: Manages environment variables securely, storing sensitive information such as API keys, database URIs, and JWT secrets.

- **jsonwebtoken**: Implements JSON Web Tokens (JWT) for secure user authentication and authorization.

- **mongoose**: An Object Data Modeling (ODM) library for MongoDB, used to define schemas, manage database interactions, and perform CRUD operations.

- **multer**: Middleware for handling multipart/form-data, primarily used for uploading resume files (PDF, DOC, DOCX).

- **pdf-parse**: Extracts text content from uploaded PDF resumes, enabling further analysis through external APIs.

- **nodemon** (dev dependency): Automatically restarts the server during development upon detecting file changes, improving development efficiency.

---

### 🌐 External APIs & Services

- **OpenAI API**: Used for advanced resume analysis, providing detailed insights, strengths, weaknesses, and recommendations based on resume content.

- **DeepSeek API**: An alternative AI-powered resume analysis service, offering comprehensive resume evaluations and job matching suggestions.

- **Jooble API**: Integrated for job search functionality, allowing users to find relevant job listings based on their resume analysis results.

---

## 📋 Project Management & Task Delegation Methodology

We utilized Discord as our primary communication platform, conducting daily audio calls and screen-sharing sessions to facilitate real-time collaboration and debugging. This approach allowed us to quickly identify and resolve issues, significantly enhancing productivity.

For task management, we adopted a Kanban methodology using Trello. Our Kanban board initially included columns for:

- 📝 Requirements (Part A & Part B)
- 🔍 Research
- 🎯 Presentations
- 📖 User Stories
- 📊 Backlog
- ✅ To Do
- 🔄 Doing
- 🧪 Testing
- ✨ Completed

As the project progressed, completed columns such as Requirements, Research, Presentations, and User Stories were archived to maintain clarity. Tasks were labeled based on estimated completion time and categorized as either frontend or backend tasks.

Daily stand-up meetings were held each morning to discuss daily goals, followed by check-ins before lunch and at the end of the day to monitor progress and address any blockers. Our Kanban approach emphasized continuous delivery, allowing us to deploy features incrementally as they became ready.

---

## 🧪 Testing Strategy

### 🎯 Frontend Testing

- **Manual Testing**: Extensive manual testing was conducted by team members, family, and friends to ensure usability, responsiveness, and functionality across various devices and browsers.

- **Integration Testing**: Axios interceptors and API response validations were implemented to ensure robust error handling and reliable communication between frontend and backend services.

### ⚡ Backend Testing

- **Manual Testing**: Postman was extensively used to test API endpoints, ensuring correct responses, error handling, and data integrity.

- **Unit & Integration Testing**: Mocha and Chai were utilized to write comprehensive unit and integration tests for backend routes, middleware, and database interactions, ensuring reliability and stability.

### 🔄 End-to-End Testing

- **User Acceptance Testing (UAT)**: Conducted by external users (friends and family) to validate the overall user experience, identify usability issues, and gather feedback for improvements.

- **Continuous Integration & Deployment (CI/CD)**: Although not fully automated, manual deployment processes were regularly performed to ensure the application remained stable and functional in production environments.

---

## ✨ Application Features & Functionalities

### 🔐 User Authentication & Authorization

- Secure user registration and login using JWT authentication.
- Password hashing with bcryptjs for enhanced security.
- Protected routes and middleware to ensure authorized access to sensitive data.

### 📄 Resume Upload & Analysis

- File upload functionality supporting PDF, DOC, and DOCX formats.
- Text extraction from resumes using pdf-parse.
- AI-powered resume analysis via OpenAI and DeepSeek APIs, providing detailed insights, strengths, weaknesses, and actionable recommendations.

### 🔍 Job Search & Matching

- Integration with Jooble API to fetch relevant job listings based on resume analysis results.
- Advanced search capabilities allowing users to refine job searches by keywords, location, and skills.

### 📊 Application Tracking & Management

- Comprehensive application tracking system enabling users to manage job applications, update statuses, and add notes.
- Interactive calendar view (FullCalendar) for visualizing application timelines and upcoming events.

### 🎨 User Interface & Experience

- Responsive and intuitive UI built with React and Material UI.
- Consistent design language and interactive components enhancing user engagement.
- Smooth animations, transitions, and visual feedback for improved usability.

---

## 🚀 Deployment & Hosting

- **Frontend**: Deployed using Netlify, providing continuous deployment from GitHub repositories.
- **Backend**: Hosted on Render.com, offering reliable and scalable Node.js hosting with MongoDB integration.

---

## 🔮 Future Improvements & Enhancements

- 🔄 Implement automated CI/CD pipelines for streamlined deployment processes.
- 👤 Enhance user profile management, allowing users to update personal information and preferences.
- 🌐 Integrate additional job search APIs for broader job listing coverage.
- 🧪 Expand testing coverage with automated end-to-end tests using Cypress or Selenium.

---

## 👥 Contributors

- Osman Orka

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ by the CareerLens Team
