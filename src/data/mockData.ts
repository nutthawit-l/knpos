export const LOGIN_DATA = {
  logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD45fgGO0IiWJ1m8SJp3dONOfPMqOS4Y2LoUTcambXGHCkU4Sr9siiq-fWzx_d_bIaKI9U6qICQ-ToMYVXt4qdkSDmpm3_R1WpA8ZInZgaioaFs3jZS3dOISdwr6y0isAwfyxuou3mSfY7ud03EkWu66a1TZP3nYGmatJn8NxMoOHG3MBD_i_wWRn0M5Ge3dK32WNpQHA8Tyx08PVf03Y9xaD0EbFnJWhYXqoZ6b8YClLp0hBsWf-9KeF8VX6_aIp9DteId8Wc8myc',
  logoAlt: 'Charni Logo',
  title: 'Charni POS',
  emailLabel: 'Email',
  emailPlaceholder: 'hello@charni.shop',
  passwordLabel: 'Password',
  passwordPlaceholder: '••••••••',
  forgotPasswordText: 'Forgot password?',
  loginButtonText: 'LOGIN',
  signUpPrompt: "Don't have an account?",
  signUpLinkText: 'Sign up',
  footerText: 'Handcrafted POS',
} as const;

export const REGISTER_DATA = {
  logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIPTRYjFiXcVj1MFOQGHBz5pYeWXu1SN31Dzygc61tqt7mYoMxuKC2xRxra_KjF5L8dGnhG1vSpp_pM8q4v6QRd411dom_-1e_wOTxIgLzW5J8Efed03TwWYpPGXJiJ_0W843u5YbjXAlmmi9XFDMgJ4Az29xQ4e3rPt72XNy3yqBSCw4uGtnBCO_qF5eqIVbfa-re7PvJS4Qq83wloAnW9mxyWZSZYXgS93zmbcYHkHCHT8nkeiabePmMYv8fqZSuuGCJhR3zjJg',
  logoAlt: 'Charni POS Logo',
  title: 'Create your Account',
  subtitle: 'Join the most delightful POS experience for boutique shops.',
  shopNameLabel: 'Shop Name',
  shopNamePlaceholder: 'E.g. Sweet Paw Pastries',
  emailLabel: 'Email',
  emailPlaceholder: 'your@email.com',
  passwordLabel: 'Password',
  passwordPlaceholder: '••••••••',
  signUpButtonText: 'SIGN UP',
  loginPrompt: 'Already part of the pack?',
  loginButtonText: 'LOG IN',
} as const;

export const OTP_DATA = {
  title: 'Verify your Email',
  subtitle: "We've sent a code to your inbox",
  verifyButtonText: 'VERIFY',
  resendPrompt: "Didn't receive a code?",
  resendButtonText: 'Resend Code',
} as const;

export const CREATE_SHOP_DATA = {
  mascotUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbyiX19xuIZvx4Umy28SEHwNyIsMEBHG4Ohwfh-sAMzyYyeToDku2D9BVHIr6zB8nfxSrt3EDuCJHYnU7Ni9y9Eq69xqy2Bcyf-mZXYRYBmPD38DcuKWY5MdLx8zj92lETJqcHOQgx_DkzFi0cw4RLSYCIc6yECELpmwFu95D40ZFKoUFyOOImdep1b74_anczNZO3KQoo2cthwql3s4xTNLjPpRlp1tXEgcSxj-GYCKW92aq7iY_e8MHIyMUNXt-Hu6XIwZcoocE',
  mascotAlt: 'Shop Creation Illustration',
  mascotSpeech: "Let's build a cozy shop together!",
  shopNameLabel: 'Shop Name',
  shopNamePlaceholder: 'Enter your shop name',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'Tell us about your boutique',
  createButtonText: 'CREATE SHOP',
  termsText: "By creating a shop, you agree to Charni's Terms of Service.",
} as const;

