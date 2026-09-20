# Car’s Secrets — Project Specification

## 1. Project Overview

**Car’s Secrets** is a vehicle-auction discovery and intelligence platform that aggregates active and upcoming vehicle listings from multiple auction sources such as **Copart, IAA, Manheim**, and potentially other auction marketplaces into one searchable interface.

The platform is designed to save buyers and dealers time by eliminating the need to search multiple auction websites separately. Users will also be able to search directly by **VIN** to quickly locate a specific vehicle across supported auction sources.

In addition to displaying auction listings, Car’s Secrets will provide decision-support information that helps users understand whether a vehicle may be a good purchase and how much they should consider paying.

The core question the product should help answer is:

> **“Is this vehicle worth buying, and how much should I pay for it?”**

Car’s Secrets does **not** conduct auctions or place bids. Users will be redirected to the original auction provider when they are ready to bid or purchase a vehicle.

---

## 2. Primary Goals

Car’s Secrets should provide users with:

- One unified search experience across multiple vehicle auctions.
- VIN lookup across supported auction sources.
- Normalized vehicle and auction information regardless of the original source.
- Fast discovery of newly listed and upcoming auction vehicles.
- Estimated final auction price.
- Estimated retail / resale market value.
- Auction fee calculations.
- Estimated transportation and acquisition costs.
- Estimated repair or reconditioning cost where sufficient information exists.
- Estimated total investment in the vehicle.
- Potential profit and profit margin.
- Suggested maximum bid.
- Comparable vehicles and market pricing.
- AI-generated vehicle summaries.
- AI-generated risk flags and opportunity insights.
- Saved vehicles.
- Saved searches.
- Alerts for newly listed vehicles and important listing changes.
- Direct links to the original auction listing.

The platform should prioritize **useful buying decisions**, rather than simply duplicating information that already exists on auction websites.

---

## 3. Target Users

The primary users are:

**Independent used-car dealers**  
Dealers looking for inventory across multiple auction platforms.

**Salvage/rebuilder dealers**  
Buyers looking specifically for repairable Copart and IAA vehicles.

**Wholesalers and vehicle flippers**  
Users searching for vehicles that can potentially be resold profitably.

**Exporters**  
Buyers looking for vehicles suitable for international resale.

**Professional auction buyers**  
Users regularly monitoring large numbers of auction listings.

The system may also be useful to individual buyers, but the primary product experience should be designed around professional and frequent buyers.

---

## 4. User Access Levels

Car’s Secrets will support four user levels.

| User Type | Purpose |
|---|---|
| **Guest** | Allow visitors to discover the platform before creating an account |
| **Registered** | Free account with basic personalization features |
| **Pro** | Paid plan with advanced vehicle intelligence |
| **Premium** | Highest tier with deeper analytics, higher limits, and advanced tools |

Exact limits should remain configurable rather than hardcoded.

A possible initial access model is:

| Feature | Guest | Registered | Pro | Premium |
|---|:---:|:---:|:---:|:---:|
| Browse auction listings | ✓ | ✓ | ✓ | ✓ |
| Basic search/filtering | ✓ | ✓ | ✓ | ✓ |
| VIN lookup | Limited | ✓ | ✓ | ✓ |
| Vehicle details | Limited | ✓ | ✓ | ✓ |
| Save vehicles | — | ✓ | ✓ | ✓ |
| Saved searches | — | Limited | ✓ | ✓ |
| Alerts | — | Limited | ✓ | ✓ |
| Auction fee estimate | Basic | Basic | ✓ | ✓ |
| Estimated final auction price | — | Limited | ✓ | ✓ |
| Market/resale value | — | Limited | ✓ | ✓ |
| AI vehicle summary | — | Limited | ✓ | ✓ |
| Risk/opportunity insights | — | — | ✓ | ✓ |
| Suggested maximum bid | — | — | ✓ | ✓ |
| Profit estimate | — | — | ✓ | ✓ |
| Comparable vehicles | — | Limited | ✓ | ✓ |
| Advanced analytics | — | — | Limited | ✓ |
| Higher usage limits | — | — | ✓ | ✓ |

