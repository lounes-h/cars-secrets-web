/**
 * Every word the site shows, in English. Each other language is typed `Messages`, so a missing
 * or extra key fails the type check. `{name}` is filled in by `fill` or `rich`, and a
 * `{ one, other }` pair is chosen by `plural` (src/lib/i18n.ts). Auction data (makes, damage,
 * Copart's title wording) is shown as the auction gives it, so it is not here.
 */
export const en = {
  common: {
    close: "Close",
  },

  notFound: "This page could not be found.",

  site: {
    name: "Car Bid Insight",
    description:
      "Active Copart, IAA and Manheim listings in one search, with the estimated resale value, total acquisition cost, projected profit and a suggested maximum bid for every lot.",
  },

  /** Each registered page's title and description (src/lib/routes.ts), for its metadata. */
  pages: {
    "/": {
      title: "Everything You Need to Know Before Buying a Car at Auction",
      description:
        "See what a Copart, IAA or Manheim lot is worth, what it will cost to own and what to bid, before the auction closes.",
    },
    "/active-lots": {
      title: "Active lots",
      description:
        "Search active lots from Copart, IAA, Manheim and other auctions, with resale value, total cost, profit and a suggested max bid.",
    },
    "/vin-lookup": {
      title: "VIN lookup",
      description: "Look up a VIN to see the lot's history, condition and what it is worth before you bid on it.",
    },
    "/best-buys": {
      title: "Best buys",
      description: "The lots with the strongest projected profit and margin right now, ranked from the active auction listings.",
    },
    "/how-it-works": {
      title: "How it works",
      description: "How auction listings turn into a buying decision: resale value, total cost, profit, margin and a max bid.",
    },
    "/pricing": {
      title: "Pricing",
      description: "What a subscription costs, and what the seven day free trial includes.",
    },
    "/saved": {
      title: "Saved lots and searches",
      description: "The lots and searches you saved, so you can come back to them before the auction closes.",
    },
    "/alerts": {
      title: "Your alerts",
      description: "Your alerts: new lots matching your saved searches, changes to your saved lots and reminders before their auctions.",
    },
    "/settings": {
      title: "Settings",
      description: "Your settings: which alerts reach you by email, how often your search summary arrives, in which language and time zone.",
    },
    "/register": {
      title: "Create your account",
      description:
        "Create an account to search auction lots from Copart, IAA and Manheim and see resale value, total cost, profit and a suggested max bid.",
    },
    "/login": {
      title: "Sign in",
      description: "Sign in with your email and password, or continue with Google or Apple.",
    },
    "/forgot-password": {
      title: "Forgot your password",
      description: "Request a password reset link by email for your account.",
    },
    "/reset-password": {
      title: "Choose a new password",
      description: "Set a new password for your account from the link we emailed you.",
    },
    "/verify-email": {
      title: "Confirm your email",
      description: "Confirm the email address of your account with the 6-digit code we emailed you.",
    },
    "/account": {
      title: "Your account",
      description: "Your account: who you are signed in as, and where to sign out.",
    },
  },

  language: {
    title: "Choose a language:",
    /** The banner's earth button, for a screen reader: it names the language in use. */
    button: "Language: {language}",
  },

  nav: {
    main: "Main",
    account: "Account",
    activeLots: "Active lots",
    vinLookup: "VIN Lookup",
    howItWorks: "How It Works",
    pricing: "Pricing",
    saved: "Saved",
    alerts: "Alerts",
    signIn: "Sign in",
    trial: "7 days free trial",
    trialNote: "No credit cards required",
    accountMenu: "Account menu",
    /** The account menu's button when alerts are unread, for a screen reader. */
    accountMenuUnread: "Account menu, {count} unread alerts",
    unread: "{count} unread",
    settings: "Settings",
    accountPage: "Account",
    logOut: "Log out",
  },

  auth: {
    email: "Email",
    password: "Password",
    sending: "Sending…",
    registerHeading: "Start your free trial",
    loginSeparator: "or sign in with your email",
    registerSeparator: "or register with your email",
    backToSignIn: "Back to sign in",
    incompleteLink: "This link is incomplete. {link}.",
    requestNewResetLink: "Request a new reset link",
    phone: "Phone",
    notProvided: "Not provided",
    signOut: "Sign out",

    social: {
      login: { group: "Sign in with Google or Apple", google: "Sign in with Google", apple: "Sign in with Apple" },
      register: { group: "Register with Google or Apple", google: "Register with Google", apple: "Register with Apple" },
    },

    login: {
      confirmToFinish: "Confirm your email address to finish signing in.",
      remember: "Remember me",
      forgot: "Forgot your password?",
      submit: "Sign in",
      pending: "Signing in…",
      newHere: "New here? {link}",
      createAccount: "Create an account",
    },

    register: {
      firstName: "First name",
      lastName: "Last name",
      agreement: "By clicking on “Agree and register”, I agree to the Terms of Use and Privacy Policy.",
      submit: "Agree and register",
      pending: "Creating your account…",
      already: "Already registered? {link}",
      signIn: "Sign in",
    },

    phoneField: {
      label: "Phone number",
      optional: "(optional)",
      country: "Country",
      number: "Number",
    },

    passwordField: {
      show: "Show",
      hide: "Hide",
      showLabel: "Show password",
      hideLabel: "Hide password",
      capsLock: "Caps Lock is on.",
    },

    emailRequest: {
      wrongAddress: "Wrong address? {link}",
      tryAnother: "Try another one",
    },

    forgot: {
      submit: "Send reset link",
      sent: "If an account uses {email}, we sent it a link to choose a new password. The link works once and expires in 1 hour.",
    },

    resend: { submit: "Email me a code" },

    reset: {
      done: "Your password has changed, and every other session was signed out.",
      signIn: "Sign in with your new password",
      requestNewLink: "Request a new link",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      submit: "Change password",
      pending: "Changing your password…",
    },

    verify: {
      intro: "Enter the {length}-digit code we sent to {email}. It expires in 10 minutes.",
      code: "Confirmation code",
      hint: "Can’t find it? Check your spam or promotions folder.",
      submit: "Confirm my email",
      pending: "Confirming…",
      resent: "We sent a new code to {email}. Use the newest one.",
      wait: "Didn’t get it? You can ask for a new code in {seconds} s.",
      resend: "Send a new code",
      differentEmail: "Use a different email",
    },

    /** What the shared schemas (src/lib/auth-schemas.ts) say, in the browser and in the actions. */
    validation: {
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter a valid email address, like name@example.com.",
      tooLong: "Use at most {max} characters.",
      firstNameRequired: "Enter your first name.",
      lastNameRequired: "Enter your last name.",
      passwordRequired: "Enter your password.",
      phoneInvalid: "Enter a valid phone number for the country you picked.",
      phoneCountry: "Choose the country of your phone number.",
      passwordsDiffer: "The two passwords differ.",
      code: "Enter the {length}-digit code from the email.",
      correctFields: "Please correct the highlighted fields.",
    },

    /** PASSWORD_RULES, by key: the checklist's line and the error it gives. */
    passwordRules: {
      length: { text: "At least {min} characters", error: "Use at least {min} characters." },
      letter: { text: "At least one letter", error: "Add at least one letter." },
      number: { text: "At least one number", error: "Add at least one number." },
      special: { text: "At least one special character", error: "Add at least one special character." },
    },

    /** The API's error codes in words; an unknown code keeps the API's own message. */
    apiErrors: {
      not_authenticated: "Sign in to continue.",
      captcha_failed: "Please complete the captcha and try again.",
      captcha_required: "Too many attempts. Complete the captcha to continue.",
      too_many_attempts: "Too many incorrect codes. Wait 15 minutes, then request a new code.",
      invalid_code: "That code is incorrect or has expired. Check the latest email we sent, or request a new code.",
      invalid_credentials: "Incorrect email or password.",
      email_unverified: "Confirm your email address before signing in: enter the code we emailed you.",
      invalid_token: "This link is invalid or has expired.",
      validation: "Please correct the highlighted fields.",
      unavailable: "The service is temporarily unavailable. Please try again in a moment.",
    },

    /** The error codes a social sign-in brings back to /login in its URL. */
    oauthErrors: {
      invalid_state: "The sign-in attempt expired or was tampered with. Please try again.",
      provider_denied: "The sign-in was cancelled.",
      provider_not_configured: "This sign-in method is not available yet.",
      invalid_token: "The provider did not confirm your identity. Please try again.",
      email_required: "The provider did not share an email address, which we need for your account.",
      email_unverified: "That email address is not verified with the provider, so it cannot be used here.",
      unavailable: "The service is temporarily unavailable. Please try again in a moment.",
    },
    somethingWrong: "Something went wrong. Please try again.",
  },

  lots: {
    signIn: "Sign in to see the lots",
    activity: {
      label: "Lot activity",
      /** The day is not over, so today's new lots are a running count. */
      added: {
        today: { one: "{count} new lot today so far", other: "{count} new lots today so far" },
        last_3_days: { one: "{count} new lot in the last 3 days", other: "{count} new lots in the last 3 days" },
        last_7_days: { one: "{count} new lot in the last 7 days", other: "{count} new lots in the last 7 days" },
      },
      updated: {
        today: { one: "{count} lot updated today", other: "{count} lots updated today" },
        last_3_days: { one: "{count} lot updated in the last 3 days", other: "{count} lots updated in the last 3 days" },
        last_7_days: { one: "{count} lot updated in the last 7 days", other: "{count} lots updated in the last 7 days" },
      },
    },
    count: { one: "{count} lot", other: "{count} lots" },
    list: "Lots",
    noMatch: "No lots match these filters.",
    emptyPage: "No lots on this page.",
    pagination: "Pagination",
    previous: "Previous",
    next: "Next",
    range: "{first}–{last} of {total}, page {page} of {pages}",
  },

  /** What a lot is, on its card and its page. */
  lot: {
    number: "Lot {number}",
    vin: "VIN {vin}",
    primaryDamage: "Primary damage: {damage}",
    secondaryDamage: "Secondary damage: {damage}",
    notApplicable: "N/A",
    currentBid: "Current bid",
    likelyFinalBid: "Likely final bid",
    retailValue: "Retail value (ACV)",
    buyNow: "Buy now",
    noPhoto: "No photo",
    futureSale: "Future sale",
    viewDetails: "View details",
    miles: "{miles} mi",
    cylinders: "{cylinders}-cyl",
    dealBreakers: "Deal breakers",
  },

  lotPage: {
    description:
      "Everything the auction publishes about this lot: the car, its damage, title, odometer, where it sells and what it is bid up to.",
    signIn: "Sign in to see this lot",
    copyLotNumber: "lot number",
    copyVin: "VIN",
    viewOn: "View on {auction}",
    biddingOn: "Bidding happens on {auction}'s own site.",
    odometer: "{odometer} ({status})",
    dealCalculator: "Deal calculator",
    likelyFinalBid: "Likely final bid: {amount}",
    notAvailable: "Not available",
    figures: "Current bid {bid} · Retail value (ACV) {retail}",
    buyNow: "Buy now {amount}",
    condition: "Condition",
    paperwork: "Paperwork",
    pickup: "Pickup",
    primaryDamage: "Primary damage",
    secondaryDamage: "Secondary damage",
    repairEstimate: "Repair estimate",
    title: "Title",
    odometerLabel: "Odometer",
    odometerStatus: "Odometer status",
    yard: "Yard",
    yardCode: "yard {code}",
    address: "Address",
    offsiteAddress: "Offsite address",
    specs: "Specs",
    engine: "Engine",
    transmission: "Transmission",
    fuel: "Fuel",
    color: "Color",
    bodyStyle: "Body style",
    vehicleType: "Vehicle type",
    modelDetail: "Model detail",
    saleInfo: "Sale info",
    auction: "Auction",
    seller: "Seller",
    currency: "Currency",
    updatedOn: "Updated on {auction}",
    added: "Added to this site",
    lastChange: "Last change seen",
    noPhotos: "The auction has published no photos of this lot.",
    photos: "Photos of lot {number}",
    photo: "{vehicle}, lot {number}, photo {index} of {count}",
    showPhoto: "Show photo {index}",
    gallery: "Gallery",
    photosTab: "Photos",
    damageMapTab: "Damage map",
    copy: "Copy",
    copied: "Copied",
    copyLabel: "Copy {label}",
    countdown: {
      passed: "Sale time has passed",
      days: "Sells in {days}d {hours}h",
      hours: "Sells in {hours}h {minutes}m",
    },
  },

  /** The words for the auction's codes (src/lib/lot-words.ts), by the key each code maps to. */
  signals: {
    runsAndDrives: "Runs and drives",
    startsOnly: "Engine starts only",
    notVerified: "Not verified to start",
    keys: "Keys",
    noKeys: "No keys",
    keysExempt: "Keys exempt",
    keysNotStated: "Keys not stated",
    actualMileage: "Actual mileage",
    mileageExempt: "Mileage exempt",
    mileageNotReal: "Mileage not real",
    exceedsLimits: "Exceeds mechanical limits",
    mileageNotStated: "Mileage status not stated",
    pureSale: "Pure sale",
    minimumBid: "Minimum bid",
    sellerApproval: "Seller must approve",
    saleNotStated: "Sale status not stated",
    titleNotStated: "Title not stated",
    sellerNotStated: "Seller not stated",
    insuranceSeller: "Insurance seller",
    notInsuranceSeller: "Not an insurance seller",
    offsite: "Offsite",
    atYard: "At the yard",
  },

  /** Copart's vehicle type codes in copart.com's words, made singular. */
  vehicleTypes: {
    V: "Automobile",
    K: "Medium duty / box truck",
    U: "Heavy duty truck",
    B: "Bus",
    R: "Recreational vehicle (RV)",
    L: "Trailer",
    C: "Motorcycle",
    D: "Dirt bike",
    A: "ATV",
    S: "Snowmobile",
    M: "Boat",
    J: "Jet ski",
    E: "Industrial equipment",
    N: "Construction equipment",
    F: "Agriculture and farm equipment",
    H: "Other goods",
    I: "Inspection",
  },

  /** The lot list's search, filters and order (src/lib/lot-filters.ts, src/components/LotFilters.tsx). */
  filters: {
    labels: {
      vehicle_type: "Vehicle type",
      make: "Make",
      model: "Model",
      year: "Year",
      mileage: "Mileage",
      run: "Runs and drives",
      damage: "Damage",
      damage2: "Secondary damage",
      keys: "Keys",
      bid: "Current bid",
      bin: "Buy now price",
      retail: "Retail value",
      sale: "Sale date",
      title: "Title",
      sale_type: "Sale type",
      buy_now: "Buy now available",
      source: "Auction",
      state: "State or province",
      location: "Yard or offsite",
    },
    /** Fixed options' words; `chip` is how a chosen one reads above the lots, when not the same. */
    options: {
      sale: {
        today: { label: "Today", chip: "Sells today" },
        tomorrow: { label: "Tomorrow", chip: "Sells tomorrow" },
        this_week: { label: "This week", chip: "Sells this week" },
        next_week: { label: "Next week", chip: "Sells next week" },
        // Copart's own name for a lot it has given no sale day yet, as the lot page says.
        future: { label: "Future sale" },
      },
      title: {
        salvage: { label: "Salvage", chip: "Salvage title" },
        clean: { label: "Clean", chip: "Clean title" },
        nonrepairable: { label: "Non-repairable", chip: "Non-repairable title" },
      },
      location: {
        yard: { label: "At the yard" },
        offsite: { label: "Offsite" },
      },
    },
    groups: {
      vehicle: "Vehicle",
      condition: "Condition",
      price: "Price",
      sale: "Sale",
      location: "Location",
    },
    sorts: {
      newest: "Newest listed",
      sale: "Sale soonest",
      year: "Year, newest first",
      mileage: "Mileage, lowest first",
      retail: "Retail value, lowest first",
    },
    any: { make: "Any make", model: "Any model" },
    searchLabel: "Search lots",
    searchPlaceholder: "Make, model, year, VIN, lot number or keyword",
    search: "Search",
    filters: "Filters",
    allFilters: "All filters",
    show: "Show {lots}",
    hide: "Hide filters",
    showFilters: "Show filters",
    remove: "Remove {chip}",
    clearAll: "Clear all",
    sort: "Sort",
    loading: "Loading…",
    anyDay: "Any day",
    anyYear: "Any",
    from: "From",
    to: "To",
    upTo: "Up to",
    units: { year: "", mi: " (miles)", $: " ($)" },
    apply: "Apply",
    chipSearch: "“{q}”",
    chipRange: "{label} {span}",
    chipValue: "{label}: {value}",
    spanBoth: "{low}–{high}",
    spanFrom: "from {low}",
    spanUpTo: "up to {high}",
  },

  /** The lot page's premium sections: their headings, and the words of the sample lot. */
  premium: {
    badge: "Premium",
    sampleNote: "Sample figures, the same on every lot, while this is being built.",
    summary: "Summary",
    bestFor: "Best for: {use}",
    damageMap: "Damage map: {areas}",
    front: "Front",
    rear: "Rear",
    damageReport: "Damage report",
    primary: "Primary",
    secondary: "Secondary",
    insurerEstimate: "Insurer repair estimate",
    area: "Area",
    seen: "What we see",
    severity: "Severity",
    ourEstimate: "Our estimate",
    total: "Total",
    usedParts: "used parts",
    whyLower: "Why lower than the insurer? Insurer estimates use new parts and body-shop labor.",
    market: "Market",
    value: "Value",
    acv: "Copart ACV",
    cleanRetail: "Clean-title retail",
    salvageResale: "Resale with salvage title",
    howItSells: "How it sells",
    demand: "Demand",
    daysToSell: "Avg. time to sell",
    days: "{days} days",
    similarSold: "Similar lots sold (90 days)",
    /** The sample lot of src/lib/premium-sample.ts, in words; its areas in the same order. */
    sample: {
      summary:
        "High-mileage GT hit front and rear. The engine starts but the car does not drive, so budget for a possible mechanical issue. The insurer's repair estimate is higher than the car's value, so it only makes sense as a DIY rebuild with used parts.",
      bestFor: "DIY rebuild or parts",
      primary: "Rear end",
      secondary: "Front end",
      demand: "High",
      areas: [
        { area: "Front left", seen: "Bumper, headlight, fender", severity: "Severe" },
        { area: "Rear right", seen: "Bumper cover, quarter panel", severity: "Moderate" },
        { area: "Drivetrain", seen: "Starts, does not drive", severity: "Unknown" },
      ],
    },
    deal: {
      maxBid: "Your max bid: {amount}",
      fees: "Fees (calculated)",
      shipping: "Shipping to you",
      repair: "Repair (our estimate)",
      totalCost: "Total cost",
      resale: "Resale after repair",
      profit: "Est. profit",
      maxBidFor: "Max bid for {target} profit: {bid}",
      note: "Calculator costs and profit use sample figures, the same on every lot, while this is being built.",
    },
  },

  /** Save / Saved on a lot, and the Saved page (src/app/[lang]/saved). */
  saved: {
    lede: "The lots and searches you saved, with the alerts and reminders you set on each.",
    signIn: "Sign in to see what you saved",
    tabs: "Saved lots and searches",
    lotsTab: "Lots · {count}",
    searchesTab: "Searches · {count}",
    noLots: "No saved lots yet. Use Save on a lot to keep it here.",
    noSearches: "No saved searches yet. Set the filters on Active lots, then use Save search.",
    save: "Save",
    saved: "Saved",
    unavailable: "No longer listed",
    unavailableNote: "The auction no longer lists this lot, which does not mean it sold.",
    changeAlerts: "Email me when the auction date or Buy now price changes",
    /** The same for a lot without a Buy now price. */
    changeAlertsDate: "Email me when the auction date changes",
    errors: {
      lots: "An account keeps up to 500 saved lots. Remove one to save another.",
      searches: "An account keeps up to 50 saved searches. Delete one to save another.",
      gone: "The auction no longer lists this lot.",
      failed: "That did not work. Please try again.",
    },
  },

  /** The Remind me dialog and a saved lot's reminder status (src/components/LotWatch.tsx). */
  reminders: {
    button: "Remind me",
    title: "Remind me before the auction",
    starts: "The auction starts {time}.",
    waiting: "The auction has no start time yet. Your reminders wait for one, and follow it if it moves.",
    hour: "1 hour before the auction",
    day: "1 day before the auction",
    passed: "Already passed",
    note: "Reminders are for the auction's scheduled start, not for when this lot comes up.",
    alsoSaves: "Saving reminders also saves this lot.",
    submit: "Save reminders",
    status: "Reminders: {list}",
    statusWaiting: "Reminders: {list}, waiting for the auction time",
    short: { hour: "1 hour before", day: "1 day before" },
    shortPassed: "{reminder} (passed)",
  },

  /** Save search on Active lots, and the Saved page's searches (src/components/SavedSearches.tsx). */
  searches: {
    save: "Save search",
    /** Save search's words while the filters on screen are a saved search's. */
    edit: "Edit search",
    /** The menu of the dealer's saved searches beside it. */
    mine: "Saved searches",
    saveChanges: "Save changes",
    createTitle: "Save this search",
    editTitle: "Edit saved search",
    name: "Name",
    alerts: "Email me new matches",
    alertsNote: "Lots listed from now on that match, in your search summary.",
    create: "Save search",
    update: "Save changes",
    saveAsNew: "Save as a new search",
    editing: "Editing “{name}”",
    stopEditing: "Stop editing",
    allLots: "All lots",
    noFilters: "Every active lot",
    editFilters: "Edit filters",
    rename: "Rename",
    delete: "Delete",
    deleteTitle: "Delete “{name}”?",
    deleteNote: "Its alerts stop. Lots you saved stay saved.",
    confirmDelete: "Delete search",
    cancel: "Cancel",
  },

  /** The Alerts page (src/app/[lang]/alerts): the inbox, as the API groups it. */
  alerts: {
    lede: "New lots matching your saved searches, changes to your saved lots and your auction reminders, newest first.",
    signIn: "Sign in to see your alerts",
    kinds: { all: "All", matches: "New matches", changes: "Lot changes", reminder: "Reminders" },
    filter: "Kind of alert",
    list: "Alerts",
    markAllRead: "Mark all as read",
    unread: "Unread",
    empty: "No alerts yet. Turn on alerts for a saved search, or changes and reminders for a saved lot.",
    emptyKind: "No alerts of this kind yet.",
    matches: { one: "1 new lot matches your saved searches", other: "{count} new lots match your saved searches" },
    search: { one: "{name}: 1 new lot", other: "{name}: {count} new lots" },
    alsoMatches: "Also matches: {names}",
    seeAll: "See all {count}",
    changes: { one: "A saved lot changed", other: "{count} saved lots changed" },
    reminder: { hour: "Auction reminder, 1 hour before", day: "Auction reminder, 1 day before" },
    starts: "The auction starts {time}.",
    sale: "Auction: {from} → {to}",
    /** The same for a future sale given its date. */
    saleSet: "Auction date set: {to}",
    buyNow: "Buy now: {from} → {to}",
    notOffered: "not offered",
  },

  /** The Settings page (src/app/[lang]/settings): which alerts are emailed, and when. */
  settings: {
    lede: "Choose which alerts we email you and when your search summary arrives. Every alert also stays on your Alerts page.",
    signIn: "Sign in to change your settings",
    email: "Email alerts",
    emailMe: "Email me about",
    matches: "New lots matching my saved searches",
    changes: "Changes to my saved lots",
    reminders: "My auction reminders",
    summary: "Search summary",
    once: "Once a day, at 7 AM",
    twice: "Twice a day, at 7 AM and 5 PM",
    language: "Email language",
    timeZone: "Time zone",
    timeZoneNote: "Your summary times and every time in our emails are in this zone.",
    save: "Save settings",
    saved: "Settings saved.",
    failed: "That did not work. Please try again.",
  },
};

export type Messages = typeof en;
