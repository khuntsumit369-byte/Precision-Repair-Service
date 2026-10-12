import { CatalogItem, Customer, ExpenseRecord, Invoice, PaymentRecord, PurchaseRecord, WorkshopSettings, UnitMasterItem, SupplierClient, StaffMember } from '../types';

export const INITIAL_SETTINGS: WorkshopSettings = {
  workshopName: 'PRECISION REPAIR SERVICE',
  workshopNameGu: 'પ્રિસિઝન રિપેર સર્વિસ (PRECISION REPAIR SERVICE)',
  tagline: 'Micromotors, Controllers & Dental Handpiece Repair Specialists',
  ownerName: 'Sumit Patel',
  phone: '+91 98765 43210',
  altPhone: '+91 98250 12345',
  email: 'service@precisionrepair.com',
  address: 'Shop No. 12, Soni Bazar, Gold Complex, Near Tower',
  city: 'Rajkot - 360001, Gujarat',
  gstin: '24AAAAA0000A1Z5',
  logoUrl: '/logo.png',
  terms: [
    'Unit tracking code sticker is affixed on each machine for service identification.',
    'Please inspect and verify the machine working at the time of delivery.',
    'Payment due on presentation of invoice.'
  ],
  defaultWarrantyDays: 0,
  currencySymbol: '₹',
};

export const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: 'item-brg-01',
    code: 'PRT-BRG-70',
    name: 'Bearing',
    nameGu: 'બેરિંગ',
    type: 'part',
    salePrice: 70,
    costPrice: 42,
    stock: 85,
    unit: 'pcs',
    category: 'Mechanical Spare Parts'
  },
  {
    id: 'item-msf-01',
    code: 'PRT-MSF-80',
    name: 'MOSFET',
    nameGu: 'મોસ્ફેટ (ટ્રાન્ઝિસ્ટર)',
    type: 'part',
    salePrice: 80,
    costPrice: 48,
    stock: 50,
    unit: 'pcs',
    category: 'Electronic Components'
  },
  {
    id: 'item-cbl-01',
    code: 'PRT-CBL-250',
    name: 'Cable',
    nameGu: 'કેબલ / વાયર કોર્ડ',
    type: 'part',
    salePrice: 250,
    costPrice: 155,
    stock: 28,
    unit: 'pcs',
    category: 'Cables & Wires'
  },
  {
    id: 'item-cpl-01',
    code: 'PRT-CPL-40',
    name: 'Coupler',
    nameGu: 'કપ્લર',
    type: 'part',
    salePrice: 40,
    costPrice: 22,
    stock: 65,
    unit: 'pcs',
    category: 'Mechanical Spare Parts'
  },
  {
    id: 'item-sw-01',
    code: 'PRT-SW-30',
    name: 'Switch',
    nameGu: 'સ્વીચ',
    type: 'part',
    salePrice: 30,
    costPrice: 16,
    stock: 90,
    unit: 'pcs',
    category: 'Electrical Components'
  },
  {
    id: 'item-srv-hp',
    code: 'SRV-HP-200',
    name: 'Handpiece Service Charge',
    nameGu: 'હેન્ડપીસ સર્વિસ ચાર્જ',
    type: 'service',
    salePrice: 200,
    costPrice: 0,
    unit: 'job',
    category: 'Labor & Servicing'
  },
  {
    id: 'item-srv-mot',
    code: 'SRV-MOT-150',
    name: 'Motor Service Charge',
    nameGu: 'મોટર સર્વિસ ચાર્જ',
    type: 'service',
    salePrice: 150,
    costPrice: 0,
    unit: 'job',
    category: 'Labor & Servicing'
  },
  {
    id: 'item-cb-01',
    code: 'PRT-CB-90',
    name: 'Carbon Brush Set',
    nameGu: 'કાર્બન બ્રશ સેટ',
    type: 'part',
    salePrice: 90,
    costPrice: 50,
    stock: 45,
    unit: 'set',
    category: 'Mechanical Spare Parts'
  },
  {
    id: 'item-pcb-srv',
    code: 'SRV-PCB-350',
    name: 'PCB / Control Board Repair',
    nameGu: 'કંટ્રોલ બોર્ડ / પીસીબી રીપેરિંગ',
    type: 'service',
    salePrice: 350,
    costPrice: 0,
    unit: 'job',
    category: 'Labor & Servicing'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-govindji',
    name: 'Govindji Jewellers',
    contactPerson: 'Shree Govindbhai',
    phone: '+91 98242 11223',
    city: 'Rajkot',
    address: 'Near Palace Road, Gold Market',
    gstNumber: '24AABCG1234F1Z8',
    balanceDue: 0,
    totalInvoicesCount: 0,
    totalBilledAmount: 0
  },
  {
    id: 'cust-ambica',
    name: 'Ambica Ornaments',
    contactPerson: 'Hareshbhai',
    phone: '+91 99090 44556',
    city: 'Ahmedabad',
    address: 'Manek Chowk',
    balanceDue: 0,
    totalInvoicesCount: 0,
    totalBilledAmount: 0
  },
  {
    id: 'cust-shree-radhe',
    name: 'Radhe Jewellery Works',
    contactPerson: 'Pravinbhai',
    phone: '+91 97230 77889',
    city: 'Surat',
    address: 'Varachha Road',
    balanceDue: 0,
    totalInvoicesCount: 0,
    totalBilledAmount: 0
  }
];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_PAYMENTS: PaymentRecord[] = [];

