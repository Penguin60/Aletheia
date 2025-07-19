import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { analyzeVideoForBias } from '../../app/actions';

export const config = {
  api: {
    bodyParser: false, // disables Next.js default body parsing
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = formidable({ maxFileSize: 100 * 1024 * 1024 }); // 100MB

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(400).json({ error: 'File too large or invalid.' });
      return;
    }
    const file = files.file;
    // Support both single and array file upload
    let uploadedFile = Array.isArray(file) ? file[0] : file;
    if (!uploadedFile || !uploadedFile.filepath) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }
    // Read file as Buffer
    const buffer = fs.readFileSync(uploadedFile.filepath);
    try {
      // Call the existing analyzeVideoForBias function from actions.ts
      const result = await analyzeVideoForBias(buffer);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Video analysis failed.' });
    }
  });
}
