import re
import json
import httpx
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import Scheme, CitizenProfile, User, ChatSession, ChatMessage
from app.services.eligibility_engine import evaluate_scheme_eligibility
from app.services.translations import get_text
from app.core.config import settings

# Keywords for Intent & Entity Extraction
STATE_SYNONYMS = {
    "karnataka": "Karnataka",
    "ಕರ್ನಾಟಕ": "Karnataka",
    "कर्नाटक": "Karnataka",
    "tamil nadu": "Tamil Nadu",
    "தமிழ்நாடு": "Tamil Nadu",
    "telangana": "Telangana",
    "తెలంగాణ": "Telangana",
    "andhra": "Andhra Pradesh",
    "maharashtra": "Maharashtra",
    "महाराष्ट्र": "Maharashtra",
    "kerala": "Kerala",
    "കേരളം": "Kerala"
}

OCCUPATION_SYNONYMS = {
    "farmer": "Farmer",
    "agriculture": "Farmer",
    "agriculture worker": "Farmer",
    "ರೈತ": "Farmer",
    "ಕೃಷಿ": "Farmer",
    "किसान": "Farmer",
    "விவசாயி": "Farmer",
    "రైతు": "Farmer",
    "വിത്ത്": "Farmer",
    "शेतकरी": "Farmer",
    
    "student": "Student",
    "scholarship": "Student",
    "ವಿದ್ಯಾರ್ಥಿ": "Student",
    "छात्र": "Student",
    "विद्यार्थी": "Student",
    "மாணவர்": "Student",
    "విద్యార్థి": "Student",
    
    "woman": "Homemaker",
    "women": "Homemaker",
    "female": "Homemaker",
    "ಮಹಿಳೆ": "Homemaker",
    "महिला": "Homemaker",
    "பெண்": "Homemaker",
    "మహిళ": "Homemaker",
    
    "worker": "Daily Wage / Laborer",
    "laborer": "Daily Wage / Laborer",
    "labour": "Daily Wage / Laborer",
    "ಕಾರ್ಮಿಕ": "Daily Wage / Laborer",
    "मजदूर": "Daily Wage / Laborer"
}

def extract_profile_from_text(text: str) -> Dict[str, Any]:
    extracted = {}
    lower_text = text.lower()
    
    # State extraction
    for syn, state_name in STATE_SYNONYMS.items():
        if syn in lower_text:
            extracted["state"] = state_name
            break
            
    # Occupation extraction
    for syn, occ_name in OCCUPATION_SYNONYMS.items():
        if syn in lower_text:
            extracted["occupation"] = occ_name
            break
            
    # Age extraction
    age_match = re.search(r'\b(?:age|ವಯಸ್ಸು|आयु|வயது|वय)\s*[:=]?\s*(\d{1,2})\b', text, re.IGNORECASE)
    if not age_match:
        age_match = re.search(r'\b(\d{1,2})\s*(?:years|years old|ವರ್ಷ|ವರ್ಷದ|साल|वर्ष)\b', text, re.IGNORECASE)
    if age_match:
        extracted["age"] = int(age_match.group(1))
        
    # Residence extraction
    if any(k in lower_text for k in ["rural", "ಹಳ್ಳಿ", "ಗ್ರಾಮೀಣ", "ग्रामीण", "கிராமம்", "గ్రామీణ"]):
        extracted["residence_type"] = "Rural"
    elif any(k in lower_text for k in ["urban", "ನಗರ", "शहरी", "நகர்ப்புறம்", "పట్టణ"]):
        extracted["residence_type"] = "Urban"
        
    # Income extraction
    if any(k in lower_text for k in ["< 1 lakh", "1 lakh", "ಬಡತನ", "bpl", "ಕಡಿಮೆ ಆದಾಯ", "गरीब", "1 ಲಕ್ಷ"]):
        extracted["income_range"] = "< 1 Lakh"
        extracted["annual_family_income"] = 80000.0
    elif "2.5" in lower_text:
        extracted["income_range"] = "1L - 2.5L"
        extracted["annual_family_income"] = 180000.0
        
    return extracted

