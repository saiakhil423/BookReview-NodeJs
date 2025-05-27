const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticate = require("../middleware/auth");
const { resolveTo } = require("@remix-run/router");

function insertBookAsync(title, author, genre, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO books (title, author, genre, created_by) VALUES (?, ?, ?, ?)",
      [title, author, genre || "", userId],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

// POST /api/books - Add a new book
router.post("/books", authenticate, async (req, res) => {
  try {
    const { title, author, genre } = req.body;
    const userId = req.user.id;

    if (!title || !author) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    const bookId = await insertBookAsync(title, author, genre, userId);
    res.status(201).json({ message: "Book added successfully", bookId });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: "Failed to add book" });
  }
});

// GET books api for logged in user
router.get("/books", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const books = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM books WHERE created_by = ?",
        [userId],
        (err, rows) => {
          if (err) {
            return reject(err);
          }
          resolve(rows);
        }
      );
    });
    // res.status(201).json({ message: 'Books fetched for user',user:req.user});
    res.status(200).json({ message: "Books fetched successfully", books });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// get all books
router.get("/allBooks", authenticate, async (req, res) => {
  try {
    const books = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    res.status(200).json({ message: "All books fetched successfully", books });
  } catch (err) {
    console.error("Error fetching all books:", err);
    res.status(500).json({ message: "Failed to fetch all books" });
  }
});

router.put("/books/:id", authenticate, async (req, res) => {
  const bookId = req.params.id;
  const { title, author, genre } = req.body;
  const userId = req.user.id;
  if (!title && !author && !genre) {
    return res.status(400).json({
      message:
        "At least one field (title, author, genre) must be provided for update",
    });
  }
  try {
    const existingBook = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM books WHERE id = ?", [bookId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingBook) {
      return res.status(400).json({ message: "Book not found" });
    }
    if (existingBook.created_by !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this book" });
    }
    const updatedTitle = title || existingBook.title;
    const updatedAuthor = author || existingBook.author;
    const updatedGenre = genre || existingBook.genre;

    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE books SET title = ?, author = ?, genre = ? WHERE id = ?",
        [updatedTitle, updatedAuthor, updatedGenre, bookId],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    res.status(200).json({ message: "Book updated successfully" });
  }  catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Server error while updating book' });
  }
});

router.delete('/books/:id', authenticate, async (req, res) => {
  const bookId= req.params.id;
  const userId = req.user.id;
  const book = await new Promise((resolve, reject) => {
  db.get('SELECT * FROM books WHERE id = ? AND created_by = ?', [bookId, userId], (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

if (!book) {
  return res.status(404).json({ message: 'Book not found or not authorized to delete' });
}
await new Promise((resolve, reject) => {
  db.run('DELETE FROM books WHERE id = ? AND created_by = ?', [bookId, userId], function (err) {
    if (err) reject(err);
    else resolve();
  });
});

res.status(200).json({ message: 'Book deleted successfully' });
});

// GET /api/books/:id - Get book details with average rating and paginated reviews
router.get('/:id', authenticate, async (req, res) => {
  const bookId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  try {
    // 1. Fetch book info
    const book = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
        if (err) reject(err);
        else if (!row) reject({ notFound: true });
        else resolve(row);
      });
    });

    // 2. Get average rating
    const avgRating = await new Promise((resolve, reject) => {
      db.get('SELECT AVG(rating) AS avg FROM reviews WHERE book_id = ?', [bookId], (err, row) => {
        if (err) reject(err);
        else resolve(row.avg || 0);
      });
    });

    //  Get reviews with pagination + username
    const reviews = await new Promise((resolve, reject) => {
      db.all(
        `SELECT reviews.id, reviews.rating, reviews.comment, users.username
         FROM reviews 
         JOIN users ON reviews.user_id = users.id
         WHERE reviews.book_id = ?
         LIMIT ? OFFSET ?`,
        [bookId, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.status(200).json({
      book,
      averageRating: parseFloat(avgRating.toFixed(2)),
      reviews
    });

  } catch (err) {
    if (err.notFound) {
      res.status(404).json({ message: 'Book not found' });
    } else {
      console.error('Error fetching book details:', err);
      res.status(500).json({ message: 'Failed to get book details' });
    }
  }
});

// POST /api/books/:id/reviews - Add a review for a book
router.post('/:id/reviews', authenticate, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if the user already reviewed this book
    const existingReview = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM reviews WHERE book_id = ? AND user_id = ?',
        [bookId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }

    // Insert new review
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [bookId, userId, rating, comment || ''],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ message: 'Failed to add review' });
  }
});
// PUT /api/reviews/:id - Update a review (only by owner)
router.put('/reviews/:id', authenticate, async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  // Validate rating
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // 1. Check if review exists and belongs to the user
    const review = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM reviews WHERE id = ?', [reviewId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // 2. Update review
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE reviews SET rating = ?, comment = ? WHERE id = ?`,
        [
          rating !== undefined ? rating : review.rating,
          comment !== undefined ? comment : review.comment,
          reviewId,
        ],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(200).json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ message: 'Failed to update review' });
  }
});
// DELETE /api/reviews/:id - Delete a review (only by owner)
router.delete('/reviews/:id', authenticate, async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if review exists and belongs to user
    const review = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM reviews WHERE id = ?', [reviewId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    // Delete review
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM reviews WHERE id = ?', [reviewId], function (err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});
// GET /api/books/search?q=someText - Search books by title or author (partial, case-insensitive)
router.get('/search', async (req, res) => {
  const searchQuery = req.query.q;

  if (!searchQuery) {
    return res.status(400).json({ message: 'Search query parameter "q" is required' });
  }

  const searchTerm = `%${searchQuery.toLowerCase()}%`; // wrap with % for partial match

  try {
    const books = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM books 
         WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ?`,
        [searchTerm, searchTerm],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.status(200).json({ message: 'Books fetched successfully', books });
  } catch (err) {
    console.error('Error searching books:', err);
    res.status(500).json({ message: 'Failed to search books' });
  }
});


module.exports = router;