The entitlement system should be flexible so features and limits can be changed without restructuring the application.

---

## 5. Auction Sources

The platform should be designed around a provider-independent model.

Initial target sources:

- Copart
- IAA
- Manheim

Possible future sources:

- OPENLANE / ADESA
- SmartAuction
- Auction Edge
- ACV
- EBlock
- Other wholesale and salvage auctions

Source-specific fields should be normalized before they are presented to users.

---

## 6. Vehicle Listing Preview

The listing preview should answer:

> **“Is this vehicle worth opening?”**

Each listing card should prioritize the information most useful for making a quick buying decision.

Suggested information:

```text
Vehicle photo

2022 Toyota Camry SE

Copart
Raleigh, NC
42 miles away

Current Bid              $7,800
Suggested Max Bid        $9,400

Estimated Market Value  $17,500
Estimated Total Cost    $11,600
Potential Profit         $5,900
Profit Margin               34%

48,200 miles
Front End Damage
Salvage Title

Run & Drive
Keys Available
Buy Now

Auction:
Tomorrow • 10:00 AM

Profit Score: 91/100
```

The listing card should be easy to scan quickly, especially when users are reviewing dozens or hundreds of vehicles.

---

## 7. Vehicle Details Page

The details page should answer:

> **“Should I bid on this vehicle?”**

The page should contain several major information areas.

### Vehicle identity

Year, make, model, trim, VIN, body type, engine, transmission, drivetrain, fuel type, color, and mileage.

### Auction information

Auction provider, lot/stock number, auction location, auction date/time, lane/item number where available, current bid, Buy Now price, reserve status where available, seller information, and listing status.

### Condition

Primary damage, secondary damage, title type, title state, keys availability, run-and-drive status, starts status, odometer status, and other source-specific condition information.

### Photos

A responsive vehicle image gallery showing all legally available listing photographs.

### Deal Analysis

This should be one of the most prominent sections of the page.

Example:

```text
Current Bid                    $7,800

Suggested Maximum Bid          $9,400

If purchased for $9,400:

Auction Fees                   $1,350
Transportation                   $420
Estimated Repairs              $2,100
Other Estimated Costs              $0
────────────────────────────────────
Estimated Total Cost          $13,270

Estimated Resale Value        $18,900
────────────────────────────────────
Potential Profit               $5,630
Profit Margin                   29.8%

Profit Score                   91/100
Confidence                       High
```

Users should clearly understand that these numbers are **estimates**, not guarantees.

The Confidence row is defined in Section 14, and carries the lowest confidence of the
figures above it.

---

## 8. VIN Lookup

Users should be able to enter a VIN directly and search for matching active listings across all supported auction sources.

VIN lookup should:

- Search across all supported auction providers.
- Return the current active listing or listings associated with the VIN.
- Clearly identify the auction source.
- Show the lot or stock number.
- Show the auction date, location, current bid, Buy Now price where available, mileage, title, damage, photos, and other available listing data.
- Link directly to the full Car’s Secrets vehicle detail page.
- Provide a direct link to the original auction listing.
- Respect feature and usage limits based on the user’s subscription level.

VIN lookup is intended primarily as a fast discovery tool for current and upcoming auction inventory. Historical auction data is not required for the initial version.

---

## 9. Search and Filtering

Users should eventually be able to search across all supported auctions simultaneously.

Important filters include auction source, year, make, model, trim, mileage, title status, damage type, auction location, distance, sale date, current bid, Buy Now price, estimated market value, estimated profit, profit margin, total acquisition cost, and profit score.

Useful sorting options include:

- Highest expected profit
- Highest profit margin
- Highest profit score
- Lowest current bid
- Lowest total acquisition cost
- Soonest auction
- Newest listings
- Closest vehicles
- Highest estimated market value