export const ADD_PRODUCT_DATA = {
  title: 'Add New Product',
  editTitle: 'Edit Product',
  mascotSpeech: "Let's add your first product.",
  tapPhotoText: 'Tap to add product photo',
  productNameLabel: 'Product Name',
  productNamePlaceholder: 'e.g., Puppy Bow Tie',
  saveButtonText: 'SAVE PRODUCT',
  saveChangesButtonText: 'SAVE CHANGES',
} as const;

export const SETTINGS_DATA = {
  headerTitle: 'Settings',
  sectionTitle: 'Account Management',
  menuItems: [
    {
      id: 'manage-account',
      title: 'Manage Account',
      description: 'Update your personal profile and security',
      iconName: 'User',
      action: 'alert',
      message: 'Account settings will be available in the next release! 🐾',
    },
    {
      id: 'manage-shop',
      title: 'Manage Shop',
      description: 'Open another boutique location',
      iconName: 'Store',
      action: 'navigate',
      target: 'create-shop',
    },
    {
      id: 'manage-event',
      title: 'Manage Event',
      description: 'Set up your booth for the next fair',
      iconName: 'Calendar',
      action: 'navigate',
      target: 'create-event',
    },
    {
      id: 'manage-members',
      title: 'Manage members',
      description: 'Manage your team and permissions',
      iconName: 'Users',
      action: 'alert',
      message: 'Team management features will be available in the next release! 🐾',
    },
  ],
  signOutText: 'Sign Out',
  signOutConfirm: 'Are you sure you want to sign out?',
} as const;

export const DASHBOARD2_DATA = {
  headerTitle: 'Shop Summary',
  totalSalesLabel: 'Total Sales',
  totalSalesValue: '฿142,500',
  totalSalesTrend: '+12.5% this month',
  activeShopsLabel: 'Active Shops',
  activeShopsValue: '3',
  eventsYearLabel: 'Events this year',
  eventsYearValue: '24',
  pastEventsLabel: 'Past Events',
  viewAllLabel: 'View All',
  createEventTitle: 'Create New Event',
  createEventSubtitle: 'Start logging sales and managing products for your next event.',
  events: [
    {
      id: 'craft-fest-2023',
      title: 'Craft Fest 2023',
      date: '12 - 14 Nov 2023',
      badge: 'Profit',
      badgeType: 'profit',
      totalSalesLabel: 'Total Sales',
      totalSalesValue: '฿45,200',
      netProfitLabel: 'Net Profit',
      netProfitValue: '+฿12,800',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA26HQI-qdJAvzLtbtiSB1a6t9L-M7mMng7ieiMdxU_iprolC16B8jxM4KCINz78XguSTlBa48kJ5M8bjmNj0oed6UkgLVSwUfxK7FYUCaujX1qK7erq6voKLWO9kLHTDK7oxMNr9D7IEqD5kNPhFhd3xEcROPYINGMBKaSribquSk4XXqCrDTDw7K8bbphMukuUDpALB9vC5cTMhvO_hBWPumziFEoHQd08ZXOlnXKAwNH2POhcH-Ssbt884610PJAcCcHv31qAz0',
    },
    {
      id: 'minimalist-popup',
      title: 'Minimalist Popup',
      date: '5 - 6 Oct 2023',
      badge: 'Accumulated Loss',
      badgeType: 'loss',
      totalSalesLabel: 'Total Sales',
      totalSalesValue: '฿8,400',
      netProfitLabel: 'Margin',
      netProfitValue: '-฿2,100',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzzCCWPKVC8c4C6G8DNKs-aBMj-bte3RJF3klOsKETSlbpGqGjO_qmZOsvWFefamanxVHGdzXfhb6d1ENwxKmf-jd5L-dYcXxxd9UYiQuHjnBbn2N76OZ3h2WMa8wNBO4AplTsD28XLokhxmADvJLSKpbl_rrFnyL4EYHvAHr17fv0yxUVt4FnSM7dLn-yM6nlCf7xMzETZ3sO4CnQjz17lYnW6s2ynTnm6VggDerW8ji3ELBvle34wKnPYwQEjEJusag4oXx9Cgk',
    },
  ],
} as const;




