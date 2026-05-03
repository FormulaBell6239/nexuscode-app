# NexusCode Backend Documentation

This is the backend for the NexusCode gamified coding learning app, built using Nest.js. The backend is responsible for handling API requests, managing game logic, and interacting with the database.

## Project Structure

- **src/**: Contains the source code for the backend application.
  - **app.module.ts**: The main module that imports and configures necessary modules, controllers, and providers.
  - **main.ts**: The entry point of the application that starts the Nest server.
  - **controllers/**: Contains controllers that handle incoming requests.
    - **game.controller.ts**: Handles HTTP requests related to game functionalities.
  - **services/**: Contains services that encapsulate business logic.
    - **game.service.ts**: Contains methods for game-related operations.
  - **entities/**: Contains entity definitions for the database.
    - **user.entity.ts**: Defines the structure of user data in the database.

## Getting Started

1. **Installation**: 
   Run `npm install` in the backend directory to install the required dependencies.

2. **Running the Application**: 
   Use the command `npm run start` to start the Nest.js server.

3. **API Endpoints**: 
   The backend exposes various API endpoints for game functionalities. Refer to the `game.controller.ts` for details on available endpoints.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.