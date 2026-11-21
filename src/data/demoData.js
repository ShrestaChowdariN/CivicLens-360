import { CATEGORIES, DEPARTMENTS, SEVERITIES, STATUSES, DEMO_WORKERS } from '../types';
import { calculatePriorityScore, calculateCommunityBonus, generatePriorityExplanation } from '../services/communityGrouping';

export const INITIAL_DEMO_DATA = () => {
  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();

  // Tickets (Explicitly marked isDemo: true)
  const tickets = [
    // 1. Multiple Pothole reports at same location (Indiranagar 12th Main)
    {
      id: 'TKT-2026-001',
      complaintText: 'Huge deep pothole near 12th Main Road, Indiranagar. Two-wheelers are skidding and nearly crashing every evening during traffic rush.',
      language: 'en-IN',
      category: CATEGORIES.ROADS,
      department: DEPARTMENTS[CATEGORIES.ROADS],
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Severe road surface degradation causing vehicular skid hazard.',
      location: '12th Main Road, Indiranagar, Bengaluru',
      coordinates: { lat: 12.9719, lng: 77.6412 },
      status: STATUSES.ASSIGNED,
      photo: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      createdAt: hoursAgo(18),
      masterIssueId: 'ISS-2026-1001',
      matchedKeyword: 'pothole',
      isDemo: true,
      origin: 'demo'
    },
    {
      id: 'TKT-2026-002',
      complaintText: 'ಇಂದಿರಾನಗರ 12ನೇ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ, ವಾಹನ ಸವಾರರಿಗೆ ತೊಂದರೆ ಆಗುತ್ತಿದೆ.',
      language: 'kn-IN',
      category: CATEGORIES.ROADS,
      department: DEPARTMENTS[CATEGORIES.ROADS],
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Road hazard in Kannada intake confirmed (ಗುಂಡಿ match).',
      location: '12th Main Road, Indiranagar, Bengaluru',
      coordinates: { lat: 12.9721, lng: 77.6415 },
      status: STATUSES.ASSIGNED,
      photo: null,
      createdAt: hoursAgo(12),
      masterIssueId: 'ISS-2026-1001',
      matchedKeyword: 'ಗುಂಡಿ',
      isDemo: true,
      origin: 'demo'
    },
    {
      id: 'TKT-2026-003',
      complaintText: '12th मेन रोड इंदिरानगर में बहुत गहरा गड्ढा है, पानी भर गया है और गाड़ियां फंस रही हैं।',
      language: 'hi-IN',
      category: CATEGORIES.ROADS,
      department: DEPARTMENTS[CATEGORIES.ROADS],
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Road surface cavity in Hindi intake confirmed (गड्ढा match).',
      location: '12th Main Road, Indiranagar, Bengaluru',
      coordinates: { lat: 12.9718, lng: 77.6410 },
      status: STATUSES.ASSIGNED,
      photo: null,
      createdAt: hoursAgo(6),
      masterIssueId: 'ISS-2026-1001',
      matchedKeyword: 'गड्ढा',
      isDemo: true,
      origin: 'demo'
    },

    // 2. Single Life-Threatening Exposed Wire (Malleshwaram) - Must be Critical #1
    {
      id: 'TKT-2026-004',
      complaintText: 'Near 4th Cross Bus Stop, 8th Main, Malleshwaram: An exposed live wire is dangling from the electric pole and sparking violently over the pedestrian walkway! Immediate electrocution risk!',
      language: 'en-IN',
      category: CATEGORIES.ELECTRICITY,
      department: DEPARTMENTS[CATEGORIES.ELECTRICITY],
      severity: SEVERITIES.CRITICAL,
      severityReason: 'Critical Safety Hazard: Detected life-threatening condition ("exposed wire") requiring immediate emergency response within 2 hours.',
      location: 'Near 4th Cross Bus Stop, 8th Main, Malleshwaram',
      coordinates: { lat: 13.0037, lng: 77.5685 },
      status: STATUSES.UNDER_REVIEW,
      photo: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=80',
      createdAt: hoursAgo(1),
      masterIssueId: 'ISS-2026-1002',
      matchedKeyword: 'exposed wire',
      isDemo: true,
      origin: 'demo'
    },

    // 3. Broken Streetlight (Bellandur) - In Progress by Worker
    {
      id: 'TKT-2026-005',
      complaintText: 'Outer Ring Road Service Road, Bellandur: Streetlight pole #42 has been non-functional for 2 weeks. Total darkness poses pedestrian safety risks.',
      language: 'en-IN',
      category: CATEGORIES.ELECTRICITY,
      department: DEPARTMENTS[CATEGORIES.ELECTRICITY],
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Streetlight outage impacting nocturnal neighborhood safety.',
      location: 'Outer Ring Road Service Road, Bellandur',
      coordinates: { lat: 12.9260, lng: 77.6762 },
      status: STATUSES.IN_PROGRESS,
      photo: null,
      createdAt: hoursAgo(30),
      masterIssueId: 'ISS-2026-1003',
      matchedKeyword: 'streetlight',
      isDemo: true,
      origin: 'demo'
    },

    // 4. Clean Water Leakage (HAL 2nd Stage) - Awaiting Verification
    {
      id: 'TKT-2026-006',
      complaintText: '100ft Road near 12th Cross, HAL 2nd Stage: Clean potable drinking water pipe burst, thousands of liters wasting on road since 4 AM.',
      language: 'en-IN',
      category: CATEGORIES.WATER,
      department: DEPARTMENTS[CATEGORIES.WATER],
      severity: SEVERITIES.HIGH,
      severityReason: 'High Impact: Severe operational disruption detected ("pipe burst") wasting civic drinking water supply.',
      location: '100ft Road near 12th Cross, HAL 2nd Stage, Indiranagar',
      coordinates: { lat: 12.9658, lng: 77.6439 },
      status: STATUSES.AWAITING_VERIFICATION,
      photo: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
      createdAt: hoursAgo(24),
      masterIssueId: 'ISS-2026-1004',
      matchedKeyword: 'pipe burst',
      isDemo: true,
      origin: 'demo'
    },

    // 5. Drainage Blockage (Koramangala) - Resolved
    {
      id: 'TKT-2026-007',
      complaintText: 'Koramangala 5th Block near Regional Park: Stormwater drain completely choked with silt and trash, foul black water spilling onto walking track.',
      language: 'en-IN',
      category: CATEGORIES.DRAINAGE,
      department: DEPARTMENTS[CATEGORIES.DRAINAGE],
      severity: SEVERITIES.HIGH,
      severityReason: 'High Impact: Severe sewage overflow impacting residential sanitary conditions.',
      location: 'Koramangala 5th Block near Regional Park',
      coordinates: { lat: 12.9352, lng: 77.6245 },
      status: STATUSES.RESOLVED,
      photo: null,
      createdAt: hoursAgo(48),
      masterIssueId: 'ISS-2026-1005',
      matchedKeyword: 'drain',
      isDemo: true,
      origin: 'demo'
    },

    // 6. Garbage Overflow (Commercial Street)
    {
      id: 'TKT-2026-008',
      complaintText: 'Commercial Street Lane 2, Tasker Town: Massive dump of rotting garbage and plastic bags overflowing from roadside bin, severe foul stench.',
      language: 'en-IN',
      category: CATEGORIES.WASTE,
      department: DEPARTMENTS[CATEGORIES.WASTE],
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Uncollected solid waste causing public nuisance and stench.',
      location: 'Commercial Street Lane 2, Tasker Town',
      coordinates: { lat: 12.9822, lng: 77.6083 },
      status: STATUSES.UNDER_REVIEW,
      photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
      createdAt: hoursAgo(8),
      masterIssueId: 'ISS-2026-1006',
      matchedKeyword: 'garbage',
      isDemo: true,
      origin: 'demo'
    },

    // 7. Fallen Tree (MG Road)
    {
      id: 'TKT-2026-009',
      complaintText: 'MG Road near Brigade Road Junction: Large bough snapped off old Gulmohar tree during thunderstorm, obstructing bus lane.',
      language: 'en-IN',
      category: CATEGORIES.TREES,
      department: DEPARTMENTS[CATEGORIES.TREES],
      severity: SEVERITIES.HIGH,
      severityReason: 'High Impact: Severe disruption blocking arterial traffic lane.',
      location: 'MG Road near Brigade Road Junction',
      coordinates: { lat: 12.9740, lng: 77.6075 },
      status: STATUSES.ASSIGNED,
      photo: null,
      createdAt: hoursAgo(14),
      masterIssueId: 'ISS-2026-1007',
      matchedKeyword: 'fallen tree',
      isDemo: true,
      origin: 'demo'
    }
  ];

  // Grouped Master Issues (Explicitly marked isDemo: true)
  const masterIssues = [
    // 1. Grouped Potholes (3 linked tickets -> +1 Community Bonus)
    {
      id: 'ISS-2026-1001',
      title: 'Roads: Multiple deep potholes on 12th Main Road',
      summary: 'Recurring pothole craters reported by multiple citizens in English, Kannada and Hindi, creating hazardous driving conditions for two-wheelers.',
      category: CATEGORIES.ROADS,
      department: DEPARTMENTS[CATEGORIES.ROADS],
      location: '12th Main Road, Indiranagar, Bengaluru',
      coordinates: { lat: 12.9719, lng: 77.6412 },
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Severe road surface degradation causing vehicular skid hazard.',
      reportCount: 3,
      communityBonus: 1, // 2-4 reports = +1
      priorityScore: calculatePriorityScore(SEVERITIES.MEDIUM, 3), // (2 * 10) + 1 = 21
      priorityExplanation: generatePriorityExplanation(SEVERITIES.MEDIUM, 3, 1, '12th Main Road, Indiranagar'),
      status: STATUSES.ASSIGNED,
      linkedTicketIds: ['TKT-2026-001', 'TKT-2026-002', 'TKT-2026-003'],
      assignedWorkerId: 'WRK-101',
      assignedWorkerName: 'Suresh Kumar',
      assignedWorkerPhone: '+91 98450 11223',
      assignedWorkerDepartment: DEPARTMENTS[CATEGORIES.ROADS],
      workerNotes: 'Asphalt cold-mix batch scheduled for evening shift dispatch.',
      completionPhoto: null,
      firstReportedAt: hoursAgo(18),
      lastReportAt: hoursAgo(6),
      updatedAt: hoursAgo(4),
      matchedKeyword: 'pothole',
      isDemo: true
    },

    // 2. Critical Exposed Wire (1 report, but CRITICAL -> Score 40!)
    {
      id: 'ISS-2026-1002',
      title: 'Electricity: Exposed live wire sparking near Bus Stop',
      summary: 'Dangling live cable near pedestrian pavement sparking continuously. Extreme electrocution hazard.',
      category: CATEGORIES.ELECTRICITY,
      department: DEPARTMENTS[CATEGORIES.ELECTRICITY],
      location: 'Near 4th Cross Bus Stop, 8th Main, Malleshwaram',
      coordinates: { lat: 13.0037, lng: 77.5685 },
      severity: SEVERITIES.CRITICAL,
      severityReason: 'Critical Safety Hazard: Detected life-threatening condition ("exposed wire") requiring immediate emergency response within 2 hours.',
      reportCount: 1,
      communityBonus: 0, // 1 report = 0 bonus
      priorityScore: calculatePriorityScore(SEVERITIES.CRITICAL, 1), // (4 * 10) + 0 = 40 (Top rank!)
      priorityExplanation: generatePriorityExplanation(SEVERITIES.CRITICAL, 1, 0, 'Malleshwaram 4th Cross'),
      status: STATUSES.UNDER_REVIEW,
      linkedTicketIds: ['TKT-2026-004'],
      assignedWorkerId: null,
      assignedWorkerName: null,
      assignedWorkerPhone: null,
      assignedWorkerDepartment: null,
      workerNotes: null,
      completionPhoto: null,
      firstReportedAt: hoursAgo(1),
      lastReportAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
      matchedKeyword: 'exposed wire',
      isDemo: true
    },

    // 3. Broken Streetlight (In Progress)
    {
      id: 'ISS-2026-1003',
      title: 'Electricity: Broken Streetlight pole #42',
      summary: 'Streetlight pole dark for 2 weeks on busy ORR service road.',
      category: CATEGORIES.ELECTRICITY,
      department: DEPARTMENTS[CATEGORIES.ELECTRICITY],
      location: 'Outer Ring Road Service Road, Bellandur',
      coordinates: { lat: 12.9260, lng: 77.6762 },
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Streetlight outage impacting nocturnal neighborhood safety.',
      reportCount: 1,
      communityBonus: 0,
      priorityScore: calculatePriorityScore(SEVERITIES.MEDIUM, 1), // (2 * 10) + 0 = 20
      priorityExplanation: generatePriorityExplanation(SEVERITIES.MEDIUM, 1, 0, 'Bellandur ORR'),
      status: STATUSES.IN_PROGRESS,
      linkedTicketIds: ['TKT-2026-005'],
      assignedWorkerId: 'WRK-102',
      assignedWorkerName: 'Rajesh M. Swamy',
      assignedWorkerPhone: '+91 98450 22334',
      assignedWorkerDepartment: DEPARTMENTS[CATEGORIES.ELECTRICITY],
      workerNotes: 'Lineman on site replacing burnt LED luminaire driver.',
      completionPhoto: null,
      firstReportedAt: hoursAgo(30),
      lastReportAt: hoursAgo(30),
      updatedAt: hoursAgo(2),
      matchedKeyword: 'streetlight',
      isDemo: true
    },

    // 4. Water Leakage (Awaiting Verification by Admin)
    {
      id: 'ISS-2026-1004',
      title: 'Water: Main distribution pipe burst on 100ft Road',
      summary: 'Potable water supply pipe fracture flooding 100ft road corridor.',
      category: CATEGORIES.WATER,
      department: DEPARTMENTS[CATEGORIES.WATER],
      location: '100ft Road near 12th Cross, HAL 2nd Stage, Indiranagar',
      coordinates: { lat: 12.9658, lng: 77.6439 },
      severity: SEVERITIES.HIGH,
      severityReason: 'High Impact: Severe operational disruption detected ("pipe burst") wasting civic drinking water supply.',
      reportCount: 1,
      communityBonus: 0,
      priorityScore: calculatePriorityScore(SEVERITIES.HIGH, 1), // (3 * 10) + 0 = 30
      priorityExplanation: generatePriorityExplanation(SEVERITIES.HIGH, 1, 0, '100ft Road HAL'),
      status: STATUSES.AWAITING_VERIFICATION,
      linkedTicketIds: ['TKT-2026-006'],
      assignedWorkerId: 'WRK-104',
      assignedWorkerName: 'Anand Gowda',
      assignedWorkerPhone: '+91 98450 44556',
      assignedWorkerDepartment: DEPARTMENTS[CATEGORIES.WATER],
      workerNotes: 'Pipeline clamp welded and pressure tested at 4.2 bar. Road excavation backfilled with gravel.',
      completionPhoto: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80',
      firstReportedAt: hoursAgo(24),
      lastReportAt: hoursAgo(24),
      completedAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      matchedKeyword: 'pipe burst',
      isDemo: true
    },

    // 5. Drainage Blockage (Resolved)
    {
      id: 'ISS-2026-1005',
      title: 'Drainage: Silt blockage and overflow at Regional Park',
      summary: 'Stormwater canal clogged with solid debris spilling sewage on recreational walking track.',
      category: CATEGORIES.DRAINAGE,
      department: DEPARTMENTS[CATEGORIES.DRAINAGE],
      location: 'Koramangala 5th Block near Regional Park',
      coordinates: { lat: 12.9352, lng: 77.6245 },
      severity: SEVERITIES.HIGH,
      severityReason: 'High Impact: Severe sewage overflow impacting residential sanitary conditions.',
      reportCount: 1,
      communityBonus: 0,
      priorityScore: calculatePriorityScore(SEVERITIES.HIGH, 1), // 30
      priorityExplanation: generatePriorityExplanation(SEVERITIES.HIGH, 1, 0, 'Koramangala 5th Block'),
      status: STATUSES.RESOLVED,
      linkedTicketIds: ['TKT-2026-007'],
      assignedWorkerId: 'WRK-105',
      assignedWorkerName: 'Venkatesh Babu',
      assignedWorkerPhone: '+91 98450 55667',
      assignedWorkerDepartment: DEPARTMENTS[CATEGORIES.DRAINAGE],
      workerNotes: 'Mechanical desilter deployed. 15m culvert cleared.',
      adminVerificationNotes: 'Inspected by Assistant Executive Engineer (Drainage). Satisfactory flow restored and sanitation disinfected.',
      firstReportedAt: hoursAgo(48),
      lastReportAt: hoursAgo(48),
      resolvedAt: hoursAgo(10),
      updatedAt: hoursAgo(10),
      matchedKeyword: 'drain',
      isDemo: true
    },

    // 6. Garbage Overflow (Under Review)
    {
      id: 'ISS-2026-1006',
      title: 'Waste: Overflowing garbage dump on Commercial Street',
      summary: 'Commercial waste accumulator bin overflowing into commercial pedestrian lane.',
      category: CATEGORIES.WASTE,
      department: DEPARTMENTS[CATEGORIES.WASTE],
      location: 'Commercial Street Lane 2, Tasker Town',
      coordinates: { lat: 12.9822, lng: 77.6083 },
      severity: SEVERITIES.MEDIUM,
      severityReason: 'Medium Impact: Uncollected solid waste causing public nuisance and stench.',
      reportCount: 1,
      communityBonus: 0,
      priorityScore: calculatePriorityScore(SEVERITIES.MEDIUM, 1), // 20
      priorityExplanation: generatePriorityExplanation(SEVERITIES.MEDIUM, 1, 0, 'Commercial Street'),
      status: STATUSES.UNDER_REVIEW,
      linkedTicketIds: ['TKT-2026-008'],
      assignedWorkerId: null,
      assignedWorkerName: null,
      firstReportedAt: hoursAgo(8),
      lastReportAt: hoursAgo(8),
      updatedAt: hoursAgo(8),
      matchedKeyword: 'garbage',
      isDemo: true
    },

    // 7. Fallen Tree Branch (Assigned)
    {
      id: 'ISS-2026-1007',
      title: 'Trees: Snapped Gulmohar branch obstructing traffic',
      summary: 'Heavy tree limb blocking outer traffic lane on MG Road.',
      category: CATEGORIES.TREES,
      department: DEPARTMENTS[CATEGORIES.TREES],
      location: 'MG Road near Brigade Road Junction',
      coordinates: { lat: 12.9740, lng: 77.6075 },
      severity: SEVERITIES.HIGH,
      severityReason: 'High Impact: Severe disruption blocking arterial traffic lane.',
      reportCount: 1,
      communityBonus: 0,
      priorityScore: calculatePriorityScore(SEVERITIES.HIGH, 1), // 30
      priorityExplanation: generatePriorityExplanation(SEVERITIES.HIGH, 1, 0, 'MG Road'),
      status: STATUSES.ASSIGNED,
      linkedTicketIds: ['TKT-2026-009'],
      assignedWorkerId: 'WRK-106',
      assignedWorkerName: 'Manjunath Reddy',
      assignedWorkerPhone: '+91 98450 66778',
      assignedWorkerDepartment: DEPARTMENTS[CATEGORIES.TREES],
      workerNotes: 'Horticulture chainsaw unit dispatched to clear obstruction.',
      firstReportedAt: hoursAgo(14),
      lastReportAt: hoursAgo(14),
      updatedAt: hoursAgo(6),
      matchedKeyword: 'fallen tree',
      isDemo: true
    }
  ];

  return { tickets, masterIssues };
};
