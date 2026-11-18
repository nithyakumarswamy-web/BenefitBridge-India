import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, CitizenProfile, State, District, Scheme,
    SchemeTranslation, EligibilityRule, SchemeDocument,
    SchemeSource, AdminUser
)

# 28 States and 8 Union Territories of India
INDIAN_STATES_DATA = [
    {"name": "Karnataka", "code": "KA", "is_ut": False, "districts": ["Bengaluru Urban", "Bengaluru Rural", "Mandya", "Mysuru", "Belagavi", "Kalaburagi", "Shivamogga", "Tumakuru", "Udupi", "Dakshina Kannada", "Dharwad", "Hassan", "Bellary"]},
    {"name": "Maharashtra", "code": "MH", "is_ut": False, "districts": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur", "Solapur", "Amravati"]},
    {"name": "Tamil Nadu", "code": "TN", "is_ut": False, "districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thanjavur"]},
    {"name": "Telangana", "code": "TS", "is_ut": False, "districts": ["Hyderabad", "Ranga Reddy", "Medchal", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Nalgonda"]},
    {"name": "Andhra Pradesh", "code": "AP", "is_ut": False, "districts": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kadapa", "Anantapur"]},
    {"name": "Kerala", "code": "KL", "is_ut": False, "districts": ["Thiruvananthapuram", "Kochi (Ernakulam)", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Malappuram", "Kannur"]},
    {"name": "Uttar Pradesh", "code": "UP", "is_ut": False, "districts": ["Lucknow", "Varanasi", "Kanpur", "Agra", "Prayagraj", "Noida", "Ghaziabad", "Gorakhpur", "Meerut"]},
    {"name": "Madhya Pradesh", "code": "MP", "is_ut": False, "districts": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar"]},
    {"name": "Rajasthan", "code": "RJ", "is_ut": False, "districts": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"]},
    {"name": "Gujarat", "code": "GJ", "is_ut": False, "districts": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar"]},
    {"name": "West Bengal", "code": "WB", "is_ut": False, "districts": ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Darjeeling", "Siliguri"]},
    {"name": "Bihar", "code": "BR", "is_ut": False, "districts": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"]},
    {"name": "Punjab", "code": "PB", "is_ut": False, "districts": ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"]},
    {"name": "Haryana", "code": "HR", "is_ut": False, "districts": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar", "Rohtak"]},
    {"name": "Odisha", "code": "OD", "is_ut": False, "districts": ["Bhubaneswar (Khurdha)", "Cuttack", "Rourkela (Sundargarh)", "Puri", "Sambalpur"]},
    {"name": "Assam", "code": "AS", "is_ut": False, "districts": ["Guwahati (Kamrup Metro)", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"]},
    {"name": "Jharkhand", "code": "JH", "is_ut": False, "districts": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"]},
    {"name": "Chhattisgarh", "code": "CG", "is_ut": False, "districts": ["Raipur", "Bhilai (Durg)", "Bilaspur", "Korba"]},
    {"name": "Uttarakhand", "code": "UK", "is_ut": False, "districts": ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Haldwani"]},
    {"name": "Himachal Pradesh", "code": "HP", "is_ut": False, "districts": ["Shimla", "Dharamshala (Kangra)", "Mandi", "Solan", "Kullu"]},
    {"name": "Goa", "code": "GA", "is_ut": False, "districts": ["North Goa", "South Goa"]},
    {"name": "Tripura", "code": "TR", "is_ut": False, "districts": ["Agartala (West Tripura)", "Gomati", "Dhalai"]},
    {"name": "Meghalaya", "code": "ML", "is_ut": False, "districts": ["East Khasi Hills (Shillong)", "West Garo Hills"]},
    {"name": "Manipur", "code": "MN", "is_ut": False, "districts": ["Imphal West", "Imphal East", "Churachandpur"]},
    {"name": "Nagaland", "code": "NL", "is_ut": False, "districts": ["Kohima", "Dimapur", "Mokokchung"]},
    {"name": "Arunachal Pradesh", "code": "AR", "is_ut": False, "districts": ["Papum Pare (Itanagar)", "Changlang", "West Kameng"]},
    {"name": "Mizoram", "code": "MZ", "is_ut": False, "districts": ["Aizawl", "Lunglei", "Champhai"]},
    {"name": "Sikkim", "code": "SK", "is_ut": False, "districts": ["Gangtok", "Namchi", "Gyalshing"]},
    # Union Territories
    {"name": "Delhi (NCT)", "code": "DL", "is_ut": True, "districts": ["New Delhi", "Central Delhi", "South Delhi", "North Delhi", "East Delhi"]},
    {"name": "Jammu and Kashmir", "code": "JK", "is_ut": True, "districts": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"]},
    {"name": "Ladakh", "code": "LA", "is_ut": True, "districts": ["Leh", "Kargil"]},
    {"name": "Chandigarh", "code": "CH", "is_ut": True, "districts": ["Chandigarh"]},
    {"name": "Puducherry", "code": "PY", "is_ut": True, "districts": ["Puducherry", "Karaikal", "Mahe", "Yanam"]},
    {"name": "Andaman and Nicobar Islands", "code": "AN", "is_ut": True, "districts": ["South Andaman (Port Blair)", "North and Middle Andaman", "Nicobar"]},
    {"name": "Dadra and Nagar Haveli and Daman and Diu", "code": "DN", "is_ut": True, "districts": ["Daman", "Diu", "Dadra and Nagar Haveli"]},
    {"name": "Lakshadweep", "code": "LD", "is_ut": True, "districts": ["Kavaratti", "Agatti", "Andrott"]}
]

SCHEMES_DATA = [
    {
        "code": "PM-KISAN",
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "authority": "Ministry of Agriculture and Farmers Welfare, Govt. of India",
        "level": "Central",
        "applicable_state": "All",
        "category": "Agriculture",
        "target_beneficiaries": "Small and marginal farmer families with cultivable land holding",
        "short_description": "Income support scheme offering ₹6,000 per year directly to eligible farmer families across India in three equal four-monthly installments.",
        "full_description": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a central sector scheme with 100% funding from Government of India. It aims to supplement the financial needs of the Small and Marginal Farmers (SMFs) in procuring various inputs to ensure proper crop health and appropriate yields, commensurate with the anticipated farm income at the end of each crop cycle.",
        "benefits": "₹6,000 per year transferred directly to bank account in 3 installments of ₹2,000 each (via DBT).",
        "financial_benefit_amount": 6000.0,
        "application_procedure": "Apply online at pmkisan.gov.in under 'Farmers Corner' -> 'New Farmer Registration', or visit the nearest Common Service Centre (CSC) with land records and Aadhaar.",
        "important_conditions": "Institutional landholders, constitutional post holders, and serving or retired government employees or income tax payers are not eligible.",
        "official_apply_url": "https://pmkisan.gov.in/",
        "official_source_url": "https://pmkisan.gov.in/Documents/Revised_Guidelines_PMKISAN.pdf",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "occupation", "operator": "eq", "value": "Farmer", "description": "Applicant must be a Farmer", "is_mandatory": True},
            {"field": "land_holding_acres", "operator": "gte", "value": "0.1", "description": "Must hold cultivable land", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Aadhaar Card", "description": "Mandatory identity proof linked with mobile number", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "Land Record (Pahani / RTC / Khatauni)", "description": "Proof of ownership of agricultural land in applicant's name", "is_mandatory": True, "issuing_authority": "Revenue Department"},
            {"document_name": "Bank Account Passbook", "description": "Aadhaar-seeded bank account for Direct Benefit Transfer (DBT)", "is_mandatory": True, "issuing_authority": "Bank"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ (ಪಿಎಂ-ಕಿಸಾನ್)",
                "short_description": "ಅರ್ಹ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವರ್ಷಕ್ಕೆ ₹6,000 ಆರ್ಥಿಕ ನೆರವು ನೀಡುವ ಕೇಂದ್ರ ಸರ್ಕಾರದ ಪ್ರಮುಖ ಯೋಜನೆ.",
                "benefits": "ವರ್ಷಕ್ಕೆ ₹6,000 (ತಲಾ ₹2,000 ರಂತೆ 3 ಕಂತುಗಳಲ್ಲಿ) ನೇರ ನಗದು ವರ್ಗಾವಣೆ (DBT).",
                "application_procedure": "pmkisan.gov.in ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅಥವಾ ಗ್ರಾಮ ಒನ್ / ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರದಲ್ಲಿ ಆಧಾರ್ ಮತ್ತು ಪಹಣಿ (RTC) ಯೊಂದಿಗೆ ನೋಂದಾಯಿಸಿ."
            },
            {
                "language": "hi",
                "name": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
                "short_description": "पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता प्रदान करने वाली केंद्रीय योजना।",
                "benefits": "प्रति वर्ष ₹6,000, 3 समान किस्तों में सीधे बैंक खाते में (डीबीटी द्वारा)।",
                "application_procedure": "pmkisan.gov.in पर जाएं या नजदीकी सीएससी केंद्र पर आधार और भू-अभिलेख के साथ आवेदन करें।"
            }
        ]
    },
    {
        "code": "PM-JAY",
        "name": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "authority": "National Health Authority, Ministry of Health and Family Welfare",
        "level": "Central",
        "applicable_state": "All",
        "category": "Healthcare",
        "target_beneficiaries": "Bottom 40% vulnerable and low-income population identified by SECC / Ration Card",
        "short_description": "World's largest government-funded health assurance scheme, providing ₹5 Lakh per family per year for secondary and tertiary care hospitalization.",
        "full_description": "Ayushman Bharat PM-JAY is a flagship scheme of Government of India launched to achieve Universal Health Coverage (UHC). It provides cashless coverage of up to INR 5,00,000 per family per year for secondary and tertiary healthcare conditions across empanelled public and private hospitals in India.",
        "benefits": "Up to ₹5,00,000 per family per year cashless treatment at empanelled public and private hospitals across India.",
        "financial_benefit_amount": 500000.0,
        "application_procedure": "Check eligibility at beneficiary.nha.gov.in or visit any empanelled hospital / CSC center with Aadhaar and Ration Card to generate Ayushman Card.",
        "important_conditions": "Covers pre-existing conditions from day one. No cap on family size or age.",
        "official_apply_url": "https://beneficiary.nha.gov.in/",
        "official_source_url": "https://nha.gov.in/PM-JAY",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "annual_family_income", "operator": "lte", "value": "250000", "description": "Annual household income within ₹2.5 Lakh limit", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Aadhaar Card", "description": "Biometric identity verification", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "Ration Card / Family ID", "description": "Proof of family membership and economic classification", "is_mandatory": True, "issuing_authority": "Food and Civil Supplies Dept"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ - ಪ್ರಧಾನ ಮಂತ್ರಿ ಜನ ಆರೋಗ್ಯ ಯೋಜನೆ (PM-JAY)",
                "short_description": "ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವಾರ್ಷಿಕ ₹5 ಲಕ್ಷದವರೆಗೆ ಉಚಿತ ನಗದುರಹಿತ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸೆ ನೀಡುವ ಯೋಜನೆ.",
                "benefits": "ವಾರ್ಷಿಕ ₹5,00,000 ವರೆಗೆ ಉಚಿತ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸಾ ವಿಮೆ (ಸರ್ಕಾರಿ ಹಾಗೂ ನೋಂದಾಯಿತ ಖಾಸಗಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ).",
                "application_procedure": "beneficiary.nha.gov.in ಅಥವಾ ಸಮೀಪದ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್ ಪಡೆದುಕೊಳ್ಳಿ."
            },
            {
                "language": "hi",
                "name": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (PM-JAY)",
                "short_description": "प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस स्वास्थ्य सुरक्षा कवर।",
                "benefits": "प्रति वर्ष ₹5,00,000 का मुफ्त इलाज सूचीबद्ध सरकारी एवं निजी अस्पतालों में।",
                "application_procedure": "beneficiary.nha.gov.in पर पात्रता जांचें और नजदीकी अस्पताल में आयुष्मान कार्ड बनवाएं।"
            }
        ]
    },
    {
        "code": "KA-GRUHA-LAKSHMI",
        "name": "Gruha Lakshmi Scheme",
        "authority": "Department of Women and Child Development, Government of Karnataka",
        "level": "State",
        "applicable_state": "Karnataka",
        "category": "Women and Child Welfare",
        "target_beneficiaries": "Women heads of families in Karnataka with valid ration cards (Antyodaya, BPL, APL)",
        "short_description": "Direct financial assistance of ₹2,000 per month transferred directly to the woman head of every eligible household in Karnataka.",
        "full_description": "Under the Gruha Lakshmi guarantee scheme launched by the Government of Karnataka, woman head of every family is provided ₹2,000 monthly financial aid to empower women and combat household inflation.",
        "benefits": "₹2,000 per month (₹24,000 per year) directly credited to the woman head's Aadhaar-linked bank account.",
        "financial_benefit_amount": 24000.0,
        "application_procedure": "Apply via Seva Sindhu portal (sevasindhugs.karnataka.gov.in), Grama One, Karnataka One, or Bangalore One centers with Ration Card and Aadhaar.",
        "important_conditions": "The applicant or her husband must not be an income tax payer or GST filer. The woman must be identified as head of the family on the ration card.",
        "official_apply_url": "https://sevasindhugs.karnataka.gov.in/",
        "official_source_url": "https://wcd.karnataka.gov.in/",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "state", "operator": "eq", "value": "Karnataka", "description": "Resident of Karnataka", "is_mandatory": True},
            {"field": "gender", "operator": "eq", "value": "Female", "description": "Applicant must be a female family head", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Karnataka Ration Card", "description": "Ration card showing applicant as female head (Yejamanthi)", "is_mandatory": True, "issuing_authority": "Food & Civil Supplies Karnataka"},
            {"document_name": "Aadhaar Card of Applicant", "description": "Aadhaar identity card", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "Aadhaar-Linked Bank Passbook", "description": "NPCI-mapped bank account for direct benefit credit", "is_mandatory": True, "issuing_authority": "Bank"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ (ಕರ್ನಾಟಕ ಸರ್ಕಾರ)",
                "short_description": "ಕರ್ನಾಟಕದ ಕುಟುಂಬದ ಯಜಮಾನಿ ಮಹಿಳೆಗೆ ಪ್ರತಿ ತಿಂಗಳು ₹2,000 ನೇರ ನಗದು ಸಹಾಯ ಧನ ನೀಡುವ ಗ್ಯಾರಂಟಿ ಯೋಜನೆ.",
                "benefits": "ಪ್ರತಿ ತಿಂಗಳು ₹2,000 (ವಾರ್ಷಿಕ ₹24,000) ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮಾ.",
                "application_procedure": "ಸೇವಾ ಸಿಂಧು, ಗ್ರಾಮ್ ಒನ್, ಅಥವಾ ಕರ್ನಾಟಕ ಒನ್ ಕೇಂದ್ರಗಳಲ್ಲಿ ಪಡಿತರ ಚೀಟಿ ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್‌ನೊಂದಿಗೆ ಉಚಿತವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
            }
        ]
    },
    {
        "code": "KA-RAITHA-VIDYA-NIDHI",
        "name": "Chief Minister's Raitha Vidya Nidhi Scholarship",
        "authority": "Department of Agriculture, Government of Karnataka",
        "level": "State",
        "applicable_state": "Karnataka",
        "category": "Education",
        "target_beneficiaries": "Children of farmers pursuing post-matric / higher education in Karnataka",
        "short_description": "Scholarship ranging from ₹2,000 to ₹11,000 per year for students whose parents are registered farmers in Karnataka.",
        "full_description": "Launched by the Government of Karnataka, Raitha Vidya Nidhi encourages higher education among the children of farming families. Direct scholarship assistance is deposited into the student's bank account via State Scholarship Portal (SSP).",
        "benefits": "Annual scholarship of ₹2,000 to ₹11,000 based on the course level (PUC, Diploma, Degree, Medical, Engineering, Post-Graduation).",
        "financial_benefit_amount": 11000.0,
        "application_procedure": "Apply online through Karnataka State Scholarship Portal (SSP) at ssp.postmatric.karnataka.gov.in using Farmer ID (FID) and College Registration number.",
        "important_conditions": "Applicant's parent must be a registered farmer possessing land records in Karnataka.",
        "official_apply_url": "https://ssp.postmatric.karnataka.gov.in/",
        "official_source_url": "https://raitamitra.karnataka.gov.in/",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "state", "operator": "eq", "value": "Karnataka", "description": "Resident of Karnataka", "is_mandatory": True},
            {"field": "occupation", "operator": "in", "value": "Student,Farmer", "description": "Student pursuing post-matric education or child of farmer", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Student College Admission / ID Card", "description": "Proof of active post-matric enrollment", "is_mandatory": True, "issuing_authority": "College / University"},
            {"document_name": "Parent's Farmer ID (FID) / RTC", "description": "Proof that parent is a registered cultivator in Karnataka", "is_mandatory": True, "issuing_authority": "Agriculture / Revenue Dept"},
            {"document_name": "Student Aadhaar & Bank Passbook", "description": "DBT-enabled student bank account", "is_mandatory": True, "issuing_authority": "UIDAI / Bank"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಮುಖ್ಯಮಂತ್ರಿಗಳ ರೈತ ವಿದ್ಯಾ ನಿಧಿ ವಿದ್ಯಾರ್ಥಿವೇತನ",
                "short_description": "ಕರ್ನಾಟಕದ ರೈತರ ಮಕ್ಕಳಿಗೆ ಉನ್ನತ ಶಿಕ್ಷಣಕ್ಕಾಗಿ ವಾರ್ಷಿಕ ₹2,000 ದಿಂದ ₹11,000 ವರೆಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ.",
                "benefits": "ಕೋರ್ಸ್ ಆಧರಿಸಿ ವಾರ್ಷಿಕ ₹2,000 ದಿಂದ ₹11,000 ವರೆಗೆ ನೇರ ವಿದ್ಯಾರ್ಥಿವೇತನ.",
                "application_procedure": "ಎಸ್.ಎಸ್.ಪಿ (SSP) ಪೋಸ್ಟ್ ಮೆಟ್ರಿಕ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ತಂದೆ/ತಾಯಿಯ ರೈತ ಐಡಿ (FID) ಯೊಂದಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
            }
        ]
    },
    {
        "code": "PMAY-G",
        "name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        "authority": "Ministry of Rural Development, Govt. of India",
        "level": "Central",
        "applicable_state": "All",
        "category": "Housing",
        "target_beneficiaries": "Homeless families and families living in kutcha or dilapidated houses in rural areas",
        "short_description": "Provides financial grant of ₹1.20 Lakh in plain areas and ₹1.30 Lakh in hilly/difficult areas to construct a permanent pucca house.",
        "full_description": "PMAY-G aims to provide a pucca house with basic amenities to all rural houseless households and those living in kutcha and dilapidated houses by the Government of India. It also includes 90-95 days of unskilled labor wage under MGNREGA and toilet construction support.",
        "benefits": "₹1,20,000 to ₹1,30,000 grant in installments + ₹12,000 for toilet under Swachh Bharat Mission + 90 days MGNREGA wages.",
        "financial_benefit_amount": 130000.0,
        "application_procedure": "Gram Panchayat selects beneficiaries based on Awaas+ / SECC survey. Contact Gram Rozgar Sahayak or Village Panchayat Office.",
        "important_conditions": "Must not own a motorized two/three/four wheeler or agricultural equipment, and must not have a pucca house in India.",
        "official_apply_url": "https://pmayg.nic.in/",
        "official_source_url": "https://rural.nic.in/en/scheme-websites",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "residence_type", "operator": "eq", "value": "Rural", "description": "Must reside in a rural area", "is_mandatory": True},
            {"field": "annual_family_income", "operator": "lte", "value": "200000", "description": "Low income household without a pucca house", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Aadhaar Card", "description": "Aadhaar number of all adult family members", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "MGNREGA Job Card", "description": "Active job card number", "is_mandatory": True, "issuing_authority": "Gram Panchayat"},
            {"document_name": "Land / Site Document", "description": "Proof of possession of land for house construction", "is_mandatory": True, "issuing_authority": "Panchayat / Revenue"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ - ಗ್ರಾಮೀಣ (PMAY-G)",
                "short_description": "ಗ್ರಾಮೀಣ ಭಾಗದ ಬಡ ಕುಟುಂಬಗಳಿಗೆ ಪಕ್ಕಾ ಮನೆ ನಿರ್ಮಿಸಲು ₹1.20 ಲಕ್ಷದಿಂದ ₹1.30 ಲಕ್ಷ ಸಹಾಯಧನ.",
                "benefits": "ಮನೆ ನಿರ್ಮಾಣಕ್ಕೆ ₹1,20,000 - ₹1,30,000 ಅನುದಾನ + ಶೌಚಾಲಯ ನಿರ್ಮಾಣಕ್ಕೆ ₹12,000 + 90 ದಿನಗಳ ನರೇಗಾ ಕೂಲಿ.",
                "application_procedure": "ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕಾರ್ಯಾಲಯದಲ್ಲಿ ಆವಾಸ್ ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರು ಪರಿಶೀಲಿಸಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
            }
        ]
    },
    {
        "code": "PMMY",
        "name": "Pradhan Mantri Mudra Yojana (PMMY)",
        "authority": "Department of Financial Services, Ministry of Finance",
        "level": "Central",
        "applicable_state": "All",
        "category": "Business and Entrepreneurship",
        "target_beneficiaries": "Non-corporate, non-farm small/micro entrepreneurs, shopkeepers, and artisans",
        "short_description": "Collateral-free institutional business loans up to ₹10 Lakh in three tiers: Shishu (up to ₹50k), Kishore (₹50k-₹5L), and Tarun (₹5L-₹10L).",
        "full_description": "PMMY facilitates micro-credit to small enterprises engaged in manufacturing, trading, and service activities. Loans are provided without any collateral with affordable interest rates.",
        "benefits": "Collateral-free business loans up to ₹10,00,000 with flexible repayment tenure and subsidized processing fees.",
        "financial_benefit_amount": 1000000.0,
        "application_procedure": "Apply online at Udyamimitra portal (udyamimitra.in) or visit any commercial bank, RRB, or MFI with business proposal.",
        "important_conditions": "Applicant must not be a defaulter to any financial institution.",
        "official_apply_url": "https://www.mudra.org.in/",
        "official_source_url": "https://financialservices.gov.in/beta/en/schemes-programmes",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "age", "operator": "gte", "value": "18", "description": "Applicant must be at least 18 years of age", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "PAN Card & Aadhaar Card", "description": "Identity and KYC verification", "is_mandatory": True, "issuing_authority": "Income Tax / UIDAI"},
            {"document_name": "Business Plan & Quotation", "description": "Details of enterprise and machinery/equipment quotation", "is_mandatory": True, "issuing_authority": "Applicant / Vendor"},
            {"document_name": "Bank Statement (Last 6 Months)", "description": "Applicant bank financial records", "is_mandatory": True, "issuing_authority": "Bank"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಮುದ್ರಾ ಯೋಜನೆ (PMMY)",
                "short_description": "ಸಣ್ಣ ಉದ್ಯಮಿಗಳು, ಅಂಗಡಿಕಾರರಿಗೆ ಯಾವುದೇ ಭದ್ರತೆ (ಕೊಲ್ಯಾಟರಲ್) ಇಲ್ಲದೆ ₹10 ಲಕ್ಷದವರೆಗೆ ಬ್ಯಾಂಕ್ ಸಾಲ.",
                "benefits": "ಶಿಶು (₹50 ಸಾವಿರವರೆಗೆ), ಕಿಶೋರ್ (₹50 ಸಾವಿರದಿಂದ ₹5 ಲಕ್ಷ), ತರುಣ್ (₹5 ಲಕ್ಷದಿಂದ ₹10 ಲಕ್ಷ) ಸಾಲಗಳು.",
                "application_procedure": "udyamimitra.in ನಲ್ಲಿ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅಥವಾ ಯಾವುದೇ ರಾಷ್ಟ್ರೀಕೃತ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
            }
        ]
    },
    {
        "code": "APY",
        "name": "Atal Pension Yojana (APY)",
        "authority": "Pension Fund Regulatory and Development Authority (PFRDA)",
        "level": "Central",
        "applicable_state": "All",
        "category": "Pension",
        "target_beneficiaries": "Citizens in unorganized sector aged between 18 and 40 years",
        "short_description": "Guaranteed minimum monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000 or ₹5,000 after 60 years of age.",
        "full_description": "APY is focused on all citizens in the unorganized sector who join the National Pension System (NPS) administered by the PFRDA. It guarantees monthly lifetime pension with return of corpus to nominee upon demise.",
        "benefits": "Guaranteed pension of ₹1,000 to ₹5,000 per month from age 60 onwards for lifetime.",
        "financial_benefit_amount": 60000.0,
        "application_procedure": "Enroll via net banking or visit your savings bank branch or post office with Aadhaar.",
        "important_conditions": "Applicant must be aged between 18 and 40 years. Must not be an income tax payer.",
        "official_apply_url": "https://enps.nsdl.com/eNPS/ApySubRegistration.html",
        "official_source_url": "https://pfrda.org.in/",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "age", "operator": "between", "value": "18-40", "description": "Age between 18 and 40 years at time of enrollment", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Aadhaar Card", "description": "Proof of identity", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "Savings Bank Passbook", "description": "Bank account for monthly auto-debit of subscription", "is_mandatory": True, "issuing_authority": "Bank"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಅಟಲ್ ಪಿಂಚಣಿ ಯೋಜನೆ (APY)",
                "short_description": "ಅಸಂಘಟಿತ ವಲಯದ ಕಾರ್ಮಿಕರಿಗೆ 60 ವರ್ಷ ತುಂಬಿದ ನಂತರ ಪ್ರತಿ ತಿಂಗಳು ₹1,000 ದಿಂದ ₹5,000 ಖಾತರಿ ಪಿಂಚಣಿ.",
                "benefits": "60 ವರ್ಷದ ನಂತರ ಜೀವನಪರ್ಯಂತ ₹1,000 ರಿಂದ ₹5,000 ಮಾಸಿಕ ಪಿಂಚಣಿ.",
                "application_procedure": "ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಶಾಖೆಯಲ್ಲಿ ಅಥವಾ ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್ ಮೂಲಕ ಆಧಾರ್ ಲಿಂಕ್ ಮಾಡಿ ನೋಂದಾಯಿಸಿ."
            }
        ]
    },
    {
        "code": "MGNREGA",
        "name": "Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)",
        "authority": "Ministry of Rural Development, Govt. of India",
        "level": "Central",
        "applicable_state": "All",
        "category": "Employment",
        "target_beneficiaries": "Rural households whose adult members volunteer to do unskilled manual work",
        "short_description": "Legal guarantee for at least 100 days of wage employment in a financial year to every rural household.",
        "full_description": "MGNREGA aims to enhance livelihood security in rural areas by providing at least 100 days of wage employment per year to adult members willing to do unskilled manual work. Wages are paid directly to bank/post office accounts.",
        "benefits": "Guaranteed 100 days of employment at notified daily wages (varies by state, ₹250-₹374/day), paid within 15 days.",
        "financial_benefit_amount": 35000.0,
        "application_procedure": "Submit written application or apply orally to Gram Panchayat for Job Card.",
        "important_conditions": "Must be an adult resident of the village. Work is provided within 5 km of village.",
        "official_apply_url": "https://nrega.nic.in/",
        "official_source_url": "https://nrega.nic.in/Nregahome/MGNREGA_new/Nrega_home.aspx",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "age", "operator": "gte", "value": "18", "description": "Applicant must be an adult (18+ years)", "is_mandatory": True},
            {"field": "residence_type", "operator": "eq", "value": "Rural", "description": "Must reside in a rural area", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Aadhaar Card", "description": "Proof of identity", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "Gram Panchayat Residence Proof", "description": "Local household verification", "is_mandatory": True, "issuing_authority": "Gram Panchayat"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಮಹಾತ್ಮ ಗಾಂಧಿ ರಾಷ್ಟ್ರೀಯ ಗ್ರಾಮೀಣ ಉದ್ಯೋಗ ಖಾತರಿ ಯೋಜನೆ (ನರೇಗಾ)",
                "short_description": "ಗ್ರಾಮೀಣ ಕುಟುಂಬಗಳಿಗೆ ವಾರ್ಷಿಕ ಕನಿಷ್ಠ 100 ದಿನಗಳ ಖಾತರಿ ಉದ್ಯೋಗ ಹಾಗೂ ನಿಗದಿತ ಕೂಲಿ ಒದಗಿಸುವ ಯೋಜನೆ.",
                "benefits": "ಕನಿಷ್ಠ 100 ದಿನಗಳ ಖಾತರಿ ಕೂಲಿ ಕೆಲಸ, ವೇತನ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ.",
                "application_procedure": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಕಚೇರಿಯಲ್ಲಿ ಜಾಬ್ ಕಾರ್ಡ್‌ಗಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
            }
        ]
    },
    {
        "code": "PM-KUSUM",
        "name": "PM-KUSUM Component B (Solar Agriculture Water Pumps)",
        "authority": "Ministry of New and Renewable Energy (MNRE), Govt. of India",
        "level": "Central",
        "applicable_state": "All",
        "category": "Agriculture",
        "target_beneficiaries": "Individual farmers with agricultural land and valid irrigation access",
        "short_description": "Subsidizes up to 60% of the cost for installing individual stand-alone solar agricultural water pumps up to 7.5 HP, replacing diesel pumps.",
        "full_description": "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM) Component B provides standalone solar agriculture pumps to farmers. Central government provides 30% subsidy, State government provides 30% subsidy, and the farmer pays 40% (or can avail bank loan up to 30%).",
        "benefits": "Up to 60% capital subsidy (Central + State) on solar pump cost up to 7.5 HP. Farmers save ₹50,000+ annually on diesel expenditure.",
        "financial_benefit_amount": 150000.0,
        "application_procedure": "Apply through State Renewable Energy Agency portal (e.g. KREDL in Karnataka) or local agriculture/energy department office.",
        "important_conditions": "Applicant must have valid agricultural land records. Solar pump capacity sanctioned depends on water table and cultivable area.",
        "official_apply_url": "https://pmkusum.mnre.gov.in/",
        "official_source_url": "https://mnre.gov.in/solar/schemes/",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "occupation", "operator": "eq", "value": "Farmer", "description": "Applicant must be an active farmer", "is_mandatory": True},
            {"field": "land_holding_acres", "operator": "gte", "value": "1.0", "description": "Minimum 1.0 acre of cultivable landholding required", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Aadhaar Card", "description": "Proof of identity", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "Land Record (Pahani / RTC)", "description": "Proof of agricultural land ownership", "is_mandatory": True, "issuing_authority": "Revenue Dept"},
            {"document_name": "Bank Passbook", "description": "Account details for subsidy credit", "is_mandatory": True, "issuing_authority": "Bank"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಪಿಎಂ-ಕುಸುಮ್ ಘಟಕ ಬಿ (ಸೌರ ಕೃಷಿ ಪಂಪ್‌ಸೆಟ್ ಯೋಜನೆ)",
                "short_description": "ರೈತರಿಗೆ ನೀರಾವರಿಗಾಗಿ ಸ್ಟ್ಯಾಂಡ್‌ಅಲೋನ್ ಸೌರ ಕೃಷಿ ಪಂಪ್‌ಸೆಟ್ ಅಳವಡಿಕೆಗೆ ಶೇ.60 ರಷ್ಟು ಸಬ್ಸಿಡಿ ನೀಡುವ ಯೋಜನೆ.",
                "benefits": "ಸೌರ ಪಂಪ್‌ಸೆಟ್ ಅಳವಡಿಕೆಗೆ ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯದಿಂದ ಶೇ. 60 ಸಬ್ಸಿಡಿ.",
                "application_procedure": "ಕ್ರೆಡಲ್ (KREDL) ಅಥವಾ ಕೃಷಿ ಇಲಾಖೆ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
            }
        ]
    },
    {
        "code": "KA-YUVA-NIDHI",
        "name": "Karnataka Yuva Nidhi Scheme (Unemployment Allowance & Skill Support)",
        "authority": "Dept. of Skill Development, Entrepreneurship and Livelihood, Govt. of Karnataka",
        "level": "State",
        "applicable_state": "Karnataka",
        "category": "Employment",
        "target_beneficiaries": "Unemployed degree and diploma holders from Karnataka who graduated recently",
        "short_description": "Monthly financial assistance of ₹3,000 for degree holders and ₹1,500 for diploma holders who remain unemployed, up to a period of 2 years.",
        "full_description": "Karnataka Yuva Nidhi is one of the 5 Guarantee schemes of the Karnataka Government. It provides unemployment allowance along with skill development training to educated youth searching for jobs. The allowance is deposited directly via DBT to the Aadhaar-seeded bank account.",
        "benefits": "₹3,000 per month for degree holders; ₹1,500 per month for diploma holders, for up to 24 months or until employment.",
        "financial_benefit_amount": 36000.0,
        "application_procedure": "Apply online on the Karnataka Seva Sindhu portal (sevasindhu.karnataka.gov.in) with Aadhaar and degree/diploma certificate.",
        "important_conditions": "Must be a domicile of Karnataka. Must not be employed in government or private sector, or self-employed paying GST.",
        "official_apply_url": "https://sevasindhugs.karnataka.gov.in/",
        "official_source_url": "https://sevasindhu.karnataka.gov.in/",
        "last_verified_date": "2026-11-15",
        "is_demo_data": False,
        "rules": [
            {"field": "state", "operator": "eq", "value": "Karnataka", "description": "Applicant must reside in Karnataka", "is_mandatory": True},
            {"field": "age", "operator": "between", "value": "18-35", "description": "Age between 18 and 35 years", "is_mandatory": True}
        ],
        "documents": [
            {"document_name": "Aadhaar Card", "description": "Identity and address proof", "is_mandatory": True, "issuing_authority": "UIDAI"},
            {"document_name": "Degree / Diploma Certificate", "description": "Proof of graduation", "is_mandatory": True, "issuing_authority": "University / Technical Board"},
            {"document_name": "Karnataka Domicile Proof", "description": "Residence certificate or 10 years study proof in Karnataka", "is_mandatory": True, "issuing_authority": "Tahsildar / School"}
        ],
        "translations": [
            {
                "language": "kn",
                "name": "ಕರ್ನಾಟಕ ಯುವ ನಿಧಿ ಯೋಜನೆ",
                "short_description": "ಕರ್ನಾಟಕದ ನಿರುದ್ಯೋಗಿ ಪದವೀಧರರಿಗೆ ಮಾಸಿಕ ₹3,000 ಹಾಗೂ ಡಿಪ್ಲೋಮಾ ಪದವೀಧರರಿಗೆ ₹1,500 ಆರ್ಥಿಕ ನೆರವು.",
                "benefits": "ಪದವೀಧರರಿಗೆ ₹3,000/ತಿಂಗಳು, ಡಿಪ್ಲೋಮಾದವರಿಗೆ ₹1,500/ತಿಂಗಳು (ಗರಿಷ್ಠ 2 ವರ್ಷಗಳವರೆಗೆ).",
                "application_procedure": "ಸೇವಾ ಸಿಂಧು ಗ್ಯಾರಂಟಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆನ್‌ಲೈನ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ."
            }
        ]
    }
]

def seed_database(db: Session):
    # Check if states exist
    if db.query(State).count() == 0:
        print("Seeding Indian states and districts...")
        for st_data in INDIAN_STATES_DATA:
            st = State(
                name=st_data["name"],
                code=st_data["code"],
                is_union_territory=st_data["is_ut"]
            )
            db.add(st)
            db.flush()
            for d_name in st_data["districts"]:
                dist = District(state_id=st.id, name=d_name)
                db.add(dist)
        db.commit()

    # Seed or update schemes
    print("Checking and seeding government schemes and eligibility rules...")
    for sc_data in SCHEMES_DATA:
        existing = db.query(Scheme).filter(Scheme.code == sc_data["code"]).first()
        if existing:
            continue
        scheme = Scheme(
            code=sc_data["code"],
            name=sc_data["name"],
            authority=sc_data["authority"],
            level=sc_data["level"],
            applicable_state=sc_data["applicable_state"],
            category=sc_data["category"],
            target_beneficiaries=sc_data["target_beneficiaries"],
            short_description=sc_data["short_description"],
            full_description=sc_data["full_description"],
            benefits=sc_data["benefits"],
            financial_benefit_amount=sc_data.get("financial_benefit_amount"),
            application_procedure=sc_data.get("application_procedure"),
            important_conditions=sc_data.get("important_conditions"),
            official_apply_url=sc_data.get("official_apply_url"),
            official_source_url=sc_data.get("official_source_url"),
            last_verified_date=sc_data.get("last_verified_date", "2026-11-15"),
            is_demo_data=sc_data.get("is_demo_data", False),
            is_active=True
        )
        db.add(scheme)
        db.flush()

        # Rules
        for r in sc_data.get("rules", []):
            rule = EligibilityRule(
                scheme_id=scheme.id,
                field=r["field"],
                operator=r["operator"],
                value=r["value"],
                description=r["description"],
                is_mandatory=r.get("is_mandatory", True)
            )
            db.add(rule)

        # Documents
        for d in sc_data.get("documents", []):
            doc = SchemeDocument(
                scheme_id=scheme.id,
                document_name=d["document_name"],
                description=d.get("description"),
                is_mandatory=d.get("is_mandatory", True),
                issuing_authority=d.get("issuing_authority")
            )
            db.add(doc)

        # Sources
        if sc_data.get("official_source_url"):
            source = SchemeSource(
                scheme_id=scheme.id,
                title=f"Official {sc_data['name']} Portal",
                url=sc_data["official_source_url"],
                source_type="Government Portal",
                last_verified=sc_data.get("last_verified_date", "2026-11-15")
            )
            db.add(source)

        # Translations
        for tr in sc_data.get("translations", []):
            trans = SchemeTranslation(
                scheme_id=scheme.id,
                language=tr["language"],
                name=tr["name"],
                short_description=tr["short_description"],
                benefits=tr["benefits"],
                application_procedure=tr.get("application_procedure")
            )
            db.add(trans)

    db.commit()

    # Seed Admin User
    if db.query(AdminUser).count() == 0:
        admin = AdminUser(
            email="admin@benefitbridge.in",
            full_name="National Welfare Officer",
            hashed_password=get_password_hash("Admin@12345"),
            role="SUPERADMIN"
        )
        db.add(admin)
        db.commit()

    # Seed Demo Citizen User (Karnataka Farmer)
    if db.query(User).filter(User.email == "demo.farmer@karnataka.in").first() is None:
        demo_user = User(
            full_name="Basavaraj Patil",
            email="demo.farmer@karnataka.in",
            phone_number="9845012345",
            hashed_password=get_password_hash("Demo@12345"),
            preferred_language="kn"
        )
        db.add(demo_user)
        db.flush()

        profile = CitizenProfile(
            user_id=demo_user.id,
            age=42,
            gender="Male",
            state="Karnataka",
            district="Mandya",
            residence_type="Rural",
            occupation="Farmer",
            annual_family_income=120000.0,
            income_range="1L - 2.5L",
            social_category="OBC",
            disability_status="None",
            education_level="10th pass",
            marital_status="Married",
            land_holding_acres=2.5,
            has_bpl_ration_card=True
        )
        db.add(profile)
        db.commit()
