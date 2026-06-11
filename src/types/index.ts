export interface AuthorDTO {
  _id: string;
  name: string;
  avatar?: string;
  image?: string;
  reputation?: number;
}

export interface RoundDTO {
  title: string;
  type?: string;
  description?: string;
  questions?: string[];
}

export interface PostDTO {
  _id: string;
  title: string;
  slug: string;
  company: string;
  companySlug: string;
  role: string;
  roleSlug: string;
  location?: string;
  experienceLevel: string;
  interviewType: string;
  interviewDate?: string | null;
  rounds: number;
  roundBreakdown?: RoundDTO[];
  outcome: string;
  difficulty: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  preparationResources?: string[];
  questions?: string[];
  tips?: string;
  content?: string;
  tags?: string[];
  isAnonymous: boolean;
  author?: AuthorDTO | null;
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  views: number;
  createdAt: string;
  userVote?: number; // -1 | 0 | 1 for the current viewer
  isBookmarked?: boolean;
  source?: string;
  sourceUrl?: string;
  sourceAuthor?: string;
}

export interface CommentDTO {
  _id: string;
  postId: string;
  parentCommentId?: string | null;
  content: string;
  author?: AuthorDTO | null;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  score: number;
  isEdited: boolean;
  isRemoved: boolean;
  createdAt: string;
  userVote?: number;
  replies?: CommentDTO[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface UserProfileDTO {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  image?: string;
  bio?: string;
  reputation: number;
  postKarma: number;
  commentKarma: number;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
  createdAt: string;
}
