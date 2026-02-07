import express from 'express';
import PDFDocument from 'pdfkit';
import Report from '../models/Report.js';
import Analysis from '../models/Analysis.js';
import Child from '../models/Child.js';
import { authMiddleware } from '../middleware/auth.js';
import whoDataService from '../services/whoDataService.js';
import storageService, { BUCKETS } from '../services/storageService.js';

const router = express.Router();

/**
 * Helper: compute age in months from a Date of Birth.
 */
function computeAgeMonths(dateOfBirth) {
  const now = new Date();
  const birth = new Date(dateOfBirth);
  return (now.getFullYear() - birth.getFullYear()) * 12 +
         (now.getMonth() - birth.getMonth());
}

/**
 * Helper: generate report number in RPT-YYYY-MMDD format.
 */
function generateReportNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `RPT-${yyyy}-${mm}${dd}`;
}

/**
 * Build a domain assessment object from an analysis domain field.
 */
function buildDomainAssessment(domainField, domainName, ageMonths) {
  if (!domainField) return null;

  // Determine alert level
  let alertLevel = 'none';
  if (domainField.status === 'needs_support') {
    alertLevel = 'concern';
  } else if (domainField.status === 'emerging' || domainField.score < 80) {
    alertLevel = 'watch';
  }

  // Get WHO milestone range for this domain and age
  const milestones = whoDataService.getMilestonesByDomain(domainName, ageMonths);
  let whoRange = '';
  if (milestones && milestones.length > 0) {
    const first = milestones[0];
    whoRange = `${first.title} typically achieved ${first.minMonths}-${first.maxMonths} months`;
  }

  return {
    domain: domainName,
    score: domainField.score,
    status: domainField.status,
    observations: domainField.observations || [],
    strengths: domainField.strengths || [],
    areasToSupport: domainField.areasToSupport || [],
    alertLevel,
    whoRange,
  };
}

/**
 * Generate a PDF report from a Report document.
 * Returns the URL of the uploaded PDF.
 */
