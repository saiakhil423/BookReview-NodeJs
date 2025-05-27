![image](https://github.com/user-attachments/assets/cd41c99e-cd80-4213-a4f1-a5d7e03facbe)# Book Review SQLite API

This is a RESTful API for a Book Review application built with Node.js, Express, and SQLite. It allows users to register, authenticate, manage books, and add reviews with ratings. The API uses JWT for authentication and SQLite as the database.

## Technologies Used

- Node.js
- Express 5
- SQLite3
- bcryptjs (for password hashing)
- jsonwebtoken (JWT authentication)
- cors
- dotenv
- nodemon (development)

## Project Structure

- `app.js`: Main application setup, middleware, and route registration.
- `db.js`: SQLite database connection and schema setup.
- `routes/auth.js`: Authentication routes (signup, login).
- `routes/books.js`: Book and review management routes.
- `middleware/auth.js`: JWT authentication middleware.
- `package.json`: Project metadata and dependencies.

## Setup and Installation

1. Clone the repository.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your JWT secret:

   ```
   JWT_SECRET=your_jwt_secret_here
   ```

4. Start the server:

   - For development with auto-reload:

     ```bash
     npm run dev
     ```

   - For production:

     ```bash
     npm start
     ```

5. The server will run on `http://localhost:5000`.

## Database Schema

The SQLite database (`bookreview.db`) contains three tables:

- `users`:
  - `id` (INTEGER, primary key)
  - `username` (TEXT, unique, not null)
  - `password` (TEXT, hashed, not null)

- `books`:
  - `id` (INTEGER, primary key)
  - `title` (TEXT, not null)
  - `author` (TEXT, not null)
  - `genre` (TEXT, optional)
  - `created_by` (INTEGER, foreign key to users.id)

- `reviews`:
  - `id` (INTEGER, primary key)
  - `book_id` (INTEGER, foreign key to books.id)
  - `user_id` (INTEGER, foreign key to users.id)
  - `rating` (INTEGER, 1-5)
  - `comment` (TEXT, optional)
  - Unique constraint on (`book_id`, `user_id`) to prevent multiple reviews by the same user on a book.

## API Endpoints

### Authentication

- `POST /api/auth/signup`  
  Register a new user. Requires `username` and `password`.

- `POST /api/auth/login`  
  Login and receive a JWT token. Requires `username` and `password`.

### Books (Require Authentication)

- `POST /api/books`  
  Add a new book. Requires `title` and `author`. Optional `genre`.

- `GET /api/books`  
  Get books created by the logged-in user.

- `GET /api/allBooks`  
  Get all books in the system.

- `PUT /api/books/:id`  
  Update a book by ID. Only the creator can update.

- `DELETE /api/books/:id`  
  Delete a book by ID. Only the creator can delete.

- `GET /api/:id`  
  Get book details by ID, including average rating and paginated reviews. Query params: `page` (default 1), `limit` (default 5).

- `GET /api/search?q=searchTerm`  
  Search books by title or author (case-insensitive, partial match).

### Reviews (Require Authentication)

- `POST /api/:id/reviews`  
  Add a review for a book. Requires `rating` (1-5) and optional `comment`.

- `PUT /api/reviews/:id`  
  Update a review by ID. Only the review owner can update.

- `DELETE /api/reviews/:id`  
  Delete a review by ID. Only the review owner can delete.

## Authentication

- Uses JWT tokens.
- Include the token in the `Authorization` header as `Bearer <token>` for protected routes.

## Notes

- Passwords are hashed using bcryptjs.
- The server listens on port 5000.
- CORS is enabled for all origins.

## Postman Images for better understanding
![image](https://github.com/user-attachments/assets/ccf3aceb-f0a0-4840-bb2f-55f07a21f74f)
![image](https://github.com/user-attachments/assets/404048ad-f01a-40e8-b3c2-ab71be80b0e1)
![image](https://github.com/user-attachments/assets/8b6ddb7d-a046-4622-82e8-05302278bb1c)
![image](https://github.com/user-attachments/assets/0ffcbad0-6004-41c7-bbb5-38f3263404bb)
![image](https://github.com/user-attachments/assets/d0cf3711-fd50-4d1a-b5cb-a5dab768a038)
![image](https://github.com/user-attachments/assets/c915bb02-3147-496d-88ac-11dc417e0ce8)
![image](https://github.com/user-attachments/assets/f264f2ee-7381-43ef-9965-2aaa98e28572)
![image](https://github.com/user-attachments/assets/adddf5a7-532d-4e7c-840c-1909c954db87)
![image](https://github.com/user-attachments/assets/90d88bf6-bef8-4308-a033-59a26dcf1ac0)
![image](https://github.com/user-attachments/assets/96fe1401-e16d-4858-b4bf-6f773f39b1dc)
![image](https://github.com/user-attachments/assets/321e10f4-1325-4ee6-be9b-387c2f2fdab6)





## License

ISC
