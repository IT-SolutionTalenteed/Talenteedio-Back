import { Request, Response } from 'express';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const extractCVDataController = {
  extractCVData: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CV file provided'
        });
      }

      const cvPath = req.file.path;
      
      // Appeler le script Python d'extraction de données CV
      const pythonProcess = spawn('python3', [
        path.join(__dirname, '../../ai-service/cv_data_extractor.py'),
        '--cv-path', cvPath
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Nettoyer le fichier temporaire
        fs.unlink(cvPath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });

        if (code === 0) {
          try {
            const extractedData = JSON.parse(stdout);
            res.json({
              success: true,
              data: extractedData
            });
          } catch (parseError) {
            console.error('Error parsing Python output:', parseError);
            res.status(500).json({
              success: false,
              message: 'Error parsing extracted data',
              error: parseError.message
            });
          }
        } else {
          console.error('Python script error:', stderr);
          res.status(500).json({
            success: false,
            message: 'Error extracting CV data',
            error: stderr
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Error spawning Python process:', error);
        
        // Nettoyer le fichier temporaire
        fs.unlink(cvPath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });

        res.status(500).json({
          success: false,
          message: 'Error processing CV',
          error: error.message
        });
      });

    } catch (error) {
      console.error('Error in extractCVData:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};