nexus# NexusCode Gamified Coding Learning App

Welcome to the NexusCode project! This repository contains both the frontend and backend components of the NexusCode gamified coding learning application.

## Project Structure

The project is divided into two main parts:

1. **Frontend**: Located in the `frontend` directory, this part is built with Next.js and React. It handles the user interface and user experience of the application.
   - **Pages**: The main entry point is located in `src/pages/index.tsx`.
   - **Components**: Reusable components can be found in `src/components`.
   - **Styles**: Global styles are defined in `src/styles/globals.css`.
   - **Public Assets**: Static assets are stored in the `public` directory.

2. **Backend**: Located in the `backend` directory, this part is built with Nest.js. It manages the server-side logic and database interactions.
   - **Controllers**: HTTP request handling is done in `src/controllers`.
   - **Services**: Business logic is implemented in `src/services`.
   - **Entities**: Database entities are defined in `src/entities`.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (version 6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd nexuscode-app
   ```

2. Install dependencies for the frontend:
   ```
   cd frontend
   npm install
   ```

3. Install dependencies for the backend:
   ```
   cd ../backend
   npm install
   ```

### Running the Application

To run the frontend and backend applications, follow these steps:

1. Start the backend server:
   ```
   cd backend
   npm run start
   ```

2. In a new terminal, start the frontend application:
   ```
   cd frontend
   npm run dev
   ```

The frontend will be available at `http://localhost:3000` and the backend API will be running on `http://localhost:3001` (or the port specified in your configuration).

## Contributing

We welcome contributions to the NexusCode project! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

## Acknowledgments

Thank you for checking out the NexusCode project! We hope you enjoy building and learning with us.