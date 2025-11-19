const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 3000;

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || '137.184.249.112',
  port: process.env.DB_PORT || 37203,
  user: process.env.DB_USER || 'pca_user2',
  password: process.env.DB_PASSWORD || 'FfR4NODjJNRtk2KY',
  database: process.env.DB_NAME || 'ccppos'
};

// ตั้งค่า PostgreSQL
const pool = new Pool(dbConfig);

// API ดึงข้อมูล
app.get('/cards', async (req, res) => {
  const SQL_QUERY = `
    SELECT b.name as board, r.name as employee_name, c.create_date, c.name,
           d.name as department_name, c.email, c.description, c.suggestions, 
           c.type_card, p.name as project_name
    FROM iti_ccpp_card as c
    LEFT JOIN hr_employee AS r ON r.user_id = c.create_uid
    LEFT JOIN iti_ccpp_board AS b ON b.id = c.board_id
    LEFT JOIN hr_department AS d ON d.id = r.department_id
    LEFT JOIN project_project as p on p.id = c.project_id
    WHERE r.active = true
  `;

  try {
    const result = await pool.query(SQL_QUERY);
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.toString() });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});
