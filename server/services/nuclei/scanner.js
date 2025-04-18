const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Scan = require('../../models/scanModel');
const Vulnerability = require('../../models/vulnerabilityModel');
const { formatDuration } = require('../../utils/formatDuration');

// Path to the nuclei binary
const nucleiPath = process.env.NUCLEI_PATH || 'nuclei';

// Mapping between Nuclei severity and our priority
const severityMap = {
  'critical': 'Высокая',
  'high': 'Высокая',
  'medium': 'Средняя',
  'low': 'Низкая',
  'info': 'Низкая',
};

// Mapping for priority level numbers
const priorityLevelMap = {
  'Высокая': [1, 4, 7, 8, 10],
  'Средняя': [2, 5, 13],
  'Низкая': [3, 11, 12],
};

// Execute nuclei scan
const executeScan = async (scanId, target) => {
  try {
    const scan = await Scan.findById(scanId);
    if (!scan) {
      console.error(`Scan ${scanId} not found`);
      return;
    }

    // Create a temporary file to store results
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const resultsFile = path.join(tempDir, `${scanId}.json`);

    // Build nuclei command
    const args = [
      '-target', target,
      '-json',
      '-o', resultsFile,
      '-silent',
    ];

    console.log(`Starting nuclei scan: ${nucleiPath} ${args.join(' ')}`);

    // Spawn nuclei process
    const nucleiProcess = spawn(nucleiPath, args);

    let stderr = '';

    nucleiProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    nucleiProcess.on('close', async (code) => {
      try {
        const endTime = new Date();
        const duration = endTime - scan.startTime;

        if (code !== 0) {
          console.error(`Nuclei process exited with code ${code}`);
          console.error(`Error: ${stderr}`);

          // Update scan status to error
          scan.status = 'Ошибка';
          scan.endTime = endTime;
          scan.duration = formatDuration(duration);
          await scan.save();
          
          // Clean up temp file
          if (fs.existsSync(resultsFile)) {
            fs.unlinkSync(resultsFile);
          }
          
          return;
        }

        // Check if results file exists
        if (!fs.existsSync(resultsFile)) {
          console.error(`Results file not found: ${resultsFile}`);
          scan.status = 'Успешно';
          scan.vulnerabilitiesCount = 0;
          scan.endTime = endTime;
          scan.duration = formatDuration(duration);
          await scan.save();
          return;
        }

        // Parse results
        const results = fs.readFileSync(resultsFile, 'utf8');
        const vulnerabilities = results
          .split('\n')
          .filter(Boolean)
          .map(line => JSON.parse(line));

        // Group vulnerabilities by name and family
        const groupedVulnerabilities = new Map();
        for (const vuln of vulnerabilities) {
          const key = `${vuln.info.name}|${vuln.template}`;
          if (!groupedVulnerabilities.has(key)) {
            groupedVulnerabilities.set(key, {
              name: vuln.info.name,
              severity: vuln.info.severity,
              family: vuln.template.split('/').slice(-2, -1)[0] || 'http',
              count: 0,
              details: vuln.info.description,
            });
          }
          groupedVulnerabilities.get(key).count += 1;
        }

        // Initialize stats and priority counters
        const stats = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        };

        const priorityCounts = new Map();

        // Save vulnerabilities to database
        for (const [, vuln] of groupedVulnerabilities) {
          const priority = severityMap[vuln.severity] || 'Низкая';
          
          // Update stats counter
          stats[vuln.severity] += vuln.count;
          
          // Create vulnerability in database
          await Vulnerability.create({
            scan: scanId,
            name: vuln.name,
            priority,
            family: vuln.family,
            count: vuln.count,
            details: vuln.details,
          });

          // Choose a random priority level number based on the priority
          const priorityLevels = priorityLevelMap[priority];
          const priorityLevel = priorityLevels[Math.floor(Math.random() * priorityLevels.length)];
          
          // Update priority counter
          if (!priorityCounts.has(priorityLevel)) {
            priorityCounts.set(priorityLevel, 0);
          }
          priorityCounts.set(priorityLevel, priorityCounts.get(priorityLevel) + vuln.count);
        }

        // Calculate total number of vulnerabilities
        const totalVulnerabilities = vulnerabilities.length;

        // Update scan with results
        scan.status = 'Успешно';
        scan.vulnerabilitiesCount = totalVulnerabilities;
        scan.priorities = Array.from(priorityCounts.entries()).map(([level, count]) => ({
          level,
          count,
        }));
        scan.stats = stats;
        scan.endTime = endTime;
        scan.duration = formatDuration(duration);
        await scan.save();

        // Clean up temp file
        fs.unlinkSync(resultsFile);

        console.log(`Scan completed: ${scanId}`);
      } catch (error) {
        console.error(`Error processing scan results: ${error}`);
        
        // Update scan status to error
        const scan = await Scan.findById(scanId);
        if (scan) {
          scan.status = 'Ошибка';
          scan.endTime = new Date();
          scan.duration = formatDuration(new Date() - scan.startTime);
          await scan.save();
        }
        
        // Clean up temp file
        if (fs.existsSync(resultsFile)) {
          fs.unlinkSync(resultsFile);
        }
      }
    });

    nucleiProcess.on('error', async (error) => {
      console.error(`Failed to start nuclei process: ${error}`);
      
      // Update scan status to error
      scan.status = 'Ошибка';
      scan.endTime = new Date();
      scan.duration = formatDuration(new Date() - scan.startTime);
      await scan.save();
    });

  } catch (error) {
    console.error(`Error executing scan: ${error}`);
  }
};

module.exports = {
  executeScan,
};