---

## 10. Saved Vehicles and Watchlists

Registered users should be able to save vehicles.

Saved vehicles may later track changes such as:

- Current bid changed
- Auction date changed
- Buy Now price changed
- Vehicle was sold
- Vehicle was removed
- Vehicle was relisted
- Auction is starting soon

The dashboard should provide a centralized view of all watched vehicles.

---

## 11. Saved Searches and Alerts

Users should be able to save commonly used search criteria.

Example:

```text
Toyota Camry
2021–2025
Under 70,000 miles
Within 300 miles
Maximum estimated total cost: $15,000
Minimum expected profit: $3,000
```

When a matching vehicle appears, Car’s Secrets can notify the user.

Future notification channels may include:

- In-app
- Email
- Push notifications
- SMS

Availability may depend on subscription level.

---

## 12. Vehicle Intelligence

Car’s Secrets should provide information beyond the auction source's raw listing.

Every value in this section is governed by Section 14, which defines where it comes
from, how accurate it is known to be, and how that is shown to the buyer.

Important calculated or enriched values include:

### Estimated Final Auction Price

Prediction of the likely final selling price.

### Estimated Market Value

Estimated retail or resale value based on available market information.

### Auction Fees

Estimated buyer fees based on the auction source and predicted purchase price.

### Transportation Cost

Estimated cost of transporting the vehicle from the auction location.

### Repair / Reconditioning Estimate

Estimated repair costs when sufficient condition information is available.

### Estimated Total Acquisition Cost

```text
Purchase price
+ auction fees
+ transportation
+ repairs
+ additional costs
= estimated total cost
```

### Potential Profit

```text
Estimated resale value
- estimated total cost
= estimated profit
```

### Suggested Maximum Bid

The maximum purchase price that still satisfies a target profit or margin.

---

## 13. AI Features

AI should enhance the decision-making experience rather than exist simply as a chatbot.

Possible AI-generated information:

- Vehicle summary
- Damage summary
- Important listing details
- Potential concerns
- Positive indicators
- Risk flags
- Questions the buyer should investigate
- Comparison with similar listings
- Explanation of why the vehicle received its profit score

Example:

> **AI Summary:**  
> This Camry appears attractive because of its relatively low mileage, strong resale market, and moderate front-end damage. The current bid remains below the estimated profitable purchase range. Main risks are possible cooling-system damage and the salvage title. Based on current estimates, the vehicle remains attractive below approximately $9,400.

AI-generated information should always be clearly labeled as an estimate or analysis.

Section 14 defines what that analysis may claim, what it may not, and how it is held to
the same confidence rating as the computed estimates.

---

## 14. Estimate Quality and Confidence

Section 21 positions Car’s Secrets on decision intelligence rather than
aggregation. That makes the estimates the product, and an estimate nobody can
audit is worth less than no estimate at all: a dealer burned once by a
confident wrong number stops trusting every number on the page.

This section defines where each figure comes from, how good it is known to be,
and how both are communicated. It governs every value in Section 12 and every
sentence in Section 13.

---

### Where each estimate comes from

| Estimate | Primary inputs | Nature |
|---|---|---|
| Auction fees | The source’s published buyer fee schedule, applied to the purchase price | Deterministic |
| Transportation | Distance from the auction location to the buyer’s base, lot class, whether it runs | Deterministic given a base |
| Estimated market / resale value | Recent comparable sales and retail listings for the same year, make, model, trim, mileage band, condition and region | Modelled |
| Estimated final auction price | Historical results for similar lots at the same source and location, current bid trajectory, time to sale | Modelled |
| Repair / reconditioning | Declared primary and secondary damage, severity, assessable photos, model-specific parts and labour cost | Weakest |

These are not equally knowable, and the product should never imply that they
are. Auction fees are arithmetic on a published schedule. A repair estimate
drawn from a damage code and four photographs is a guess with a wide
distribution. Presenting both at the same weight, in the same column, with no
distinction, is the easiest way to mislead a buyer.

