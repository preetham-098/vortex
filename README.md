# Workforce Intelligence: AI-Assisted Workforce Optimization & Analytics Platform

**AMC HackAttack — Web & App Development Track**

An enterprise-grade, full-stack platform designed to help engineering and project leaders match employees to projects, optimize complementary teams, identify skill gaps with automated training paths, balance capacity-constrained workloads, solve task allocation via Integer Linear Programming (ILP), and forecast future workloads using Random Forest regression.

---

## Architecture & Technology Stack

- **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Next.js Route Handlers, Modular TypeScript services, Zod schema validation, server-side RBAC and organization data isolation.
- **Database & Authentication**: Cloud Firestore, Firebase Authentication with Google Login, Firestore Security Rules, dual-mode persistence (Cloud Firestore Admin SDK + local in-memory fallback for zero-configuration testing).
- **Machine Learning & Optimization**: Python 3.13, scikit-learn, pandas, NumPy, SciPy.
- **Testing**: Vitest for TypeScript domain algorithms, Python `unittest` for ML pipelines and evaluations.
- **Deployment**: Vercel for Next.js, with modular standalone Python service integration.

---

## The 7 Core Algorithms & Mathematical Formulations

### Algorithm 1: Weighted Skill Gap Analysis (WSGA)
- **Gap Matrix**: $M_{ij} = \max(0, R_j - E_{ij})$
- **Aggregate Skill Gap**: $SG_i = \frac{\sum_j w_j \cdot M_{ij}}{\sum_j w_j}$
- **Skill Match %**: $\text{SkillMatch}_i = 100 \cdot \left(1 - \frac{SG_i}{R_{\max}}\right)$
- **Training Priority**: $TP_{ij} = M_{ij} \cdot w_j \cdot P_j$
- **Team Collective Coverage**: Multiple employees collectively satisfy competency $j$:
  $E_{\text{team}, j} = \max_{i \in \text{Team}}(E_{ij})$

### Algorithm 2: Weighted Employee–Project Matching
- **Score Formula**: $\text{Score}_{ip} = w_s \cdot S_{ip} + w_e \cdot E_{ip} + w_a \cdot A_i + w_p \cdot P_i$
- **Constraint**: $w_s + w_e + w_a + w_p = 1$
- **Default Weights**: Skills $w_s = 0.50$, Experience $w_e = 0.20$, Availability $w_a = 0.20$, Performance $w_p = 0.10$.
- **Hard Constraints**: Enforces mandatory project skills ($E_{ij} \ge R_j$) and minimum experience separately from the weighted score. Missing performance ratings are transparently disclosed with configurable fallback.

### Algorithm 3: Capacity-Aware Workload Balancing
- **Remaining Capacity**: $C_i = H_i - L_i$ (preserves negative capacity to expose overload)
- **Utilization Percentage**: $U_i = \left(\frac{L_i}{H_i}\right) \cdot 100$
- **Workload Share**: $W_i = \frac{L_i}{\sum_k L_k}$
- **Imbalance Ratio**: $\text{Imbalance} = \frac{\sigma(L)}{\mu(L)}$ (population standard deviation over mean)

### Algorithm 4: Constrained Task Allocation (ILP)
- **Binary Decision Variable**: $x_{ij} \in \{0, 1\}$
- **Objective Function**: Minimize $\sum_i \sum_j x_{ij} \cdot (\alpha \cdot G_{ij} + \beta \cdot U_i + \gamma \cdot D_{ij})$
- **Constraints**:
  1. $\sum_i x_{ij} = 1 \quad \forall j$
  2. $\sum_j x_{ij} \cdot T_j \le (H_i - L_i) \quad \forall i$
  3. $x_{ij} = 0 \quad \text{when } \text{SkillMatch}_{ij} < \tau$
- **Manager Approval**: Proposals require explicit manager review before committing to Firestore.

### Algorithm 5: Available Talent Identification
- **Available Hours**: $A_i = \max(0, H_i - L_i)$
- **Talent Score**: $\text{TalentScore}_{ij} = \text{Score}_{ij} \cdot \left(\frac{A_i}{H_i}\right)$

### Algorithm 6: Random Forest Workload Prediction
- **Model**: $\hat{L}_{i, t+1} = f_{\text{RF}}(X_{i, t})$
- **Metrics on Held-Out Test Set**:
  - $\text{MAE} = \frac{1}{N} \sum |L_i - \hat{L}_i| = 2.585\text{ hours}$
  - $\text{RMSE} = \sqrt{\frac{1}{N} \sum (L_i - \hat{L}_i)^2} = 3.159\text{ hours}$
  - **Baseline Comparison**: Outperforms historical persistence baseline (7.625h MAE) by 66.1%.
