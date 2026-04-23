import express from 'express';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import Resource from '../models/Resource.js';
import { authMiddleware } from '../middleware/auth.js';
import { geminiInit } from '../middleware/geminiInit.js';
import geminiService from '../services/geminiService.js';

const router = express.Router();

// GET /api/resources/:childId
// Get current resources for a child with optional filtering and domain/type counts
router.get('/:childId', authMiddleware, async (req, res) => {
  try {
    const { domain, type } = req.query;

    const child = await Child.findByAnyId(req.params.childId);

    // Build filter for current resources — use string childId directly
    const childIdForQuery = child ? String(child._id) : req.params.childId;
    const filter = { childId: childIdForQuery, isCurrent: true };
    if (domain) {
      filter.domain = domain;
    }
    if (type) {
      filter.type = type;
    }

    const resources = await Resource.find(filter).sort({ priority: 1, createdAt: -1 });

    // Get domain and type counts via aggregation
    const [domainCounts, typeCounts] = await Promise.all([
      Resource.aggregate([
        { $match: { childId: childIdForQuery, isCurrent: true } },
        { $group: { _id: '$domain', count: { $sum: 1 } } },
      ]),
      Resource.aggregate([
        { $match: { childId: childIdForQuery, isCurrent: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    const domainCountMap = {};
    for (const dc of domainCounts) {
      domainCountMap[dc._id] = dc.count;
    }

    const typeCountMap = {};
    for (const tc of typeCounts) {
      typeCountMap[tc._id] = tc.count;
    }

    res.json({
      resources,
      counts: {
        total: resources.length,
        byDomain: domainCountMap,
        byType: typeCountMap,
      },
    });
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// POST /api/resources/:childId/regenerate
// Regenerate resources using Gemini based on latest analysis
router.post('/:childId/regenerate', authMiddleware, geminiInit, async (req, res) => {
  try {
    // 1. Find child and latest analysis
    const child = await Child.findByAnyId(req.params.childId);
    if (!child) {
      return res.status(400).json({ error: 'Child profile not synced to server. Run an analysis first.' });
    }

    const latestAnalysis = await Analysis.findOne({ childId: String(child._id) })
      .sort({ createdAt: -1 });

    if (!latestAnalysis) {
      return res.status(404).json({ error: 'No analysis found for this child. Run an analysis first.' });
    }

    // 2. Mark old resources as not current
    await Resource.updateMany(
      { childId: String(child._id), isCurrent: true },
      { $set: { isCurrent: false } }
    );

    // 3. Generate new resources via Gemini
    const generatedResources = await geminiService.generateImprovementResources(child, latestAnalysis);

    // 4. Save new resources with isCurrent=true
    const resourceDocs = generatedResources.map(r => ({
      childId: String(child._id),
      analysisId: String(latestAnalysis._id),
      domain: r.domain,
      type: r.type,
      title: r.title,
      description: r.description,
      tags: r.tags,
      ageRange: r.ageRange,
      duration: r.duration,
      difficulty: r.difficulty,
      priority: r.priority,
      isCurrent: true,
    }));

    const savedResources = await Resource.insertMany(resourceDocs);

    res.json({
      count: savedResources.length,
      resources: savedResources,
    });
  } catch (error) {
    console.error('Resource regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate resources: ' + error.message });
  }
});

export default router;
