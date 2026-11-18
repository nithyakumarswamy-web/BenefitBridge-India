from typing import Optional, List, Dict, Any
from app.models.models import Scheme, EligibilityRule, CitizenProfile
from app.schemas.schemas import CriterionResult, EligibilityEvaluationOut

INCOME_RANGE_MAPPING = {
    "< 1 Lakh": 100000,
    "1L - 2.5L": 250000,
    "2.5L - 5L": 500000,
    "5L - 8L": 800000,
    "> 8L": 1500000
}

def parse_user_income(profile: CitizenProfile) -> Optional[float]:
    if profile.annual_family_income is not None:
        return profile.annual_family_income
    if profile.income_range and profile.income_range in INCOME_RANGE_MAPPING:
        return INCOME_RANGE_MAPPING[profile.income_range]
    return None

def evaluate_single_criterion(rule: EligibilityRule, profile: Optional[CitizenProfile]) -> CriterionResult:
    field = rule.field.lower()
    op = rule.operator.lower()
    rule_val = rule.value.strip()
    desc = rule.description
    
    if profile is None:
        return CriterionResult(
            field=field,
            description=desc,
            status="UNKNOWN",
            user_value=None,
            required_value=rule_val,
            explanation=f"Profile information for '{field}' has not been provided yet."
        )
    
    user_val = getattr(profile, field, None)
    
    # Specific handling for income range if numerical income is null
    if field in ["annual_family_income", "income"] and user_val is None:
        user_val = parse_user_income(profile)

    # Missing information MUST be UNKNOWN, never automatically PASSED!
    if user_val is None or (isinstance(user_val, str) and not user_val.strip()):
        return CriterionResult(
            field=field,
            description=desc,
            status="UNKNOWN",
            user_value=None,
            required_value=rule_val,
            explanation=f"Your {field.replace('_', ' ')} is not specified in your profile. Please provide it to confirm eligibility."
        )
    
    # Operator evaluation
    status = "UNKNOWN"
    explanation = ""
    
    try:
        if op == "eq":
            matches = str(user_val).strip().lower() == rule_val.lower()
            status = "PASSED" if matches else "FAILED"
            explanation = (
                f"Matches requirement ({user_val})." if matches
                else f"Requires {rule_val}, but your profile indicates '{user_val}'."
            )
        
        elif op == "ne":
            matches = str(user_val).strip().lower() != rule_val.lower()
            status = "PASSED" if matches else "FAILED"
            explanation = (
                f"Valid ({user_val})." if matches
                else f"Must not be {rule_val}."
            )

        elif op == "in":
            allowed = [v.strip().lower() for v in rule_val.split(",")]
            # Check if "all" is an allowed wildcard
            if "all" in allowed or str(user_val).strip().lower() in allowed:
                status = "PASSED"
                explanation = f"Your profile '{user_val}' matches the allowed categories ({rule_val})."
            else:
                status = "FAILED"
                explanation = f"Your '{user_val}' is not in the eligible categories ({rule_val})."

        elif op == "lte":
            u_num = float(user_val)
            r_num = float(rule_val)
            matches = u_num <= r_num
            status = "PASSED" if matches else "FAILED"
            explanation = (
                f"Value {u_num} is within maximum limit of {r_num}." if matches
                else f"Value {u_num} exceeds the maximum limit of {r_num}."
            )

        elif op == "gte":
            u_num = float(user_val)
            r_num = float(rule_val)
            matches = u_num >= r_num
            status = "PASSED" if matches else "FAILED"
            explanation = (
                f"Value {u_num} satisfies minimum requirement of {r_num}." if matches
                else f"Value {u_num} is below the required minimum of {r_num}."
            )

        elif op == "between":
            parts = [float(x.strip()) for x in rule_val.split("-")]
            if len(parts) == 2:
                low, high = parts[0], parts[1]
                u_num = float(user_val)
                matches = low <= u_num <= high
                status = "PASSED" if matches else "FAILED"
                explanation = (
                    f"Value {u_num} is between {low} and {high}." if matches
                    else f"Value {u_num} is outside eligible range {low} - {high}."
                )
            else:
                status = "UNKNOWN"
                explanation = "Malformed range rule in database."

        else:
            status = "UNKNOWN"
            explanation = f"Unsupported rule operator: {op}."
            
    except Exception as e:
        status = "UNKNOWN"
        explanation = f"Could not evaluate criterion due to data format: {str(e)}."

    return CriterionResult(
        field=field,
        description=desc,
        status=status,
        user_value=user_val,
        required_value=rule_val,
        explanation=explanation
    )

def evaluate_scheme_eligibility(scheme: Scheme, profile: Optional[CitizenProfile]) -> EligibilityEvaluationOut:
    passed: List[CriterionResult] = []
    failed: List[CriterionResult] = []
    unknown: List[CriterionResult] = []
    missing_fields: List[str] = []
    
    # Also check applicable_state rule if scheme is state-specific
    if scheme.level == "State" and scheme.applicable_state and scheme.applicable_state.lower() != "all":
        # Check if state rule already exists in rules, otherwise add virtual check
        has_state_rule = any(r.field.lower() == "state" for r in scheme.rules)
        if not has_state_rule:
            virtual_state_rule = EligibilityRule(
                scheme_id=scheme.id,
                field="state",
                operator="in",
                value=f"{scheme.applicable_state},All",
                description=f"Resident of {scheme.applicable_state}",
                is_mandatory=True
            )
            state_result = evaluate_single_criterion(virtual_state_rule, profile)
            if state_result.status == "PASSED":
                passed.append(state_result)
            elif state_result.status == "FAILED":
                failed.append(state_result)
            else:
                unknown.append(state_result)
                missing_fields.append("state")

    for rule in scheme.rules:
        result = evaluate_single_criterion(rule, profile)
        if result.status == "PASSED":
            passed.append(result)
        elif result.status == "FAILED":
            failed.append(result)
        else:
            unknown.append(result)
            if rule.field not in missing_fields:
                missing_fields.append(rule.field)

    # Determine overall status
    if failed:
        overall_status = "FAILED"
        summary_explanation = f"You do not meet {len(failed)} mandatory eligibility criteria for {scheme.name}."
        next_steps = "Review the failed criteria. If any profile detail was entered incorrectly, update your citizen profile to re-evaluate."
    elif unknown:
        overall_status = "UNKNOWN"
        summary_explanation = f"Eligibility cannot be confirmed because {len(unknown)} criterion/criteria require additional profile information."
        fields_str = ", ".join([f.replace('_', ' ') for f in missing_fields])
        next_steps = f"Please provide: {fields_str} in your profile or directly in the chat to see if you qualify."
    else:
        overall_status = "PASSED"
        summary_explanation = f"Great news! You meet all {len(passed)} verified criteria for {scheme.name} based on your citizen profile."
        next_steps = "Proceed to the Document Checklist to verify your papers, then visit the official application portal."

    return EligibilityEvaluationOut(
        scheme_id=scheme.id,
        scheme_name=scheme.name,
        overall_status=overall_status,
        passed_criteria=passed,
        failed_criteria=failed,
        unknown_criteria=unknown,
        missing_fields=missing_fields,
        summary_explanation=summary_explanation,
        next_steps=next_steps
    )
