export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    user_id: string;
    user_name: string;
    created_at: string;
    updated_at?: string;
    resolved_at?: string;
}

export interface TicketComment {
    id: string;
    ticket_id: string;
    user_id: string;
    user_name: string;
    comment: string;
    created_at: string;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    status: 'active' | 'inactive' | 'maintenance' | 'completed' | 'paused' | 'cancelled';
    service_type: string;
    progress: number;
    notes?: string;
    user_id?: string;
    user_name: string;
    start_date: string;
    end_date?: string;
    features?: string[];
    created_at: string;
}

export interface TeamMember {
    id: string;
    name: string;
    nickname: string;
    email: string;
    role: 'user' | 'team' | 'admin' | 'management';
    profile_picture?: string;
    totp_enabled?: boolean;
    created_at?: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assigned_to: string[];
    assigned_users?: { id: string; name: string; profile_picture?: string }[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'pending' | 'completed' | 'cancelled';
    due_date?: string;
    created_at: string;
    created_by?: string;
    created_by_name?: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    author_id: string;
    author_name: string;
    status: 'published' | 'draft' | 'archived';
    view_count: number;
    created_at: string;
    published_at?: string;
    updated_at?: string;
    tags?: string[];
}

export interface NewsItem {
    id: string;
    title: string;
    content: string;
    author_id: string;
    author_name: string;
    is_published: boolean;
    is_pinned?: boolean;
    pinned?: boolean;
    created_at: string;
    updated_at?: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    event_type: 'meeting' | 'reminder' | 'holiday' | 'deadline' | 'milestone' | 'other';
    all_day?: boolean;
    created_by: string;
}

export interface Absence {
    id: string;
    user_id: string;
    user_name: string;
    start_date: string;
    end_date: string;
    reason: string;
    description?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface ServiceStats {
    active_services: number;
    completed_services: number;
    total_value: number;
    active_value: number;
}

export interface Plan {
    id: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    category: string;
    target_date?: string;
    created_by: string;
    created_by_name: string;
    created_at: string;
}

export interface Schedule {
    id: string;
    user_id: string;
    user_name: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    schedule_type: string;
    created_at: string;
}

export interface DashboardStats {
    total_revenue?: number;
    active_subscriptions?: number;
    churn_rate?: number;
    completed_tasks: number;
    total_tasks: number;
    in_progress_tasks: number;
    pending_tasks: number;
    urgent_tasks: number;
    high_tasks: number;
    medium_tasks: number;
    low_tasks: number;
    team_members: number;
    total_members: number;
    clients: number;
    total_blog_posts: number;
    published_posts: number;
    total_events: number;
    upcoming_events: number;
    total_tickets: number;
    open_tickets: number;
    active_absences: number;
    daily_completion: { day: string; completed: number }[];
    daily_creation: { day: string; created: number }[];
}
