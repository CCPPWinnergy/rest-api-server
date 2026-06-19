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
  host: process.env.DB_HOST || 'medos.winnergy.co.th',
  port: process.env.DB_PORT || 37203,
  user: process.env.DB_USER || 'pca_user2',
  password: process.env.DB_PASSWORD || 'FfR4NODjJNRtk2KY',
  database: process.env.DB_NAME || 'ccppos'
};

// ตั้งค่า PostgreSQL
const pool = new Pool(dbConfig);

// 1. Employee Data API
app.get('/employees', async (req, res) => {
  const SQL_QUERY = `
    SELECT c.name as company_name, d.name as department_name, 
           e.name as employee_name, e.work_email as email
    FROM hr_employee as e
    LEFT JOIN res_company as c ON c.id = e.company_id
    LEFT JOIN hr_department as d ON d.id = e.department_id
    WHERE e.active = true
  `;

  try {
    const result = await pool.query(SQL_QUERY);
    const filteredData = result.rows.filter(emp => 
      emp.company_name !== 'V2 Logistics Co., LTD.' && emp.email
    );
    res.json({ status: 'success', data: filteredData });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ status: 'error', message: err.toString() });
  }
});

// 2. Pain Point Data API (Dashboard)
app.get('/painpoints', async (req, res) => {
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
    const transformedData = result.rows.map(row => ({
      'Board': row.board,
      'Created by': row.employee_name,
      'Created on': row.create_date,
      'Name': row.name,
      'Department': row.department_name,
      'Email': row.email,
      'Description': row.description,
      'Suggestions': row.suggestions,
      'Type Card': row.type_card,
      'Project': row.project_name
    }));
    res.json({ status: 'success', data: transformedData });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ status: 'error', message: err.toString() });
  }
});

// 3. Team Brainstorming API
app.get('/team-brainstorming', async (req, res) => {
  const SQL_QUERY = `
    SELECT c.create_date, c.name, u.name as employee_name, b.name as board_name,
           c.email, c.description, c.suggestions, t.name as topic,
           d.name as department_name, c.type_card
    FROM iti_ccpp_card as c
    LEFT JOIN hr_employee as u ON u.user_id = c.create_uid
    LEFT JOIN iti_ccpp_board as b ON b.id = c.board_id
    LEFT JOIN iti_ccpp_topic as t ON t.id = c.topic_id
    LEFT JOIN hr_department as d ON d.id = c.department_id
    WHERE c.project_id is null AND c.type_card = 'TB'
  `;

  try {
    const result = await pool.query(SQL_QUERY);
    const transformedData = result.rows.map(row => ({
      'Created on': row.create_date,
      'Name': row.name,
      'Created by': row.employee_name,
      'Board': row.board_name,
      'Email': row.email,
      'Description': row.description,
      'Suggestions': row.suggestions,
      'Topic': row.topic,
      'Department': row.department_name,
      'Type Card': row.type_card,
      'source': 'Team Brainstorming'
    }));
    res.json({ status: 'success', data: transformedData });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ status: 'error', message: err.toString() });
  }
});

// 4. Inter-department Brainstorming API
app.get('/inter-dept-brainstorming', async (req, res) => {
  const SQL_QUERY = `
    SELECT c.create_date, c.name, u.name as employee_name, b.name as board_name,
           c.email, c.description, c.suggestions, t.name as topic,
           d.name as department_name, c.type_card
    FROM iti_ccpp_card as c
    LEFT JOIN hr_employee as u ON u.user_id = c.create_uid
    LEFT JOIN iti_ccpp_board as b ON b.id = c.board_id
    LEFT JOIN iti_ccpp_topic as t ON t.id = c.topic_id
    LEFT JOIN hr_department as d ON d.id = c.department_id
    WHERE c.project_id is null AND c.type_card = 'IDB'
  `;

  try {
    const result = await pool.query(SQL_QUERY);
    const transformedData = result.rows.map(row => ({
      'Created on': row.create_date,
      'Name': row.name,
      'Created by': row.employee_name,
      'Board': row.board_name,
      'Email': row.email,
      'Description': row.description,
      'Suggestions': row.suggestions,
      'Topic': row.topic,
      'Department': row.department_name,
      'Type Card': row.type_card,
      'source': 'Inter-department Brainstorming'
    }));
    res.json({ status: 'success', data: transformedData });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ status: 'error', message: err.toString() });
  }
});