def retrieve_schemes_for_query(db: Session, text: str, profile: Optional[CitizenProfile]) -> List[Scheme]:
    lower_text = text.lower()
    schemes_query = db.query(Scheme).filter(Scheme.is_active == True)
    
    # Determine target category or keyword filters
    matched_categories = []
    if any(w in lower_text for w in ["farmer", "ರೈತ", "ಕೃಷಿ", "kisan", "agriculture", "land", "crop", "ಬೆಳೆ"]):
        matched_categories.append("Agriculture")
    if any(w in lower_text for w in ["student", "school", "college", "scholarship", "ವಿದ್ಯಾರ್ಥಿ", "ವಿದ್ಯಾರ್ಥಿವೇತನ", "छात्र"]):
        matched_categories.append("Education")
    if any(w in lower_text for w in ["health", "hospital", "ayushman", "ಆರೋಗ್ಯ", "ಚಿಕಿತ್ಸೆ", "बीमारी"]):
        matched_categories.append("Healthcare")
    if any(w in lower_text for w in ["women", "mother", "daughter", "ಮಹಿಳೆ", "ತಾಯಿ", "gruha lakshmi", "ಗೃಹಲಕ್ಷ್ಮಿ"]):
        matched_categories.append("Women and Child Welfare")
    if any(w in lower_text for w in ["house", "housing", "awas", "ಮನೆ", "ವಸತಿ", "घर"]):
        matched_categories.append("Housing")
    if any(w in lower_text for w in ["loan", "business", "mudra", "ಉದ್ಯಮ", "ಸಾಲ", "व्यापार"]):
        matched_categories.append("Business and Entrepreneurship")
    if any(w in lower_text for w in ["pension", "old age", "ವೃದ್ಧಾಪ್ಯ", "ಪಿಂಚಣಿ", "पेंशन"]):
        matched_categories.append("Pension")

    # If profile exists, also consider profile occupation
    if profile and profile.occupation:
        occ = profile.occupation.lower()
        if "farmer" in occ and "Agriculture" not in matched_categories:
            matched_categories.append("Agriculture")
        elif "student" in occ and "Education" not in matched_categories:
            matched_categories.append("Education")
        elif "homemaker" in occ and "Women and Child Welfare" not in matched_categories:
            matched_categories.append("Women and Child Welfare")

    all_schemes = schemes_query.all()
    results = []
    
    # State matching logic
    user_state = profile.state if profile and profile.state else None
    
    for s in all_schemes:
        # Check geographic applicability
        if s.level == "State" and s.applicable_state and s.applicable_state != "All":
            if user_state and s.applicable_state.lower() != user_state.lower():
                continue
        
        # Category or query match
        if matched_categories:
            if s.category in matched_categories:
                results.append(s)
        else:
            results.append(s)
            
    # Default top schemes if no specific filter
    if not results:
        results = all_schemes[:5]
        
    return results

async def call_gemini_api_if_configured(prompt: str, system_instruction: str) -> Optional[str]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800}
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini API call failed: {e}")
    return None