---

### What an estimate may and may not use

An estimate may use:

- Normalized listing fields from the source (Section 5).
- The platform’s own history for that source, location and segment.
- Market data the platform is licensed to use.
- The buyer’s own inputs, such as their labour rate, transport base or target margin.

An estimate must not use:

- Another user’s private data, saved searches or activity.
- A value invented to fill a missing input.
- An extrapolation beyond what the inputs support.

**Every estimate must be reproducible.** The inputs, the method and the method
version are recorded alongside the figure. If a number cannot be recomputed
later and explained in plain language, it must not be shown.

---

### One confidence rating

The platform uses a single confidence scale, and the same scale applies to
computed estimates and to AI-generated analysis. Two different meanings of
“confidence” in one product is a defect.

| Rating | Meaning |
|---|---|
| **High** | Inputs complete, enough close comparables, method deterministic or validated in this segment |
| **Medium** | Inputs partial or comparables thin. Shown as a range, not a point |
| **Low** | Key inputs missing or contradictory. Shown as a wide range, or withheld |
| **Unavailable** | Cannot be estimated responsibly. Shown as “not enough information” — never as $0, a blank or a dash |

Three rules make the rating mean something:

1. **Confidence travels with the number.** It appears next to the figure it
   describes, not once in a legend at the bottom of the page.
2. **A derived figure inherits the lowest confidence of its inputs.** Estimated
   total cost cannot be High while the repair estimate inside it is Low. The
   same applies to potential profit, profit margin and suggested maximum bid.
3. **Nothing downstream may claim more.** The profit score of Section 15 and
   the analysis of Section 13 must not be presented more confidently than the
   figures they are built from.

---

### AI analysis is held to the same bar

Section 13 describes what the AI produces. This is what it is accountable for.

- **Grounded only in what the platform holds.** The normalized listing, its
  photographs and the computed estimates of Section 12. No claim about a
  specific lot may come from anywhere else.
- **No invented condition facts.** “Worth checking the cooling system given the
  front-end impact” is a question to investigate, and is allowed. “The radiator
  is damaged” is a condition claim, and is allowed only where the listing
  declares it.
- **Figures are cited, not restated.** Where the analysis names a number it
  must reference the computed value, so the prose can never contradict the
  table beside it. In the Section 13 example, the “approximately $9,400” must
  *be* the suggested maximum bid from Section 12, not a figure the model
  produced.
- **Always labelled**, always carrying its confidence, never phrased as a
  guarantee and never as advice to buy.
- **Reportable.** Buyers need a visible way to flag a summary as wrong, and
  those reports feed the accuracy review below.
- **Silent when the inputs are.** Where confidence is Unavailable there is no
  AI summary either. A fluent paragraph about a lot the platform knows little
  about is the most dangerous output it can produce.

---

### Measuring accuracy

A confidence rating that is never checked is decoration.

- Every figure shown to a buyer is recorded with its inputs, method version and
  rating.
- When a lot sells, the realized price is captured and compared against what
  was estimated.
- Accuracy is reviewed per estimate type, per source and per segment, using
  median absolute error and the share of estimates within a stated tolerance.
- **Confidence itself is calibrated.** High-confidence estimates must be right
  more often than Medium ones. Where they are not, the rating is wrong and is
  corrected before the model is.
- A method version whose error degrades past an agreed threshold is rolled
  back, and its confidence is downgraded until it is fixed.

---

### What the buyer sees

- Estimated figures are labelled “estimated”, never presented as “value” or
  “price” alone.
- Anything below High confidence is shown as a range.
- Every estimate offers “How is this calculated?”, showing its inputs and
  method in plain language.
- Buyers can replace the platform’s assumptions with their own labour rate,
  transport base and target margin. Overridden figures are marked as theirs.
- Estimates are decision support, not investment advice. The platform does not
  tell anyone to buy.
