# Chat App

A real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO.

## Features

- **Real-time Messaging**: Instant messaging powered by Socket.IO.
- **Group Chats**: Create and participate in group conversations.
- **User Authentication**: Secure signup and login using JWT.
- **Media Sharing**: Upload and share images (powered by Cloudinary).
- **Online Status**: See who is currently online.
- **Responsive Design**: Built with TailwindCSS for a seamless mobile and desktop experience.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, Mongoose (MongoDB)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary

## Prerequisites

Before running the application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository_url>
cd chat-app
```

### 2. Server Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the server:

```bash
npm run server
# or
npm start
```

The server should be running on `http://localhost:5000`.

### 3. Client Setup

Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory (optional, defaults to localhost:5000):

```env
VITE_BACKEND_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

The application should now be running on `http://localhost:5173` (or the port shown in the terminal).

## Project Structure

```
chat-app/
├── client/         # React Frontend
│   ├── src/
│   ├── context/    # Context API (Auth, Chat)
│   └── ...
└── server/         # Express Backend
    ├── models/     # Mongoose Models
    ├── routes/     # API Routes
    ├── lib/        # Config (DB, Cloudinary)
    └── ...
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