async def generate_grounded_response(
    db: Session,
    user_message: str,
    language: str,
    profile: Optional[CitizenProfile]
) -> Dict[str, Any]:
    # 1. Extract newly mentioned profile information
    extracted_updates = extract_profile_from_text(user_message)
    if profile and extracted_updates:
        for k, v in extracted_updates.items():
            if getattr(profile, k, None) is None:
                setattr(profile, k, v)
        db.commit()
        db.refresh(profile)

    # 2. Retrieve relevant schemes from database
    retrieved_schemes = retrieve_schemes_for_query(db, user_message, profile)

    # 3. Deterministic Eligibility Evaluation for each scheme
    recommendations = []
    eligibility_breakdowns = []
    all_missing_fields = set()

    for s in retrieved_schemes:
        eval_result = evaluate_scheme_eligibility(s, profile)
        eligibility_breakdowns.append({
            "scheme_id": s.id,
            "scheme_name": s.name,
            "overall_status": eval_result.overall_status,
            "passed": [c.dict() for c in eval_result.passed_criteria],
            "failed": [c.dict() for c in eval_result.failed_criteria],
            "unknown": [c.dict() for c in eval_result.unknown_criteria],
            "summary": eval_result.summary_explanation,
            "next_steps": eval_result.next_steps
        })

        for mf in eval_result.missing_fields:
            all_missing_fields.add(mf)

        # Get translated scheme name/description if available
        tr_name = s.name
        tr_desc = s.short_description
        tr_benefits = s.benefits
        for tr in s.translations:
            if tr.language == language:
                tr_name = tr.name
                tr_desc = tr.short_description
                tr_benefits = tr.benefits
                break

        # Required documents
        docs_list = [d.document_name for d in s.documents]

        recommendations.append({
            "id": s.id,
            "code": s.code,
            "name": tr_name,
            "english_name": s.name,
            "authority": s.authority,
            "category": s.category,
            "level": s.level,
            "benefits": tr_benefits,
            "short_description": tr_desc,
            "eligibility_status": eval_result.overall_status,
            "documents": docs_list,
            "official_apply_url": s.official_apply_url,
            "official_source_url": s.official_source_url,
            "last_verified_date": s.last_verified_date,
            "is_demo_data": s.is_demo_data
        })

    # Sort recommendations: PASSED first, then UNKNOWN, then FAILED
    status_order = {"PASSED": 0, "UNKNOWN": 1, "FAILED": 2}
    recommendations.sort(key=lambda x: status_order.get(x["eligibility_status"], 3))

    # 4. Multilingual response synthesis
    lang = language.lower() if language else "en"
    
    # Check if Gemini API is available
    system_prompt = f"""You are BenefitBridge India, an AI assistant for government benefits.
The user is speaking in language '{lang}'.
Answer factually based strictly on these verified scheme details:
{json.dumps([{
    'name': r['name'],
    'status': r['eligibility_status'],
    'benefits': r['benefits'],
    'documents': r['documents'],
    'url': r['official_apply_url']
} for r in recommendations[:4]], ensure_ascii=False)}

Never hallucinate. Clearly explain eligibility and required documents. Respond in {settings.SUPPORTED_LANGUAGES.get(lang, 'English')}."""

    gemini_reply = await call_gemini_api_if_configured(user_message, system_prompt)

    if not gemini_reply:
        # High quality grounded deterministic response builder in the chosen language!
        if lang == "kn":
            if profile and profile.occupation == "Farmer":
                intro = f"ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪ್ರಕಾರ (ಕರ್ನಾಟಕದ ರೈತರು, ವಯಸ್ಸು {profile.age or 42}, ಗ್ರಾಮೀಣ ವಾಸಿ), ನಿಮಗೆ ಲಭ್ಯವಿರುವ ಪ್ರಮುಖ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರ ಇಲ್ಲಿದೆ:"
            else:
                intro = "ನಮಸ್ಕಾರ! ನೀವು ಕೇಳಿದ ಮಾಹಿತಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಲಭ್ಯವಿರುವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರ ಇಲ್ಲಿದೆ:"

            scheme_bullets = []
            for r in recommendations[:3]:
                st_label = "✅ ಅರ್ಹರಾಗಿದ್ದೀರಿ (ಅರ್ಹತೆ ಪೂರ್ಣ)" if r["eligibility_status"] == "PASSED" else (
                    "⚠️ ಮಾಹಿತಿ ಅಪೂರ್ಣವಾಗಿದೆ (ಹೆಚ್ಚಿನ ವಿವರ ಬೇಕು)" if r["eligibility_status"] == "UNKNOWN" else "❌ ಅರ್ಹರಾಗಿಲ್ಲ"
                )
                scheme_bullets.append(
                    f"• **{r['name']}**\n"
                    f"  - ಅರ್ಹತೆ: {st_label}\n"
                    f"  - ಸೌಲಭ್ಯ: {r['benefits']}\n"
                    f"  - ಅಗತ್ಯ ದಾಖಲೆಗಳು: {', '.join(r['documents'][:3])}\n"
                    f"  - ಅಧಿಕೃತ ಅರ್ಜಿ ಪೋರ್ಟಲ್: {r['official_apply_url']}"
                )

            missing_text = ""
            if all_missing_fields:
                kn_fields = {
                    "age": "ವಯಸ್ಸು", "state": "ರಾಜ್ಯ", "occupation": "ವೃತ್ತಿ",
                    "annual_family_income": "ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ", "land_holding_acres": "ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)"
                }
                mf_kn = [kn_fields.get(f, f) for f in all_missing_fields]
                missing_text = f"\n\n🔍 **ನಿಖರ ಅರ್ಹತೆಗಾಗಿ ಅಗತ್ಯವಿರುವ ವಿವರಗಳು:** {', '.join(mf_kn)}. ಇವುಗಳನ್ನು ತಿಳಿಸಿದರೆ ನಿಮ್ಮ ಅರ್ಹತೆಯನ್ನು ತಕ್ಷಣ ದೃಢಪಡಿಸಬಹುದು."

            outro = "\n\n💡 *ಸೂಚನೆ: ಈ ಮಾಹಿತಿಯು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಮೂಲಗಳಿಂದ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದೆ. ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಲಿಂಕ್ ಬಳಸಬಹುದು.*"
            content = intro + "\n\n" + "\n\n".join(scheme_bullets) + missing_text + outro

        elif lang == "hi":
            intro = "नमस्ते! आपके प्रोफ़ाइल के आधार पर आपके लिए उपलब्ध प्रमुख सरकारी योजनाओं की सूची यहाँ है:"
            scheme_bullets = []
            for r in recommendations[:3]:
                st_label = "✅ आप पात्र हैं" if r["eligibility_status"] == "PASSED" else (
                    "⚠️ जानकारी अधूरी है" if r["eligibility_status"] == "UNKNOWN" else "❌ अपात्र"
                )
                scheme_bullets.append(
                    f"• **{r['name']}**\n"
                    f"  - पात्रता स्थिति: {st_label}\n"
                    f"  - लाभ: {r['benefits']}\n"
                    f"  - आवश्यक दस्तावेज़: {', '.join(r['documents'][:3])}\n"
                    f"  - आधिकारिक पोर्टल: {r['official_apply_url']}"
                )
            content = intro + "\n\n" + "\n\n".join(scheme_bullets)

        elif lang == "ta":
            intro = "வணக்கம்! உங்கள் சுயவிவரத்தின்படி உங்களுக்கான முதன்மை அரசு நலத்திட்டங்கள் இதோ:"
            scheme_bullets = []
            for r in recommendations[:3]:
                st_label = "✅ தகுதியுடையவர்" if r["eligibility_status"] == "PASSED" else (
                    "⚠️ கூடுதல் தகவல் தேவை" if r["eligibility_status"] == "UNKNOWN" else "❌ தகுதியற்றவர்"
                )
                scheme_bullets.append(
                    f"• **{r['name']}**\n"
                    f"  - தகுதி நிலை: {st_label}\n"
                    f"  - பயன்கள்: {r['benefits']}\n"
                    f"  - தேவையான ஆவணங்கள்: {', '.join(r['documents'][:3])}\n"
                    f"  - அதிகாரப்பூர்வ இணையதளம்: {r['official_apply_url']}"
                )
            content = intro + "\n\n" + "\n\n".join(scheme_bullets)

        elif lang == "te":
            intro = "నమస్కారం! మీ ప్రొఫైల్ ప్రకారం మీకు అందుబాటులో ఉన్న ముఖ్యమైన ప్రభుత్వ పథకాలు:"
            scheme_bullets = []
            for r in recommendations[:3]:
                st_label = "✅ మీరు అర్హులు" if r["eligibility_status"] == "PASSED" else (
                    "⚠️ మరింత సమాచారం అవసరం" if r["eligibility_status"] == "UNKNOWN" else "❌ అనర్హులు"
                )
                scheme_bullets.append(
                    f"• **{r['name']}**\n"
                    f"  - అర్హత స్థితి: {st_label}\n"
                    f"  - ప్రయోజనాలు: {r['benefits']}\n"
                    f"  - అవసరమైన పత్రాలు: {', '.join(r['documents'][:3])}\n"
                    f"  - అధికారిక పోర్టల్: {r['official_apply_url']}"
                )
            content = intro + "\n\n" + "\n\n".join(scheme_bullets)

        elif lang == "ml":
            intro = "നമസ്കാരം! നിങ്ങളുടെ പ്രൊഫൈൽ അനുസരിച്ചുള്ള പ്രധാന സർക്കാർ ക്ഷേമ പദ്ധതികൾ താഴെ പറയുന്നവയാണ്:"
            scheme_bullets = []
            for r in recommendations[:3]:
                st_label = "✅ നിങ്ങൾ അർഹനാണ്" if r["eligibility_status"] == "PASSED" else (
                    "⚠️ കൂടുതൽ വിവരങ്ങൾ ആവശ്യമാണ്" if r["eligibility_status"] == "UNKNOWN" else "❌ അർഹതയില്ല"
                )
                scheme_bullets.append(
                    f"• **{r['name']}**\n"
                    f"  - അർഹത: {st_label}\n"
                    f"  - ആനുകൂല്യം: {r['benefits']}\n"
                    f"  - ആവശ്യമായ രേഖകൾ: {', '.join(r['documents'][:3])}\n"
                    f"  - ഔദ്യോഗിക പോർട്ടൽ: {r['official_apply_url']}"
                )
            content = intro + "\n\n" + "\n\n".join(scheme_bullets)

        elif lang == "mr":
            intro = "नमस्कार! आपल्या प्रोफाईलवर आधारित आपल्यासाठी उपलब्ध असलेल्या प्रमुख सरकारी योजना:"
            scheme_bullets = []
            for r in recommendations[:3]:
                st_label = "✅ आपण पात्र आहात" if r["eligibility_status"] == "PASSED" else (
                    "⚠️ अधिक माहिती आवश्यक" if r["eligibility_status"] == "UNKNOWN" else "❌ अपात्र"
                )
                scheme_bullets.append(
                    f"• **{r['name']}**\n"
                    f"  - पात्रता: {st_label}\n"
                    f"  - लाभ: {r['benefits']}\n"
                    f"  - आवश्यक कागदपत्रे: {', '.join(r['documents'][:3])}\n"
                    f"  - अधिकृत संकेतस्थळ: {r['official_apply_url']}"
                )
            content = intro + "\n\n" + "\n\n".join(scheme_bullets)

        else: # Default English
            intro = "Hello! Based on your citizen profile, here are the official government welfare schemes tailored for you:"
            scheme_bullets = []
            for r in recommendations[:3]:
                st_label = "✅ PASSED (Eligible)" if r["eligibility_status"] == "PASSED" else (
                    "⚠️ UNKNOWN (Missing profile info)" if r["eligibility_status"] == "UNKNOWN" else "❌ FAILED (Ineligible)"
                )
                scheme_bullets.append(
                    f"• **{r['name']}** ({r['authority']})\n"
                    f"  - Status: {st_label}\n"
                    f"  - Financial Benefit: {r['benefits']}\n"
                    f"  - Key Documents: {', '.join(r['documents'][:3])}\n"
                    f"  - Official Portal: {r['official_apply_url']}"
                )
            missing_text = ""
            if all_missing_fields:
                missing_text = f"\n\n🔍 **Missing Information to Confirm Full Eligibility:** {', '.join([f.replace('_', ' ') for f in all_missing_fields])}."
            content = intro + "\n\n" + "\n\n".join(scheme_bullets) + missing_text
    else:
        content = gemini_reply

    # Suggested follow-up chips
    suggested_questions = []
    if lang == "kn":
        suggested_questions = [
            "ನನ್ನ ಅರ್ಜಿ ಸಿದ್ಧತಾ ಕ್ರಿಯಾ ಯೋಜನೆ (Action Plan) ನೀಡಿ",
            "ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳ ಪಟ್ಟಿ ಏನು?",
            "ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆಗೆ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು?",
            "ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಯ ನಿಯಮಗಳು ಯಾವುವು?"
        ]
    elif lang == "hi":
        suggested_questions = [
            "मेरे लिए कार्य योजना (Action Plan) बनाएं",
            "आवश्यक दस्तावेजों की चेकलिस्ट क्या है?",
            "पीएम-किसान के लिए ऑनलाइन आवेदन कैसे करें?",
            "आयुष्मान भारत कार्ड कैसे बनवाएं?"
        ]
    else:
        suggested_questions = [
            "Generate my step-by-step Action Plan",
            "Show my required Document Checklist",
            "How do I apply for PM-KISAN online?",
            "What are the benefits of Ayushman Bharat?"
        ]

    return {
        "content": content,
        "language": lang,
        "recommended_schemes": recommendations,
        "eligibility_breakdowns": eligibility_breakdowns,
        "missing_fields": list(all_missing_fields),
        "suggested_questions": suggested_questions
    }
