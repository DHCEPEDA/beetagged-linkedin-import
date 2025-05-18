/**
 * Sample data for demonstration purposes
 * In production, this would be replaced with real data from the social APIs
 */

// Sample contacts with rich metadata for tagging
const sampleContacts = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '512-555-1234',
    source: 'facebook',
    sourceId: 'fb_12345',
    profileUrl: 'https://facebook.com/alex.johnson',
    profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
    metadata: {
      location: 'Austin, TX',
      company: 'Dell Technologies',
      position: 'Software Engineer',
      education: [
        {
          school: 'University of Texas',
          degree: 'Computer Science',
          year: '2018'
        }
      ],
      interests: ['Basketball', 'Hiking', 'Photography'],
      skills: ['JavaScript', 'React', 'Node.js']
    },
    tags: [
      { name: 'location:Austin, TX', type: 'location', source: 'facebook' },
      { name: 'company:Dell Technologies', type: 'company', source: 'facebook' },
      { name: 'interest:Basketball', type: 'interest', source: 'facebook' },
      { name: 'skill:JavaScript', type: 'skill', source: 'facebook' }
    ],
    lastSynced: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Samantha Lee',
    email: 'samantha.lee@example.com',
    phone: '713-555-3456',
    source: 'linkedin',
    sourceId: 'li_67890',
    profileUrl: 'https://linkedin.com/in/samantha-lee',
    profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
    metadata: {
      location: 'Houston, TX',
      company: 'Microsoft',
      position: 'UX Designer',
      education: [
        {
          school: 'Rice University',
          degree: 'Graphic Design',
          year: '2019'
        }
      ],
      interests: ['Design', 'Travel', 'Photography'],
      skills: ['UI/UX', 'Figma', 'User Research']
    },
    tags: [
      { name: 'location:Houston, TX', type: 'location', source: 'linkedin' },
      { name: 'company:Microsoft', type: 'company', source: 'linkedin' },
      { name: 'interest:Design', type: 'interest', source: 'linkedin' },
      { name: 'skill:UI/UX', type: 'skill', source: 'linkedin' }
    ],
    lastSynced: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '214-555-6789',
    source: 'facebook',
    sourceId: 'fb_24680',
    profileUrl: 'https://facebook.com/michael.chen',
    profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg',
    metadata: {
      location: 'Dallas, TX',
      company: 'Amazon',
      position: 'Product Manager',
      education: [
        {
          school: 'Southern Methodist University',
          degree: 'Business Administration',
          year: '2017'
        }
      ],
      interests: ['Basketball', 'Running', 'Cooking'],
      skills: ['Product Management', 'Agile', 'Data Analysis']
    },
    tags: [
      { name: 'location:Dallas, TX', type: 'location', source: 'facebook' },
      { name: 'company:Amazon', type: 'company', source: 'facebook' },
      { name: 'interest:Basketball', type: 'interest', source: 'facebook' },
      { name: 'skill:Product Management', type: 'skill', source: 'facebook' }
    ],
    lastSynced: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    phone: '210-555-9012',
    source: 'linkedin',
    sourceId: 'li_13579',
    profileUrl: 'https://linkedin.com/in/emily-rodriguez',
    profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg',
    metadata: {
      location: 'San Antonio, TX',
      company: 'USAA',
      position: 'Marketing Specialist',
      education: [
        {
          school: 'UTSA',
          degree: 'Marketing',
          year: '2020'
        }
      ],
      interests: ['Marketing', 'Social Media', 'Travel'],
      skills: ['Content Creation', 'SEO', 'Social Media Management']
    },
    tags: [
      { name: 'location:San Antonio, TX', type: 'location', source: 'linkedin' },
      { name: 'company:USAA', type: 'company', source: 'linkedin' },
      { name: 'interest:Marketing', type: 'interest', source: 'linkedin' },
      { name: 'skill:Content Creation', type: 'skill', source: 'linkedin' }
    ],
    lastSynced: new Date().toISOString()
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '469-555-3456',
    source: 'facebook',
    sourceId: 'fb_11223',
    profileUrl: 'https://facebook.com/david.wilson',
    profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg',
    metadata: {
      location: 'Plano, TX',
      company: 'Toyota',
      position: 'Systems Analyst',
      education: [
        {
          school: 'UT Dallas',
          degree: 'Information Systems',
          year: '2016'
        }
      ],
      interests: ['Cars', 'Technology', 'Travel'],
      skills: ['SQL', 'Python', 'Data Visualization']
    },
    tags: [
      { name: 'location:Plano, TX', type: 'location', source: 'facebook' },
      { name: 'company:Toyota', type: 'company', source: 'facebook' },
      { name: 'interest:Cars', type: 'interest', source: 'facebook' },
      { name: 'skill:Python', type: 'skill', source: 'facebook' }
    ],
    lastSynced: new Date().toISOString()
  }
];

// Popular tags extracted from all contacts
const popularTags = [
  { name: 'location:Austin, TX', count: 15, type: 'location' },
  { name: 'location:Houston, TX', count: 12, type: 'location' },
  { name: 'location:Dallas, TX', count: 10, type: 'location' },
  { name: 'company:Dell Technologies', count: 8, type: 'company' },
  { name: 'company:Microsoft', count: 7, type: 'company' },
  { name: 'company:Amazon', count: 6, type: 'company' },
  { name: 'interest:Basketball', count: 14, type: 'interest' },
  { name: 'interest:Travel', count: 12, type: 'interest' },
  { name: 'interest:Photography', count: 9, type: 'interest' },
  { name: 'skill:JavaScript', count: 11, type: 'skill' },
  { name: 'skill:Python', count: 10, type: 'skill' },
  { name: 'skill:UI/UX', count: 8, type: 'skill' }
];