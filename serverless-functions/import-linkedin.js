// Serverless function for LinkedIn CSV import
// Deploy to Vercel/Netlify as: /api/import-linkedin

const mongoose = require('mongoose');
const multer = require('multer');
const csvParser = require('csv-parser');
const { Readable } = require('stream');

// MongoDB connection with timeout protection
async function connectMongoDB() {
  if (mongoose.connection.readyState === 1) return;
  
  const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true
  };
  
  await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
}

// Contact schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  company: String,
  position: String,
  location: String,
  connectedOn: Date,
  source: { type: String, default: 'linkedin' },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectMongoDB();

    // Parse multipart form data
    const upload = multer({ storage: multer.memoryStorage() });
    
    return new Promise((resolve, reject) => {
      upload.single('linkedinCsv')(req, res, async (err) => {
        if (err) {
          res.status(400).json({ error: 'File upload failed' });
          return resolve();
        }

        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return resolve();
        }

        const contacts = [];
        const csvStream = Readable.from(req.file.buffer.toString());

        csvStream
          .pipe(csvParser())
          .on('data', (row) => {
            const contact = {
              name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
              email: row['Email Address'] || '',
              company: row['Company'] || '',
              position: row['Position'] || '',
              connectedOn: row['Connected On'] ? new Date(row['Connected On']) : undefined
            };

            if (contact.name) {
              contacts.push(contact);
            }
          })
          .on('end', async () => {
            try {
              if (contacts.length === 0) {
                res.status(400).json({ error: 'No valid contacts found in CSV' });
                return resolve();
              }

              // Bulk insert with duplicate handling
              const result = await Contact.insertMany(contacts, { 
                ordered: false,
                rawResult: true 
              });

              res.status(200).json({
                message: 'Contacts imported successfully',
                count: contacts.length,
                imported: result.insertedCount || contacts.length
              });
              resolve();
            } catch (dbError) {
              console.error('Database error:', dbError);
              res.status(500).json({ error: 'Database operation failed' });
              resolve();
            }
          })
          .on('error', (csvError) => {
            console.error('CSV parsing error:', csvError);
            res.status(400).json({ error: 'Invalid CSV format' });
            resolve();
          });
      });
    });

  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}