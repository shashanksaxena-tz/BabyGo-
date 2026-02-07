import express from 'express';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import Doctor from '../models/Doctor.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/doctors
// List all active doctors with optional filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { domain, specialty } = req.query;

    const filter = { isActive: true };
    if (domain) {
      filter.domains = domain;
    }
    if (specialty) {
      filter.specialty = { $regex: specialty, $options: 'i' };
    }

    const doctors = await Doctor.find(filter).sort({ rating: -1 });

    res.json({ doctors });
  } catch (error) {
    console.error('Doctors list error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// GET /api/doctors/recommended/:childId
// Get doctors with analysis-based recommendations
router.get('/recommended/:childId', authMiddleware, async (req, res) => {
  try {
    // 1. Find child
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // 2. Get latest analysis for child
    const latestAnalysis = await Analysis.findOne({ childId: child._id })
      .sort({ createdAt: -1 });

    if (!latestAnalysis) {
      // No analysis yet - return all doctors without recommendations
      const doctors = await Doctor.find({ isActive: true }).sort({ rating: -1 });
      return res.json({
        flaggedDomains: [],
        domainScores: {},
        childName: child.name,
        recommended: [],
        others: doctors.map(d => d.toObject()),
      });
    }

    // 3. Determine flagged domains
    const domainAssessments = {
      motor: latestAnalysis.motorAssessment,
      language: latestAnalysis.languageAssessment,
      cognitive: latestAnalysis.cognitiveAssessment,
      social: latestAnalysis.socialAssessment,
    };

    const flaggedDomains = [];
    const domainScores = {};

    for (const [domain, assessment] of Object.entries(domainAssessments)) {
      if (assessment) {
        domainScores[domain] = {
          score: assessment.score,
          status: assessment.status,
        };
        if (assessment.status === 'needs_support' || assessment.status === 'emerging') {
          flaggedDomains.push(domain);
        }
      }
    }

    // 4. Get all active doctors
    const allDoctors = await Doctor.find({ isActive: true }).sort({ rating: -1 });

    // 5. Split into recommended and others
    const recommended = [];
    const others = [];

    for (const doctor of allDoctors) {
      const doctorObj = doctor.toObject();
      const matchingDomains = (doctor.domains || []).filter(d => flaggedDomains.includes(d));

      if (matchingDomains.length > 0) {
        const reasons = matchingDomains.map(d => {
          const assessment = domainAssessments[d];
          return `${d} development is ${assessment.status.replace('_', ' ')} (score: ${assessment.score}/100)`;
        });

        doctorObj.isRecommended = true;
        doctorObj.recommendationReason = `Recommended because your child's ${reasons.join('; ')}. Dr. ${doctor.name} specializes in ${doctor.specialty} with expertise in ${matchingDomains.join(', ')} development.`;
        recommended.push(doctorObj);
      } else {
        doctorObj.isRecommended = false;
        others.push(doctorObj);
      }
    }

    res.json({
      flaggedDomains,
      domainScores,
      childName: child.name,
      recommended,
      others,
    });
  } catch (error) {
    console.error('Doctor recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch doctor recommendations' });
  }
});

export default router;