// Main API endpoint (เหมือน Google Apps Script doGet)
app.get('/api', async (req, res) => {
  try {
    // 1. ดึงข้อมูล Pain Points
    const painPointQuery = `
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
    
    // 2. ดึงข้อมูล Employees
    const employeeQuery = `
      SELECT c.name as company_name, d.name as department_name, 
             e.name as employee_name, e.work_email as email
      FROM hr_employee as e
      LEFT JOIN res_company as c ON c.id = e.company_id
      LEFT JOIN hr_department as d ON d.id = e.department_id
      WHERE e.active = true
    `;
    
    // 3. ดึงข้อมูล Team Brainstorming
    const teamQuery = `
      SELECT c.create_date, c.name, u.name as employee_name, b.name as board_name,
             c.email, c.description, c.suggestions, t.name as topic,
             d.name as department_name, c.type_card
      FROM iti_ccpp_card as c
      LEFT JOIN hr_employee as u ON u.user_id = c.create_uid
      LEFT JOIN iti_ccpp_board as b ON b.id = c.board_id
      LEFT JOIN iti_ccpp_topic as t ON t.id = c.topic_id
      LEFT JOIN hr_department as d ON d.id = c.department_id
      WHERE c.project_id is null AND c.type_card = 'TB'
    `;
    
    // 4. ดึงข้อมูล Inter-dept Brainstorming
    const interDeptQuery = `
      SELECT c.create_date, c.name, u.name as employee_name, b.name as board_name,
             c.email, c.description, c.suggestions, t.name as topic,
             d.name as department_name, c.type_card
      FROM iti_ccpp_card as c
      LEFT JOIN hr_employee as u ON u.user_id = c.create_uid
      LEFT JOIN iti_ccpp_board as b ON b.id = c.board_id
      LEFT JOIN iti_ccpp_topic as t ON t.id = c.topic_id
      LEFT JOIN hr_department as d ON d.id = c.department_id
      WHERE c.project_id is null AND c.type_card = 'IDB'
    `;
    
    const [painPointResult, employeeResult, teamResult, interDeptResult] = await Promise.all([
      pool.query(painPointQuery),
      pool.query(employeeQuery),
      pool.query(teamQuery),
      pool.query(interDeptQuery)
    ]);
    
    // กรองข้อมูล Employee (ออก V2 Logistics และคนไม่มีอีเมล)
    const filteredEmployees = employeeResult.rows.filter(emp => 
      emp.company_name !== 'V2 Logistics Co., LTD.' && emp.email
    );
    
    // หา Active Emails
    const activeEmails = new Set();
    painPointResult.rows.forEach(row => {
      if (row.email) activeEmails.add(row.email.toLowerCase());
    });
    
    // หา Inactive Employees
    const inactiveEmployees = filteredEmployees.filter(emp => 
      !activeEmails.has(emp.email.toLowerCase())
    );
    
    // Transform ข้อมูลให้เหมือน GS
    const transformedPainPoints = painPointResult.rows.map(row => ({
      'Board': row.board,
      'Color': null,
      'Created by': row.employee_name,
      'Created on': row.create_date,
      'Department': row.department_name,
      'Description': row.description,
      'Division': null,
      'Email': row.email,
      'Name': row.name,
      'Project': row.project_name,
      'Suggestions': row.suggestions,
      'Topic': null,
      'Type Card': row.type_card
    }));
    
    const transformedInactive = inactiveEmployees.map(emp => ({
      'Employee Name': emp.employee_name,
      'Work Email': emp.email,
      'Department': emp.department_name,
      'Company': emp.company_name,
      'Division': null,
      'Employment Type': null,
      'Job Position': null
    }));
    
    const transformedTeam = teamResult.rows.map(row => ({
      'Department': row.department_name,
      'Board': row.board_name,
      'Description': row.description,
      'Created on': row.create_date,
      'Name': row.name,
      'Created by': row.employee_name,
      'Email': row.email,
      'Suggestions': row.suggestions,
      'Type Card': row.type_card,
      'Topic': row.topic,
      'Color': null,
      'Project': null,
      'Division': null,
      'source': 'Team Brainstorming'
    }));
    
    const transformedInterDept = interDeptResult.rows.map(row => ({
      'Department': row.department_name,
      'Board': row.board_name,
      'Description': row.description,
      'Created on': row.create_date,
      'Name': row.name,
      'Created by': row.employee_name,
      'Email': row.email,
      'Suggestions': row.suggestions,
      'Type Card': row.type_card,
      'Topic': row.topic,
      'Color': null,
      'Project': null,
      'Division': null,
      'source': 'Inter-department Brainstorming'
    }));
    
    const unresolvedData = [...transformedTeam, ...transformedInterDept];
    
    const summary = {
      total: filteredEmployees.length,
      active: activeEmails.size,
      inactive: inactiveEmployees.length
    };
    
    const responseData = {
      painPointData: transformedPainPoints,
      inactiveEmployees: transformedInactive,
      unresolvedPainPoints: unresolvedData,
      summary: summary
    };
    
    res.json({ status: 'success', data: responseData });
    
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ status: 'error', message: err.toString() });
  }
});

// Home page
app.get('/', (req, res) => {
  res.json({ 
    message: 'CCPP REST API Server is running!',
    endpoints: {
      main: '/api (เหมือน Google Apps Script)',
      employees: '/employees',
      painpoints: '/painpoints',
      teamBrainstorming: '/team-brainstorming',
      interDeptBrainstorming: '/inter-dept-brainstorming',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug database connection
app.get('/debug', (req, res) => {
  res.json({
    dbConfig: {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      password: '***hidden***'
    },
    env: {
      DB_HOST: process.env.DB_HOST || 'not set',
      DB_PORT: process.env.DB_PORT || 'not set',
      DB_USER: process.env.DB_USER || 'not set',
      DB_NAME: process.env.DB_NAME || 'not set'
    }
  });
});

// POST endpoint for sending emails (เหมือน GS doPost)
app.post('/send-reminders', async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No emails provided.' });
    }
    
    // ในที่นี้คุณสามารถเพิ่ม email sending logic ได้
    // เช่น ใช้ nodemailer หรือ service อื่นๆ
    
    res.json({ 
      status: 'success', 
      data: { message: `Successfully processed ${emails.length} email addresses.` }
    });
    
  } catch (err) {
    console.error('Error in send-reminders:', err);
    res.status(500).json({ status: 'error', message: err.toString() });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CCPP REST API Server running on port ${PORT}`);
  console.log(`Main endpoint: http://localhost:${PORT}/api`);
});