- **Chronological Split**: Trained on cycles 1–9, evaluated on cycles 10–12 to strictly prevent future-data leakage.

### Algorithm 7: Final Workforce Optimization Score
- **Formula**: $F_i = \lambda_1 \cdot \text{SkillMatch}_i + \lambda_2 \cdot \text{Availability}_i + \lambda_3 \cdot \text{Performance}_i - \lambda_4 \cdot \text{WorkloadPenalty}_i$
- **Constraint**: $\sum \lambda_k = 1$
- **Score Range Notice**: The workload penalty subtraction is preserved as specified; severe overload can drive $F_i$ below 0.

---

## Getting Started Locally

### 1. Prerequisites
- **Node.js**: v20+
- **Python**: 3.10+ (with `numpy`, `pandas`, `scikit-learn`, `scipy`)

### 2. Installation
```bash
# Clone the repository
cd vortex

# Install Node dependencies
npm install

# Verify Python ML stack
python -c "import numpy, pandas, sklearn, scipy; print('ML stack ready')"
```

### 3. Run Automated Tests
```bash
# Run TypeScript Vitest suites (27 tests across all 5 algorithm phases)
npm test

# Run Python ML test suite (model training, MAE, RMSE, and inference validation)
python ml_service/test_ml.py
```

### 4. Train the Random Forest Model
```bash
python ml_service/train.py
```
This generates `synthetic_workforce_cycles.csv`, trains a 100-tree ensemble, evaluates held-out metrics, and serializes the model to `ml_service/models/random_forest_workload.joblib`.

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The platform auto-seeds with realistic enterprise workforce telemetry upon first load!

---

## Firebase & Authentication Setup

### Dual-Mode Persistence
The system operates seamlessly in **Dual-Mode**:
1. **Local / Evaluator Mode**: When Firebase environment variables are not supplied, the platform runs in a deterministic memory-backed enterprise store with role-switching (`manager`, `admin`, `employee`).
2. **Cloud Firestore Mode**: When Firebase credentials are provided in `.env.local`, all operations persist to Cloud Firestore using the Firebase Admin SDK on the server and Client SDK for Google Sign-In.

### Environment Configuration (`.env.local`)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Firebase Console Setup
1. Enable **Authentication** -> Sign-in method -> **Google**.
2. Add your deployment domains (e.g. `localhost` and your Vercel domain `*.vercel.app`) to **Authorized domains**.
3. Create a **Cloud Firestore** database in production mode.
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set Framework Preset to **Next.js**.
4. Configure Environment Variables in the Vercel dashboard matching `.env.example`.
5. Deploy! Vercel will execute `npm run build` and serve the application globally.

---

## Project Structure

```
vortex/
├── firestore.rules               # Production Firestore security rules with RBAC
├── firestore.indexes.json        # Compound indexes for Firestore queries
├── .env.example                  # Environment configuration template
├── ml_service/                   # Dedicated Python Machine Learning microservice
│   ├── preprocessing.py          # Data cleaning and type coercion
│   ├── feature_engineering.py    # Leak-free feature extraction
│   ├── generate_dataset.py       # 1,000-cycle synthetic enterprise generator
│   ├── train.py                  # Chronological train/test split & RF training
│   ├── predict.py                # Ensemble inference & confidence intervals
│   ├── evaluate.py               # MAE & RMSE evaluation vs baseline
│   ├── test_ml.py                # Python test suite
│   └── models/                   # Serialized model artifact & metadata JSON
├── src/
│   ├── types/                    # Domain TypeScript interfaces and algorithm types
│   ├── lib/
│   │   ├── validation/schemas.ts # Zod validation schemas
│   │   ├── firebase/             # Client & Admin SDK initializers
│   │   ├── auth/serverAuth.ts    # Server-side auth verification & RBAC
│   │   ├── db/                   # Persistence store & seed service
│   │   └── algorithms/           # The 7 core algorithms in modular TypeScript
│   │       ├── wsga.ts           # Algorithm 1: WSGA & Team Coverage
│   │       ├── matching.ts       # Algorithm 2: Weighted Project Matching
│   │       ├── workload.ts       # Algorithm 3: Capacity Workload Balancing
│   │       ├── taskAllocation.ts # Algorithm 4: Constrained ILP Task Allocation
│   │       ├── talent.ts         # Algorithm 5: Available Talent Identification
│   │       ├── teamOptimization.ts # Complementary Team Selection
│   │       └── workforceScore.ts # Algorithm 7: Final Workforce Score
│   ├── components/               # Rich, modern UI components with Recharts
│   └── app/                      # App router pages & REST API Route Handlers
└── vitest.config.ts              # Vitest configuration
```