async function generateReportPDF(report) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const filename = `report-${report.reportNumber}.pdf`;
          const { url } = await storageService.uploadBuffer(
            BUCKETS.REPORTS,
            buffer,
            'application/pdf',
            filename
          );

          // Update the report with the PDF URL
          report.pdfUrl = url;
          await report.save();

          resolve(url);
        } catch (uploadErr) {
          console.error('PDF upload error:', uploadErr);
          reject(uploadErr);
        }
      });
      doc.on('error', reject);

      // --- PDF Content ---

      // Title
      doc.fontSize(22).font('Helvetica-Bold')
        .text('TinySteps AI - Development Report', { align: 'center' });
      doc.moveDown(0.5);

      // Report number and date
      doc.fontSize(10).font('Helvetica')
        .text(`Report #: ${report.reportNumber}`, { align: 'right' });
      doc.text(`Date: ${new Date(report.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })}`, { align: 'right' });
      doc.moveDown(1);

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);

      // Patient Information
      doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');

      const pi = report.patientInfo;
      doc.text(`Name: ${pi.name}`);
      doc.text(`Age: ${pi.ageMonths} months`);
      if (pi.gender) doc.text(`Gender: ${pi.gender}`);
      if (pi.height) doc.text(`Height: ${pi.height} cm`);
      if (pi.weight) doc.text(`Weight: ${pi.weight} kg`);
      if (pi.headCircumference) doc.text(`Head Circumference: ${pi.headCircumference} cm`);
      doc.moveDown(1);

      // Overall Assessment
      doc.fontSize(14).font('Helvetica-Bold').text('Overall Assessment');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Score: ${report.overallScore}/100`);
      doc.text(`Status: ${report.overallStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`);
      if (report.overallSummary) {
        doc.moveDown(0.3);
        doc.text(report.overallSummary, { width: 495 });
      }
      doc.moveDown(1);

      // Domain Assessment Details
      if (report.domainAssessments && report.domainAssessments.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Domain Assessment Details');
        doc.moveDown(0.5);

        for (const domain of report.domainAssessments) {
          // Domain header with alert indicator
          const alertIndicator = domain.alertLevel === 'concern' ? ' [!!! CONCERN]'
            : domain.alertLevel === 'watch' ? ' [! WATCH]' : '';

          doc.fontSize(12).font('Helvetica-Bold')
            .text(`${domain.domain.charAt(0).toUpperCase() + domain.domain.slice(1)}${alertIndicator}`);
          doc.moveDown(0.2);
          doc.fontSize(10).font('Helvetica');

          doc.text(`Score: ${domain.score}/100  |  Status: ${domain.status.replace(/_/g, ' ')}`);

          if (domain.whoRange) {
            doc.text(`WHO Range: ${domain.whoRange}`, { color: '#666666' });
          }

          if (domain.observations && domain.observations.length > 0) {
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').text('Observations:');
            doc.font('Helvetica');
            for (const obs of domain.observations) {
              doc.text(`  - ${obs}`, { width: 480 });
            }
          }

          if (domain.strengths && domain.strengths.length > 0) {
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').text('Strengths:');
            doc.font('Helvetica');
            for (const s of domain.strengths) {
              doc.text(`  - ${s}`, { width: 480 });
            }
          }

          if (domain.areasToSupport && domain.areasToSupport.length > 0) {
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').text('Areas to Support:');
            doc.font('Helvetica');
            for (const a of domain.areasToSupport) {
              doc.text(`  - ${a}`, { width: 480 });
            }
          }

          doc.moveDown(0.8);
        }
      }

      // Recommendations
      if (report.recommendations && report.recommendations.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Recommendations');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');

        for (let i = 0; i < report.recommendations.length; i++) {
          const rec = report.recommendations[i];
          doc.text(`${i + 1}. ${rec.text}`, { width: 495 });
          doc.moveDown(0.2);
        }
        doc.moveDown(0.5);
      }

      // Disclaimer
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#888888')
        .text(
          'Disclaimer: This report is generated by TinySteps AI for informational purposes only. ' +
          'It is not a substitute for professional medical advice, diagnosis, or treatment. ' +
          'Always seek the advice of your pediatrician or other qualified health provider with ' +
          'any questions you may have regarding your child\'s development.',
          { width: 495, align: 'center' }
        );

      // Finalize
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// -------------------------------------------------------------------
// GET /api/reports/:childId — List reports for a child
// -------------------------------------------------------------------
router.get('/:childId', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ childId: req.params.childId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ reports });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// -------------------------------------------------------------------
// POST /api/reports/:childId/generate — Generate a new report
// -------------------------------------------------------------------
router.post('/:childId/generate', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Get the latest analysis for this child
    const analysis = await Analysis.findOne({ childId: req.params.childId })
      .sort({ createdAt: -1 });

    if (!analysis) {
      return res.status(404).json({ error: 'No analysis exists for this child. Please run a development analysis first.' });
    }

    const ageMonths = computeAgeMonths(child.dateOfBirth);
    const reportNumber = generateReportNumber();

    // Build patient info
    const patientInfo = {
      name: child.name,
      gender: child.gender,
      ageMonths,
      dateOfBirth: child.dateOfBirth,
      height: child.height,
      weight: child.weight,
      headCircumference: child.headCircumference,
    };

    // Build domain assessments
    const domainAssessments = [];
    const domainFields = [
      { field: 'motorAssessment', name: 'motor' },
      { field: 'languageAssessment', name: 'language' },
      { field: 'cognitiveAssessment', name: 'cognitive' },
      { field: 'socialAssessment', name: 'social' },
    ];

    for (const { field, name } of domainFields) {
      const assessment = buildDomainAssessment(analysis[field], name, ageMonths);
      if (assessment) {
        domainAssessments.push(assessment);
      }
    }

    // Get WHO sources
    const whoSources = whoDataService.getSources().map(s => ({
      title: s.title,
      url: s.url,
      domain: 'general',
      summary: s.description,
    }));

    // Build recommendations from personalizedTips
    const recommendations = (analysis.personalizedTips || []).slice(0, 5).map((tip, i) => ({
      priority: i + 1,
      text: tip,
      domain: 'general',
    }));

    // Create the report
    const report = new Report({
      childId: child._id,
      userId: req.user._id,
      analysisId: analysis._id,
      reportNumber,
      patientInfo,
      overallScore: analysis.overallScore,
      overallStatus: analysis.overallStatus,
      overallSummary: analysis.summary,
      domainAssessments,
      growthPercentiles: analysis.growthPercentiles || [],
      recommendations,
      whoSources,
      generatedAt: new Date(),
    });

    await report.save();

    // Generate PDF in the background (non-blocking)
    generateReportPDF(report).catch(err => {
      console.error('Background PDF generation failed:', err.message);
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// -------------------------------------------------------------------
// GET /api/reports/:childId/:id — Get a specific report
// -------------------------------------------------------------------
router.get('/:childId/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      childId: req.params.childId,
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// -------------------------------------------------------------------
// GET /api/reports/:childId/:id/pdf — Get or generate report PDF
// -------------------------------------------------------------------
router.get('/:childId/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      childId: req.params.childId,
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // If PDF already exists, return the URL
    if (report.pdfUrl) {
      return res.json({ pdfUrl: report.pdfUrl });
    }

    // Otherwise generate it
    const url = await generateReportPDF(report);
    res.json({ pdfUrl: url });
  } catch (error) {
    console.error('Get report PDF error:', error);
    res.status(500).json({ error: 'Failed to get report PDF' });
  }
});

// -------------------------------------------------------------------
// POST /api/reports/:childId/:id/share — Share a report
// -------------------------------------------------------------------
router.post('/:childId/:id/share', authMiddleware, async (req, res) => {
  try {
    const { method, recipient } = req.body;

    const report = await Report.findOne({
      _id: req.params.id,
      childId: req.params.childId,
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Ensure PDF exists
    if (!report.pdfUrl) {
      await generateReportPDF(report);
    }

    // Add to sharedWith array
    report.sharedWith.push({
      method,
      recipient,
      sharedAt: new Date(),
    });
    await report.save();

    res.json({
      success: true,
      pdfUrl: report.pdfUrl,
    });
  } catch (error) {
    console.error('Share report error:', error);
    res.status(500).json({ error: 'Failed to share report' });
  }
});

export default router;
