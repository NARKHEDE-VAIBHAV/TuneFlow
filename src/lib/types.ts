export type Song = {
  id: string;
  userId: string;
  title: string;
  author: string;
  singer: string;
  description: string;
  tags: string[];
  status: 'Approved' | 'Declined' | 'Waiting for Action';
  submittedAt: Date;
  coverArt: string;
  audioUrl: string;
  bannerUrl: string;
  actionedBy?: string;
  actionedAt?: Date;
  totalEarnings?: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  password?: string;
  role: 'User' | 'Admin' | 'Super Admin';
  accountType: 'Normal Artist' | 'Label';
  subscriptionExpiry?: Date;
  payoutRate: number;
};

export type TicketReply = {
  id: string;
  userId: string;
  message: string;
  createdAt: Date;
};

export type Ticket = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  photoUrl?: string;
  status: 'Open' | 'Closed';
  submittedAt: Date;
  replies: TicketReply[];
};

export type Withdrawal = {
    id: string;
    userId: string;
    amount: number;
    upiId: string;
    upiName: string;
    status: 'Pending' | 'Completed' | 'Failed';
    requestedAt: Date;
    processedAt?: Date;
    processedBy?: string;
};

export type Credit = {
  id: string;
  userId: string;
  adminId: string;
  amount: number;
  note: string;
  createdAt: Date;
}

export type PriceSettings = {
  'Normal Artist': number;
  'Label': number;
};

export type AppSettings = {
  prices: PriceSettings;
};

// This is the in-memory/runtime representation of the DB
export interface MockDb {
    users: User[];
    songs: Song[];
    tickets: Ticket[];
    withdrawals: Withdrawal[];
    credits: Credit[];
    settings: AppSettings;
}

// For unified display in the wallet
export type UnifiedTransaction = (
    { type: 'withdrawal', adminName?: string } & Withdrawal
) | (
    { type: 'credit'; adminName?: string } & Credit
)