export const INITIAL_PURCHASES: PurchaseRecord[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_UNIT_MASTERS: UnitMasterItem[] = [
  {
    id: 'um-hp',
    name: 'Dental Handpiece (હાઈ સ્પીડ / લો સ્પીડ હેન્ડપીસ)',
    nameGu: 'ડેન્ટલ હેન્ડપીસ',
    category: 'Dental Equipment',
    codePrefix: 'HP',
    defaultServiceCharge: 200,
    defaultWarrantyDays: 30,
    commonIssues: ['No rotation / Stuck head', 'Water blockage', 'Bearing noise & vibration', 'Burr loose slipping'],
    active: true,
  },
  {
    id: 'um-mot',
    name: 'Micro-Motor (માઇક્રો મોટર હેન્ડપીસ)',
    nameGu: 'માઇક્રો મોટર',
    category: 'Jewellery & Lab Micro-Tools',
    codePrefix: 'MOT',
    defaultServiceCharge: 150,
    defaultWarrantyDays: 30,
    commonIssues: ['Carbon brush worn out', 'Cable wire cut', 'Excessive heating', 'Speed fluctuation'],
    active: true,
  },
  {
    id: 'um-marathon',
    name: 'Marathon Controller Unit (મેરેથોન કંટ્રોલર બોક્સ)',
    nameGu: 'મેરેથોન કંટ્રોલ બોક્સ',
    category: 'Electronic Controllers',
    codePrefix: 'CTRL',
    defaultServiceCharge: 250,
    defaultWarrantyDays: 30,
    commonIssues: ['MOSFET short / blown fuse', 'Foot pedal not activating', 'Speed dial potentiometer faulty'],
    active: true,
  },
  {
    id: 'um-scaler',
    name: 'Ultrasonic Scaler (અલ્ટ્રાસોનિક સ્કેલર)',
    nameGu: 'અલ્ટ્રાસોનિક સ્કેલર',
    category: 'Dental Equipment',
    codePrefix: 'USC',
    defaultServiceCharge: 300,
    defaultWarrantyDays: 45,
    commonIssues: ['Handpiece transducer weak', 'No vibration output', 'Water leakage from connector'],
    active: true,
  },
  {
    id: 'um-polisher',
    name: 'Induction Polishing Motor (પોલિશિંગ મોટર)',
    nameGu: 'પોલિશિંગ મોટર',
    category: 'Jewellery Machinery',
    codePrefix: 'POL',
    defaultServiceCharge: 350,
    defaultWarrantyDays: 30,
    commonIssues: ['Shaft bearing jamming', 'Capacitor weak', 'Switch sparking'],
    active: true,
  },
];

export const INITIAL_SUPPLIERS: SupplierClient[] = [
  {
    id: 'sup-royal',
    name: 'Royal Spares Rajkot',
    contactPerson: 'Mansukhbhai Patel',
    phone: '+91 98250 88991',
    city: 'Rajkot',
    address: 'Shop No. 4, Lati Plot Main Road, Rajkot - 360003',
    gstNumber: '24AABFR1234F1Z9',
    category: 'Spare Parts Distributor',
    notes: 'Main vendor for micro-bearings, cables, and carbon brushes',
  },
  {
    id: 'sup-microtools',
    name: 'Gujarat Micro-Tools Depot',
    contactPerson: 'Ketan Shah',
    phone: '+91 98980 55442',
    city: 'Ahmedabad',
    address: 'Relief Road, Near Electricity House, Ahmedabad - 380001',
    gstNumber: '24AAACD9876D1Z2',
    category: 'Dental & Precision Importer',
    notes: 'NSK & Marathon compatible original spare parts',
  },
  {
    id: 'sup-elec',
    name: 'Shreeji Electronics & Components',
    contactPerson: 'Nileshbhai Vora',
    phone: '+91 94260 33221',
    city: 'Rajkot',
    address: 'Dhebar Road, Opp. ST Stand, Rajkot - 360002',
    gstNumber: '24AAJFS4455K1Z8',
    category: 'Electronic Components',
    notes: 'MOSFETs, capacitors, potentiometers, foot switches, and transformers',
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Ramesh Patel',
    nameGu: 'રમેશ પટેલ',
    phone: '+91 98790 12345',
    role: 'Senior Handpiece Technician (સીનિયર ટેકનિશિયન)',
    salary: 18000,
    salaryType: 'Monthly',
    joiningDate: '2025-01-10',
    active: true,
    address: 'Mavdi Plot, Rajkot',
    notes: 'Lead repair specialist for high-speed dental handpieces & micro-motors',
    createdAt: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'staff-2',
    name: 'Haresh Parmar',
    nameGu: 'હરેશ પરમાર',
    phone: '+91 98245 67890',
    role: 'Electronics & Controller Specialist (ઇલેક્ટ્રોનિક્સ)',
    salary: 15000,
    salaryType: 'Monthly',
    joiningDate: '2025-06-01',
    active: true,
    address: 'Kothariya Road, Rajkot',
    notes: 'Marathon box PCB, MOSFETs, and foot pedal specialist',
    createdAt: '2025-06-01T10:00:00.000Z',
  },
  {
    id: 'staff-3',
    name: 'Bharat Vaghela',
    nameGu: 'ભરત વાઘેલા',
    phone: '+91 94080 34567',
    role: 'Assistant Technician / Helper (આસિસ્ટન્ટ કારીગર)',
    salary: 9500,
    salaryType: 'Monthly',
    joiningDate: '2026-01-15',
    active: true,
    address: 'Aji Dam Ring Road, Rajkot',
    notes: 'Cleaning, ultrasonic parts wash, bearing assembly & dispatch',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
];