- Disclaimers sit at the point of the number, not only in a footer.

---

### When the platform shows nothing

Withholding beats guessing. No figure is shown when there are too few
comparables, the odometer or damage data is contradictory, the lot is too
unusual to model, or the source data is older than the platform’s freshness
limit. In each case the interface states that the estimate is unavailable, and
what would be needed to produce one.

---

## 15. Profit / Opportunity Scoring

Each vehicle may eventually receive a score designed to help users prioritize inventory.

Example:

```text
Profit Score: 91/100
```

The score could consider:

- Expected profit
- Profit margin
- Market demand
- Vehicle liquidity
- Estimated repair cost
- Damage severity
- Price confidence
- Mileage
- Distance / transportation cost
- Auction price
- Comparable vehicles
- Days-to-sale expectations

The scoring algorithm should remain configurable.

A score is only as good as the estimates beneath it, so it carries the confidence rules
of Section 14 and is never presented more confidently than its inputs.

---

## 16. Dashboard

Registered users should eventually have a personalized dashboard containing:

- Saved vehicles
- Saved searches
- Upcoming watched auctions
- Recent alerts
- New matching vehicles
- Recommended vehicles
- Top opportunities
- Recently viewed vehicles

Pro and Premium users may receive more advanced intelligence such as personalized recommendations.

---

## 17. Original Auction Integration

Car’s Secrets does **not** conduct auctions.

There should be no native bidding during the initial product phase.

The workflow is:

```text
Discover vehicle
      ↓
Analyze vehicle
      ↓
Calculate costs/profit
      ↓
Determine maximum bid
      ↓
Open original auction
      ↓
Bid directly through Copart / IAA / Manheim
```

Vehicle pages should therefore have prominent actions such as:

- View on Copart
- View on IAA
- View on Manheim

---

## 18. SEO Strategy

SEO should be treated as a core technical requirement from the beginning.

Future publicly indexable pages may include:

```text
/auction/copart
/auction/iaa
/auction/manheim

/make/toyota
/make/honda

/model/toyota/camry
/model/ford/f-150

/location/north-carolina
/location/texas

/vehicle/copart/12345678
```

Pages should support server-side rendering or static rendering where appropriate.

SEO requirements include unique metadata, canonical URLs, semantic HTML, structured data where appropriate, Open Graph metadata, sitemap generation, robots configuration, breadcrumb navigation, descriptive URLs, image optimization, fast page rendering, and strong Core Web Vitals.

Sensitive or user-specific pages such as dashboards, account pages, saved searches, and billing pages should not be indexed.

---

## 19. MVP Scope

The first version should remain focused.

A reasonable MVP would contain:

- Active auction listings
- Unified search
- VIN lookup
- Basic filters
- Vehicle detail pages
- Auction photos
- Current bid / Buy Now
- Auction date and location
- Basic fee calculator
- Estimated market value
- Estimated potential profit
- Suggested maximum bid
- Saved vehicles
- Basic alerts
- User accounts
- One or two paid subscription tiers
- Links to original auction platforms

Advanced features can follow after actual users demonstrate demand.

---

## 20. Out of Scope for Initial Version

The initial version should **not** attempt to implement:

- Native auction bidding
- Vehicle purchasing
- Escrow
- Dealer financing
- Transportation marketplace
- Full historical auction archive
- Complex AI automation
- Dealer management system
- Inventory management
- CRM
- Native mobile applications

These can be evaluated later.

---

## 21. Product Positioning

Car’s Secrets should not position itself simply as:

> **“All auctions in one place.”**

That is useful but relatively easy for competitors to replicate.

The stronger positioning is:

> **“Find the vehicles worth buying.”**

Or more explicitly:

> **Car’s Secrets searches multiple vehicle auctions and helps buyers understand what a car is worth, what it will really cost, and how much they should bid.**

The long-term product advantage should come from **decision intelligence**, not merely auction aggregation.
