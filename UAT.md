# UAT Report – Ownership Concentration Dashboard 

## Test Environment

* Application: Ownership Concentration Dashboard
* Frontend: Next.js
* Backend: FastAPI
* Data Sources: SEC EDGAR (Mock), OpenCorporates (Mock), Synthetic Voting Rights

---

# 1. Dashboard Navigation

| ID     | Test Scenario       | Expected Result                          | Status |
| ------ | ------------------- | ---------------------------------------- | ------ |
| UAT-01 | Open dashboard      | Dashboard loads successfully             | Pass   |
| UAT-02 | Switch between tabs | Tab content changes without page refresh | Pass   |
| UAT-03 | Verify 70/30 layout | Main stage and sidebar display correctly | Pass   |

---

# 2. Filter Functionality

| ID     | Test Scenario                          | Expected Result                              | Status |
| ------ | -------------------------------------- | -------------------------------------------- | ------ |
| UAT-04 | Change ticker (NVDA, GOOG, META, AMZN) | Charts, tables, and metrics update correctly | Pass   |
| UAT-05 | Filter by Institutional holders        | Only institutional holders displayed         | Pass   |
| UAT-06 | Filter by Insider holders              | Only insider holders displayed               | Pass   |
| UAT-07 | Reset to All holders                   | Full holder registry restored                | Pass   |
| UAT-08 | Verify filters persist across tabs     | Selected filters remain active               | Pass   |

---

# 3. Concentration Analysis

| ID     | Test Scenario                   | Expected Result                                    | Status |
| ------ | ------------------------------- | -------------------------------------------------- | ------ |
| UAT-09 | View holder concentration chart | Economic ownership percentages displayed correctly | Pass   |
| UAT-10 | Verify holder registry table    | Holder details displayed accurately                | Pass   |
| UAT-11 | Hover over chart elements       | Tooltip displays holder information                | Pass   |

---

# 4. Voting vs Economic Analysis

| ID     | Test Scenario                  | Expected Result                                    | Status |
| ------ | ------------------------------ | -------------------------------------------------- | ------ |
| UAT-12 | Open Voting tab                | Voting and economic ownership comparison displayed | Pass   |
| UAT-13 | Verify Vote Premium values     | Vote/equity ratios shown correctly                 | Pass   |
| UAT-14 | Verify Share Class donut chart | Share class distribution displayed correctly       | Pass   |
| UAT-15 | Verify synthetic labels        | Synthetic voting data clearly labeled              | Pass   |

---

# 5. Compare Entities

| ID     | Test Scenario             | Expected Result                                  | Status |
| ------ | ------------------------- | ------------------------------------------------ | ------ |
| UAT-16 | Open Compare Entities tab | Entity comparison cards load correctly           | Pass   |
| UAT-17 | Verify comparison metrics | HHI, voting ratio, and control metrics displayed | Pass   |

---

# 6. Control Alerts

| ID     | Test Scenario                      | Expected Result                             | Status |
| ------ | ---------------------------------- | ------------------------------------------- | ------ |
| UAT-18 | Open Control Alerts tab            | Alert cards display correctly               | Pass   |
| UAT-19 | Verify HHI threshold visualization | HHI scores plotted against threshold line   | Pass   |
| UAT-20 | Verify alert severity colors       | Critical, High, Medium, Low shown correctly | Pass   |

---

# 7. Intelligence & Governance

| ID     | Test Scenario               | Expected Result                                   | Status |
| ------ | --------------------------- | ------------------------------------------------- | ------ |
| UAT-21 | View Event Replay section   | Historical ownership events displayed             | Pass   |
| UAT-22 | View Emitted Fields section | Data dictionary displayed with source information | Pass   |
| UAT-23 | Verify Partner Chain        | Data flow visualization displayed correctly       | Pass   |
| UAT-24 | Verify Privacy section      | Privacy implications listed with risk levels      | Pass   |
| UAT-25 | Verify Mitigation Tips      | Governance recommendations displayed              | Pass   |

---

# 8. Export & Data Sources

| ID     | Test Scenario             | Expected Result                                         | Status |
| ------ | ------------------------- | ------------------------------------------------------- | ------ |
| UAT-26 | Export sample JSON        | Ownership snapshot downloads successfully               | Pass   |
| UAT-27 | Verify source attribution | SEC EDGAR, OpenCorporates, and Synthetic labels visible | Pass   |

---

# UAT Summary

| Category                  | Tests  | Passed | Failed |
| ------------------------- | ------ | ------ | ------ |
| Navigation                | 3      | 3      | 0      |
| Filters                   | 5      | 5      | 0      |
| Concentration Analysis    | 3      | 3      | 0      |
| Voting Analysis           | 4      | 4      | 0      |
| Compare Entities          | 2      | 2      | 0      |
| Control Alerts            | 3      | 3      | 0      |
| Intelligence & Governance | 5      | 5      | 0      |
| Export & Sources          | 2      | 2      | 0      |
| **Total**                 | **27** | **27** | **0**  |

## Final UAT Result

**PASS**

The Ownership Concentration Dashboard successfully meets the functional requirements for the POC. Core dashboard navigation, filtering, ownership analysis, voting-rights visualization, control alerts, intelligence features, and data export functionality operate as expected using mock SEC EDGAR and OpenCorporates datasets.
