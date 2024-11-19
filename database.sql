--Create a new database
CREATE DATABASE passportjs;

--Create table
CREATE TABLE users(
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE posts(
    id VARCHAR(255) PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) REFERENCES users(id)
);

-- Insert data
INSERT INTO users (id, username, password_hash) VALUES ('1234', 'user 1', 'password123');
-- If we are inserting values to all columns no need to specify the column names. But make sure to insert in the right order
INSERT INTO users VALUES ('1234', 'user 1', 'password123');

-- Select data from multiple columns (join)
-- In this case we are displaying all posts and its contents with the user that made the posts
-- Use the foreign key to create a "connect" between the two tables
SELECT posts.id, posts.content, users.id, users.username
FROM posts
JOIN users
ON posts.user_id = users.id