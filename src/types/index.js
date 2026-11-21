export const ROLES = {
  CITIZEN: 'CITIZEN',
  ADMIN: 'MUNICIPAL_ADMIN',
  WORKER: 'FIELD_WORKER'
};

export const CATEGORIES = {
  ROADS: 'Roads',
  WASTE: 'Waste',
  WATER: 'Water',
  ELECTRICITY: 'Electricity',
  TREES: 'Trees',
  DRAINAGE: 'Drainage',
  OTHER: 'Other'
};

export const DEPARTMENTS = {
  [CATEGORIES.ROADS]: 'Roads & Infrastructure (PWD)',
  [CATEGORIES.WASTE]: 'Solid Waste Management (SWM)',
  [CATEGORIES.WATER]: 'Water Supply & Sewerage Board (BWSSB)',
  [CATEGORIES.ELECTRICITY]: 'Electricity Supply Board (BESCOM)',
  [CATEGORIES.TREES]: 'Forest & Horticulture Department',
  [CATEGORIES.DRAINAGE]: 'Stormwater Drainage Department',
  [CATEGORIES.OTHER]: 'General Municipal Grievance Cell'
};

export const SEVERITIES = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export const SAFETY_BASE_SCORES = {
  [SEVERITIES.CRITICAL]: 4,
  [SEVERITIES.HIGH]: 3,
  [SEVERITIES.MEDIUM]: 2,
  [SEVERITIES.LOW]: 1
};

export const STATUSES = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  AWAITING_VERIFICATION: 'Awaiting Verification',
  RESOLVED: 'Resolved'
};

export const STATUS_STEPS = [
  { key: STATUSES.SUBMITTED, label: 'Submitted', description: 'Complaint received and logged in civic registry' },
  { key: STATUSES.UNDER_REVIEW, label: 'Under Review', description: 'Triage complete; awaiting department dispatch' },
  { key: STATUSES.ASSIGNED, label: 'Assigned', description: 'Assigned to field worker for on-site inspection' },
  { key: STATUSES.IN_PROGRESS, label: 'In Progress', description: 'Field crew mobilized and repairs underway' },
  { key: STATUSES.AWAITING_VERIFICATION, label: 'Awaiting Verification', description: 'Field work completed; awaiting admin inspection' },
  { key: STATUSES.RESOLVED, label: 'Resolved', description: 'Inspected and verified closed by municipal authority' }
];

export const LANGUAGES = [
  { code: 'en-IN', name: 'English', native: 'English (India)', speechSupported: true },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', speechSupported: true },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', speechSupported: true },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', speechSupported: true },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', speechSupported: true },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', speechSupported: true },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', speechSupported: true },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', speechSupported: true }
];

export const DEMO_WORKERS = [
  {
    id: 'WRK-101',
    name: 'Suresh Kumar',
    department: DEPARTMENTS[CATEGORIES.ROADS],
    category: CATEGORIES.ROADS,
    phone: '+91 98450 11223',
    zone: 'East Zone'
  },
  {
    id: 'WRK-102',
    name: 'Rajesh M. Swamy',
    department: DEPARTMENTS[CATEGORIES.ELECTRICITY],
    category: CATEGORIES.ELECTRICITY,
    phone: '+91 98450 22334',
    zone: 'North Zone'
  },
  {
    id: 'WRK-103',
    name: 'Priya Sharma',
    department: DEPARTMENTS[CATEGORIES.WASTE],
    category: CATEGORIES.WASTE,
    phone: '+91 98450 33445',
    zone: 'Central Zone'
  },
  {
    id: 'WRK-104',
    name: 'Anand Gowda',
    department: DEPARTMENTS[CATEGORIES.WATER],
    category: CATEGORIES.WATER,
    phone: '+91 98450 44556',
    zone: 'South Zone'
  },
  {
    id: 'WRK-105',
    name: 'Venkatesh Babu',
    department: DEPARTMENTS[CATEGORIES.DRAINAGE],
    category: CATEGORIES.DRAINAGE,
    phone: '+91 98450 55667',
    zone: 'West Zone'
  },
  {
    id: 'WRK-106',
    name: 'Manjunath Reddy',
    department: DEPARTMENTS[CATEGORIES.TREES],
    category: CATEGORIES.TREES,
    phone: '+91 98450 66778',
    zone: 'East Zone'
  },
  {
    id: 'WRK-107',
    name: 'Lakshmi Narayan',
    department: DEPARTMENTS[CATEGORIES.OTHER],
    category: CATEGORIES.OTHER,
    phone: '+91 98450 77889',
    zone: 'Central Zone'
  }
];

export const DEMO_LOCATIONS = [
  '12th Main Road, Indiranagar, Bengaluru',
  'Near 4th Cross Bus Stop, 8th Main, Malleshwaram',
  'Commercial Street Lane 2, Tasker Town',
  '100ft Road near 12th Cross, HAL 2nd Stage, Indiranagar',
  'Outer Ring Road Service Road, Bellandur',
  'Koramangala 5th Block near Regional Park',
  'MG Road near Brigade Road Junction',
  'Jayanagar 4th Block Complex, 11th Main',
  'Whitefield Main Road near Hope Farm Circle'
];
