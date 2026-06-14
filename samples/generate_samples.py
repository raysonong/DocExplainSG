"""Generate synthetic (fake) Singapore government/financial letters as PDFs.

These are ENTIRELY FICTIONAL — fake names, NRICs, addresses, amounts, and
reference numbers — for testing the analysis pipeline only. Dates are set
relative to mid-June 2026 so some deadlines land inside the 14-day "urgent"
window and some outside it.

Run (from repo root):
    cd api && uv run python ../samples/generate_samples.py

Outputs a .pdf and a .txt for each sample next to this script.
"""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

OUT_DIR = Path(__file__).parent

# NOTE: keep all text ASCII-only — the built-in Helvetica font is Latin-1.
SAMPLES: dict[str, str] = {
    "cpf_retirement_topup": """CENTRAL PROVIDENT FUND BOARD
238B Thomson Road, #08-00 Novena Square, Singapore 307685

Date: 9 June 2026
Our Ref: CPF/RA/2026/0098213

Mr Tan Wei Ming
Blk 123 Ang Mo Kio Avenue 6, #05-321
Singapore 560123
NRIC: S8412345A

NOTICE OF RETIREMENT ACCOUNT SHORTFALL

Dear Mr Tan,

Our records show that your CPF Retirement Account (RA) has not met the
Basic Retirement Sum for your cohort. As at 1 June 2026, your RA balance
is S$96,400.00. The shortfall to the Basic Retirement Sum is S$2,500.00.

To enjoy higher monthly payouts under CPF LIFE, you may top up the
shortfall amount of S$2,500.00 by 24 June 2026. Top-ups received after
this date will be applied to the following payout computation cycle.

You may make the top-up via the CPF website (cpf.gov.sg) using PayNow or
GIRO. Please quote your reference number CPF/RA/2026/0098213.

If you have questions, call 1800-227-1188.

Yours faithfully,
Retirement Schemes Department
Central Provident Fund Board

(THIS IS A FICTIONAL SAMPLE DOCUMENT FOR TESTING.)
""",
    "hdb_lease_appointment": """HOUSING & DEVELOPMENT BOARD
480 Lorong 6 Toa Payoh, HDB Hub, Singapore 310480

Date: 5 June 2026
Reference: HDB/RESALE/2026/AMK/44120

Ms Nur Aisyah Binte Rahman
Blk 250 Bishan Street 22, #11-145
Singapore 570250

RE: COMPLETION APPOINTMENT FOR RESALE FLAT PURCHASE

Dear Ms Nur Aisyah,

Your application to purchase the resale flat at Blk 250 Bishan Street 22,
#11-145 has been processed. Your resale completion appointment is
scheduled as follows:

Date:  30 July 2026
Time:  10:00 AM
Venue: HDB Hub, Toa Payoh, Level 3, Resale Completion Counter

Please bring the following to your appointment:
- Original NRICs of all buyers
- This letter
- Cashier's order for the balance payment of S$18,750.00

If you are financing with an HDB loan, your loan documents must be signed
at least 5 working days before this appointment. Failure to attend may
delay your purchase.

To reschedule, log in to the HDB Resale Portal at least 3 working days in
advance, quoting reference HDB/RESALE/2026/AMK/44120.

Yours sincerely,
Resale Transactions Branch
Housing & Development Board

(THIS IS A FICTIONAL SAMPLE DOCUMENT FOR TESTING.)
""",
    "iras_notice_of_assessment": """INLAND REVENUE AUTHORITY OF SINGAPORE
55 Newton Road, Revenue House, Singapore 307987

Date: 1 June 2026
Tax Reference No.: S8523456B
Assessment Year: 2026

Mr Kumar Raj s/o Ganesan
Blk 88 Tampines Street 81, #03-77
Singapore 520088

NOTICE OF ASSESSMENT (INDIVIDUAL INCOME TAX)

Dear Mr Kumar,

Based on your filed return for the Year of Assessment 2026, your tax
assessment is as follows:

Assessable Income:        S$72,000.00
Personal Reliefs:         S$16,000.00
Chargeable Income:        S$56,000.00
Tax Payable:              S$1,950.00

Your tax payable of S$1,950.00 is due by 14 July 2026. If you are on the
GIRO instalment plan, deductions will continue automatically and no action
is needed.

If you wish to object to this assessment, you must file an objection within
30 days from the date of this notice, i.e. by 1 July 2026.

Payment can be made via PayNow (UEN: T08GA0001) or AXS. Please quote your
Tax Reference No. S8523456B.

Inland Revenue Authority of Singapore

(THIS IS A FICTIONAL SAMPLE DOCUMENT FOR TESTING.)
""",
    "mom_workpass_renewal": """MINISTRY OF MANPOWER
1500 Bendemeer Road, Singapore 339946

Date: 8 June 2026
Case Reference: MOM/EP/2026/771902

To: Ms Maria Santos Cruz
Work Pass No.: G1234567X
Employer: Bright Future Pte Ltd (UEN 201912345K)

EMPLOYMENT PASS RENEWAL - ADDITIONAL DOCUMENTS REQUIRED

Dear Ms Cruz,

We are processing the renewal of your Employment Pass, which expires on
31 July 2026. To continue, we require the following documents:

- Latest 3 months' payslips
- A copy of your updated employment contract
- Your employer's latest CPF contribution statement

Please ask your employer to submit these documents through EP Online by
20 June 2026. If the documents are not received by this date, your renewal
application may be withdrawn and you may need to apply afresh.

For enquiries, contact MOM at 6438 5122 quoting case reference
MOM/EP/2026/771902.

Work Pass Division
Ministry of Manpower

(THIS IS A FICTIONAL SAMPLE DOCUMENT FOR TESTING.)
""",
    "insurance_renewal_notice": """GREATSHIELD INSURANCE (SINGAPORE) LTD
10 Robinson Road, #12-00, Singapore 048541

Date: 3 June 2026
Policy No.: GS-HLT-2021-556677

Mr Lee Chee Keong
Blk 6 Holland Close, #09-12
Singapore 271006

INTEGRATED SHIELD PLAN - PREMIUM RENEWAL NOTICE

Dear Mr Lee,

Your GreatShield Integrated Health Plan is due for renewal. Please note the
details below:

Plan:            GreatShield Premier (Private Hospital)
Policy Period:   1 September 2026 to 31 August 2027
Annual Premium:  S$1,860.00
MediSave Portion: S$900.00 (deducted automatically)
Cash Portion:     S$960.00 (payable by you)

Your cash premium of S$960.00 is due by 1 August 2026. If payment is not
received, a 30-day grace period applies, after which your coverage will
lapse.

To pay, log in to our portal at greatshield.com.sg or call 6555 0123.
Please quote your policy number GS-HLT-2021-556677.

Thank you for insuring with GreatShield.

Policy Servicing Department
GreatShield Insurance (Singapore) Ltd

(THIS IS A FICTIONAL SAMPLE DOCUMENT FOR TESTING.)
""",
}


def _write_pdf(text: str, path: Path) -> None:
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)
    for line in text.split("\n"):
        # Empty lines need a blank cell to preserve spacing.
        pdf.multi_cell(
            w=pdf.epw,
            h=6,
            text=line if line else " ",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )
    pdf.output(str(path))


def main() -> None:
    for name, text in SAMPLES.items():
        (OUT_DIR / f"{name}.txt").write_text(text, encoding="utf-8")
        _write_pdf(text, OUT_DIR / f"{name}.pdf")
        print(f"wrote {name}.pdf and {name}.txt")


if __name__ == "__main__":
    main()
